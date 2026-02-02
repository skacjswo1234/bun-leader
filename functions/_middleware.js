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
    // 정적 리소스(styles, scripts)는 인증 체크 없이 통과
    if (url.pathname.startsWith('/admin/styles/') || 
        url.pathname.startsWith('/admin/scripts/') ||
        url.pathname.startsWith('/admin/images/')) {
      return next();
    }
    
    // 로그인 페이지는 인증 체크 없이 통과
    if (url.pathname === '/admin/login.html' || url.pathname === '/admin/login') {
      return next();
    }
    
    // 다른 관리자 페이지는 인증 체크
    if (!checkAuth(request)) {
      // 미인증 시 로그인 페이지로 리다이렉트
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${url.origin}/admin/login.html`
        }
      });
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
    'xn--9m1b22at9hpuer8llia.com': 'marketing',  // 분양리더애드.com (marketing 전용 도메인)
    'www.xn--9m1b22at9hpuer8llia.com': 'marketing',
    '분양리더애드.com': 'marketing',  // 한글 도메인 (punycode로 변환되어 올 수 있음)
    'xn--h50bt0vxig27n8la.com': 'bun-partner',  // 분양파트너.com (punycode)
    'www.xn--h50bt0vxig27n8la.com': 'bun-partner',  // www.분양파트너.com (punycode)
    '분양파트너.com': 'bun-partner',  // 분양파트너 한글 도메인
    'www.분양파트너.com': 'bun-partner',  // www.분양파트너 한글 도메인
  };

  // 메인 홈페이지 도메인 (루트 index.html 표시)
  const mainDomainList = [
    'bunyangleader.com',
    'www.bunyangleader.com'
  ];

  // 메인 홈페이지 도메인인지 확인
  const isMainDomain = mainDomainList.includes(hostname);

  // 도메인에 매핑된 사이트 찾기
  const siteId = domainMapping[hostname];

  // 루트 경로 처리
  if (url.pathname === '/' || url.pathname === '') {
    // 메인 홈페이지 도메인(bunyangleader.com)은 루트 index.html 표시
    if (isMainDomain) {
      return next(); // 루트 index.html 표시
    }
    // marketing 도메인으로 접속한 경우 marketing 폴더의 index.html로 리다이렉트
    if (siteId === 'marketing') {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': `${url.origin}/sites/marketing/`
        }
      });
    }
    // 별도 도메인으로 접속한 경우 해당 사이트로 리다이렉트
    if (siteId) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': `${url.origin}/sites/${siteId}/`
        }
      });
    }
    // 기본적으로 루트 index.html 표시 (bunyangleader.com 등)
    return next();
  }

  // 매핑된 도메인이 있고, /sites/ 경로가 아닌 경우
  // 예: band-program.com/program.html → /sites/band-program/program.html
  // 예: 분양리더애드.com/gdn.html → /sites/marketing/gdn.html
  if (siteId && !url.pathname.startsWith('/sites/') && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/admin/') && !url.pathname.startsWith('/shared/')) {
    // marketing 사이트의 경우, HTML 파일들도 처리
    if (siteId === 'marketing') {
      // marketing 폴더에 있는 파일들 (.html, 이미지 등)
      // 정적 리소스는 그대로 경로 매핑
      const newPath = url.pathname.startsWith('/') 
        ? `/sites/marketing${url.pathname}`
        : `/sites/marketing/${url.pathname}`;
      return new Response(null, {
        status: 301,
        headers: {
          'Location': `${url.origin}${newPath}`
        }
      });
    }
    // 다른 사이트는 기존 로직대로 처리
    const newPath = url.pathname.startsWith('/') 
      ? `/sites/${siteId}${url.pathname}`
      : `/sites/${siteId}/${url.pathname}`;
    return new Response(null, {
      status: 301,
      headers: {
        'Location': `${url.origin}${newPath}`
      }
    });
  }

  // 기본 동작 (기존 파일 서빙)
  // Cloudflare Pages가 자동으로 디렉토리 경로를 index.html로 처리하므로
  // 명시적 리다이렉트는 필요 없음
  const response = await next();
  
  // bun-partner 사이트의 HTML 응답인 경우 메타 태그 동적 업데이트
  // siteId가 있거나, /sites/bun-partner/ 경로인 경우 처리
  const isBunPartnerSite = siteId === 'bun-partner' || url.pathname.startsWith('/sites/bun-partner/');
  
  if (isBunPartnerSite && response.headers.get('content-type')?.includes('text/html')) {
    let html = await response.text();
    
    // 현재 호스트명으로 메타 태그 URL 업데이트 (www 포함)
    const currentOrigin = url.origin;
    const imageUrl = `${currentOrigin}/sites/bun-partner/images/partner-logo.png`;
    
    // 메타 태그 URL들을 현재 도메인으로 교체
    html = html.replace(
      /https:\/\/xn--h50bt0vxig27n8la\.com\//g,
      `${currentOrigin}/`
    );
    
    // og:image, twitter:image 등 이미지 URL도 업데이트 (현재 도메인 + 올바른 경로)
    html = html.replace(
      /https:\/\/xn--h50bt0vxig27n8la\.com\/sites\/bun-partner\/images\/partner-logo\.png/g,
      imageUrl
    );
    
    // 이전 경로 형식도 지원 (하위 호환성)
    html = html.replace(
      /https:\/\/xn--h50bt0vxig27n8la\.com\/images\/partner-logo\.png/g,
      imageUrl
    );
    
    // 상대 경로로 된 이미지도 절대 경로로 변경
    html = html.replace(
      /content="\/images\/partner-logo\.png"/g,
      `content="${imageUrl}"`
    );
    
    html = html.replace(
      /content="\/sites\/bun-partner\/images\/partner-logo\.png"/g,
      `content="${imageUrl}"`
    );
    
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  return response;
}

