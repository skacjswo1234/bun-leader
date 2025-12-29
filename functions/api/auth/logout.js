/**
 * 로그아웃 API
 * /api/auth/logout
 */
import { corsHeaders } from '../../_utils/cors.js';

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 쿠키 삭제
  const cookie = 'admin_logged_in=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly; Secure';

  return new Response(JSON.stringify({ 
    success: true,
    message: '로그아웃 성공'
  }), {
    status: 200,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}


