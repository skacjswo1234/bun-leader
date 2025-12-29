/**
 * 로그인 API
 * /api/auth/login
 */
import { corsHeaders } from '../../_utils/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 데이터베이스 바인딩 확인
    const db = env.DB || env['bun-leader-db'];
    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database binding not found' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '비밀번호를 입력해주세요.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 테이블에서 관리자 비밀번호 조회
    const admin = await db.prepare(
      'SELECT password FROM admins WHERE username = ? LIMIT 1'
    )
    .bind('admin')
    .first();

    if (!admin) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '관리자 계정이 없습니다.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 비밀번호 비교
    if (password !== admin.password) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '비밀번호가 올바르지 않습니다.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 간단한 쿠키 설정 (로그인 플래그만)
    const cookie = `admin_logged_in=1; Path=/; Max-Age=2592000; SameSite=Strict; HttpOnly; Secure`;

    return new Response(JSON.stringify({ 
      success: true,
      message: '로그인 성공'
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}


