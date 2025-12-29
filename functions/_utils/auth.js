/**
 * 인증 유틸리티
 * 간단한 쿠키 기반 인증 (토큰 없음)
 */

/**
 * 인증 체크 - 쿠키에 로그인 플래그만 확인
 */
export function checkAuth(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return false;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const loginCookie = cookies.find(c => c.startsWith('admin_logged_in='));
  
  if (!loginCookie) return false;
  
  const value = loginCookie.split('=')[1];
  return value === '1';
}

/**
 * 인증 실패 응답
 */
export function authErrorResponse() {
  return new Response(JSON.stringify({ 
    success: false,
    error: 'Unauthorized',
    message: '로그인이 필요합니다.' 
  }), {
    status: 401,
    headers: { 
      'Content-Type': 'application/json'
    }
  });
}


