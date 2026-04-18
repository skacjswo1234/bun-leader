/**
 * 솔라피 REST API (Cloudflare Workers / Web Crypto)
 * @see https://github.com/solapi/solapi-nodejs/blob/master/src/lib/authenticator.ts
 */

const SOLAPI_BASE = 'https://api.solapi.com';
const SALT_ALPHABET =
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function genSalt(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SALT_ALPHABET[bytes[i] % SALT_ALPHABET.length];
  }
  return out;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getSolapiAuthHeader(apiKey, apiSecret) {
  const salt = genSalt(32);
  const date = new Date().toISOString();
  const hmacData = date + salt;
  const signature = await hmacSha256Hex(apiSecret, hmacData);
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function solapiFetch(apiKey, apiSecret, path, { method = 'POST', body } = {}) {
  const auth = await getSolapiAuthHeader(apiKey, apiSecret);
  const headers = {
    Authorization: auth,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${SOLAPI_BASE}/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json.errorMessage || json.message || res.statusText || 'Solapi error');
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/**
 * MMS 이미지 업로드 → { fileId }
 */
export async function solapiUploadMmsFile(apiKey, apiSecret, base64File, name = 'image.jpg') {
  return solapiFetch(apiKey, apiSecret, 'storage/v1/files', {
    method: 'POST',
    body: {
      file: base64File,
      type: 'MMS',
      name,
    },
  });
}

/**
 * @param {Array<{ to: string, text?: string, subject?: string, type?: string, imageId?: string }>} messages
 */
export async function solapiSendManyDetail(apiKey, apiSecret, messages, from) {
  const payload = {
    messages: messages.map((m) => ({
      ...m,
      from: m.from || from,
    })),
    allowDuplicates: false,
  };
  return solapiFetch(apiKey, apiSecret, 'messages/v4/send-many/detail', {
    method: 'POST',
    body: payload,
  });
}

export function normalizeKoreanPhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('82')) d = '0' + d.slice(2);
  if (/^01[0-9]\d{7,8}$/.test(d)) return d;
  return d.length >= 10 ? d : '';
}
