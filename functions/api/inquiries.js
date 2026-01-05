/**
 * 문의 API - Cloudflare Pages Functions
 * /api/inquiries 엔드포인트
 */
import { corsHeaders } from '../_utils/cors.js';
import { sendTelegramMessage, formatInquiryNotification } from '../_utils/telegram.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 데이터베이스 바인딩 확인
    const db = env.DB || env['bun-leader-db'];
    if (!db) {
      return new Response(JSON.stringify({ 
        error: 'Database binding not found. Please check D1 binding name in Cloudflare Pages settings.',
        availableBindings: Object.keys(env).filter(key => key.includes('DB') || key.includes('db') || key.includes('database'))
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      // 문의 생성
      const body = await request.json();
      const { site_id, name, contact, message, custom_fields } = body;

      if (!site_id || !name || !contact) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: site_id, name, contact are required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // custom_fields가 객체로 오면 JSON 문자열로 변환
      let customFieldsJson = null;
      if (custom_fields) {
        customFieldsJson = typeof custom_fields === 'string' 
          ? custom_fields 
          : JSON.stringify(custom_fields);
      }

      const result = await db.prepare(
        `INSERT INTO inquiries (site_id, name, contact, message, custom_fields, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
      )
      .bind(site_id, name, contact, message || null, customFieldsJson)
      .run();

      // 텔레그램 알림 전송 (band-program 및 marketing 사이트인 경우)
      let telegramStatus = null;
      if (site_id === 'band-program' || site_id === 'marketing') {
        const telegramBotToken = env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = env.TELEGRAM_CHAT_ID;
        
        console.log('[Telegram] 알림 전송 시도 - site_id:', site_id);
        console.log('[Telegram] 환경 변수 확인 - BOT_TOKEN:', telegramBotToken ? '설정됨' : '없음', 'CHAT_ID:', telegramChatId ? '설정됨' : '없음');
        
        if (telegramBotToken && telegramChatId) {
          const inquiryData = {
            site_id,
            name,
            contact,
            message,
            custom_fields: customFieldsJson
          };
          
          const notificationMessage = formatInquiryNotification(inquiryData);
          console.log('[Telegram] 알림 메시지 생성 완료');
          console.log('[Telegram] 메시지 내용:', notificationMessage.substring(0, 100) + '...');
          
          // 텔레그램 전송 시도 (응답을 기다림)
          try {
            const telegramSuccess = await sendTelegramMessage(telegramBotToken, telegramChatId, notificationMessage);
            if (telegramSuccess) {
              console.log('[Telegram] ✅ 알림 전송 성공');
              telegramStatus = 'success';
            } else {
              console.error('[Telegram] ❌ 알림 전송 실패 - API 응답 오류');
              telegramStatus = 'failed';
            }
          } catch (error) {
            console.error('[Telegram] ❌ 알림 전송 실패:', error);
            console.error('[Telegram] 에러 상세:', error.message || error);
            telegramStatus = 'error';
          }
        } else {
          console.warn('[Telegram] ⚠️ 환경 변수가 설정되지 않음 - BOT_TOKEN 또는 CHAT_ID가 없습니다');
          console.warn('[Telegram] 사용 가능한 환경 변수:', Object.keys(env).filter(key => key.includes('TELEGRAM') || key.includes('telegram')));
          telegramStatus = 'not_configured';
        }
      } else {
        console.log('[Telegram] 알림 전송 건너뜀 - site_id:', site_id, '(band-program 또는 marketing이 아님)');
        telegramStatus = 'skipped';
      }

      return new Response(JSON.stringify({ 
        success: true,
        id: result.meta.last_row_id,
        telegram: {
          sent: telegramStatus === 'success',
          status: telegramStatus,
          message: telegramStatus === 'success' ? '텔레그램 알림이 전송되었습니다.' :
                   telegramStatus === 'failed' ? '텔레그램 알림 전송에 실패했습니다.' :
                   telegramStatus === 'error' ? '텔레그램 알림 전송 중 오류가 발생했습니다.' :
                   telegramStatus === 'not_configured' ? '텔레그램 알림이 설정되지 않았습니다.' :
                   telegramStatus === 'skipped' ? '텔레그램 알림 대상이 아닙니다.' :
                   '알 수 없음'
        }
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'GET') {
      // 문의 조회
      const site_id = url.searchParams.get('site_id');
      
      let query = 'SELECT * FROM inquiries';
      let params = [];

      if (site_id) {
        query += ' WHERE site_id = ?';
        params.push(site_id);
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const result = await db.prepare(query)
        .bind(...params)
        .all();

      return new Response(JSON.stringify({ 
        success: true,
        data: result.results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Inquiries API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

