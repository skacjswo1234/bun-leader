/**
 * Pages Functions Middleware
 * 도메인별로 다른 사이트를 라우팅
 */
import { checkAuth } from './_utils/auth.js';

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const hostname = url.hostname;

  // API 요청은 그대로 통과
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  // 관리자 화면 처리
  if (url.pathname.startsWith('/admin/')) {
    // 로그인 페이지는 인증 체크 없이 통과
    if (url.pathname === '/admin/login.html' || url.pathname === '/admin/login') {
      return next();
    }
    
    // 다른 관리자 페이지는 인증 체크
    if (!checkAuth(request)) {
      // 미인증 시 로그인 페이지로 리다이렉트
      return Response.redirect(`${url.origin}/admin/login.html`, 302);
    }
    
    return next();
  }

  // 공통 리소스는 그대로 통과
  if (url.pathname.startsWith('/shared/')) {
    return next();
  }

  // 도메인별 사이트 매핑
  // 별도 도메인으로 접속 시 해당 사이트로 자동 리다이렉트
  const domainMapping = {
    'band-program.com': 'band-program',
    'www.band-program.com': 'band-program',
    'xn--9m1b22at9hd2c62blxw.com': 'band-program',  // band-program 전용 도메인
    'www.xn--9m1b22at9hd2c62blxw.com': 'band-program',
  };

  // 도메인에 매핑된 사이트 찾기
  const siteId = domainMapping[hostname];

  // 루트 경로 처리
  if (url.pathname === '/' || url.pathname === '') {
    // 별도 도메인으로 접속한 경우 해당 사이트로 리다이렉트
    if (siteId) {
      return Response.redirect(`${url.origin}/sites/${siteId}/`, 301);
    }
    // 루트 도메인은 허브(index.html) 표시
    // next()로 계속 진행하여 루트 index.html 표시
  }

  // 매핑된 도메인이 있고, /sites/ 경로가 아닌 경우
  // 예: band-program.com/program.html → /sites/band-program/program.html
  if (siteId && !url.pathname.startsWith('/sites/') && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/admin/') && !url.pathname.startsWith('/shared/')) {
    // 해당 사이트 경로로 리다이렉트
    const newPath = url.pathname.startsWith('/') 
      ? `/sites/${siteId}${url.pathname}`
      : `/sites/${siteId}/${url.pathname}`;
    return Response.redirect(`${url.origin}${newPath}`, 301);
  }

  // 기본 동작 (기존 파일 서빙)
  // Cloudflare Pages가 자동으로 디렉토리 경로를 index.html로 처리하므로
  // 명시적 리다이렉트는 필요 없음
  return next();
}

