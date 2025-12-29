/**
 * Pages Functions Middleware
 * 도메인별로 다른 사이트를 라우팅
 */
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const hostname = url.hostname;

  // API 요청은 그대로 통과
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  // 관리자 화면은 그대로 통과
  if (url.pathname.startsWith('/admin/')) {
    return next();
  }

  // 공통 리소스는 그대로 통과
  if (url.pathname.startsWith('/shared/')) {
    return next();
  }

  // 도메인별 사이트 매핑
  const domainMapping = {
    'band-program.com': 'band-program',
    'www.band-program.com': 'band-program',
  };

  // 도메인에 매핑된 사이트 찾기
  const siteId = domainMapping[hostname];

  // 루트 경로 처리
  if (url.pathname === '/' || url.pathname === '') {
    // 도메인 매핑이 있으면 해당 사이트로 리다이렉트
    // 없으면 루트 index.html (사이트 허브) 표시
    if (siteId) {
      return Response.redirect(`${url.origin}/sites/${siteId}/`, 301);
    }
    // 도메인 매핑이 없으면 기본 index.html 표시 (next()로 계속 진행)
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
  return next();
}

