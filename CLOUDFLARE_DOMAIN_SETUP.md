# Cloudflare Pages 커스텀 도메인 설정 가이드

## 현재 설정
- **프로젝트**: bun-leader
- **Pages URL**: bun-leader.pages.dev
- **커스텀 도메인**: xn--9m1b22at9hd2c62blxw.com (한글 도메인 퓨니코드)

## 1. Cloudflare Pages에서 커스텀 도메인 추가

### 단계별 설정

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com 접속
   - Workers & Pages → 프로젝트 선택 (bun-leader)

2. **커스텀 도메인 추가**
   - 프로젝트 설정 페이지에서 **"Custom domains"** 섹션 찾기
   - **"Set up a custom domain"** 또는 **"Add custom domain"** 클릭
   - 도메인 입력: `xn--9m1b22at9hd2c62blxw.com`
   - **www 서브도메인도 추가**: `www.xn--9m1b22at9hd2c62blxw.com`

3. **도메인 확인**
   - Cloudflare가 자동으로 DNS 레코드를 생성하거나 확인 요청
   - 도메인이 Cloudflare 계정에 연결되어 있어야 함

## 2. DNS 설정 (Cloudflare DNS 사용 시)

### 자동 설정 (권장)
- Cloudflare Pages가 자동으로 DNS 레코드를 생성합니다
- **CNAME 레코드**가 자동으로 추가됩니다:
  ```
  xn--9m1b22at9hd2c62blxw.com → bun-leader.pages.dev
  www.xn--9m1b22at9hd2c62blxw.com → bun-leader.pages.dev
  ```

### 수동 설정 (필요한 경우)

1. **Cloudflare DNS 대시보드**
   - 도메인 선택 → **DNS** 메뉴

2. **CNAME 레코드 추가**
   ```
   Type: CNAME
   Name: @ (또는 루트 도메인)
   Target: bun-leader.pages.dev
   Proxy status: Proxied (주황색 구름)
   TTL: Auto
   ```

3. **www 서브도메인 추가**
   ```
   Type: CNAME
   Name: www
   Target: bun-leader.pages.dev
   Proxy status: Proxied (주황색 구름)
   TTL: Auto
   ```

## 3. DNS 설정 (외부 DNS 사용 시)

도메인이 다른 DNS 제공업체를 사용하는 경우:

### CNAME 레코드 추가
```
Type: CNAME
Name: @ (또는 루트 도메인)
Value: bun-leader.pages.dev
TTL: 3600 (또는 권장값)
```

### www 서브도메인
```
Type: CNAME
Name: www
Value: bun-leader.pages.dev
TTL: 3600
```

**참고**: 일부 DNS 제공업체는 루트 도메인(@)에 CNAME을 허용하지 않습니다. 이 경우:
- **A 레코드** 사용 (Cloudflare Pages IP 주소 확인 필요)
- 또는 **ALIAS/ANAME 레코드** 사용 (지원하는 경우)

## 4. SSL/TLS 설정

Cloudflare Pages는 자동으로 SSL 인증서를 발급합니다:
- **자동 HTTPS**: 도메인 추가 후 자동으로 활성화
- **항상 HTTPS 사용**: Cloudflare 설정에서 "Always Use HTTPS" 활성화 권장

## 5. 도메인 확인 및 테스트

### 확인 사항
1. **DNS 전파 확인** (보통 5-30분 소요)
   ```bash
   # 터미널에서 확인
   nslookup xn--9m1b22at9hd2c62blxw.com
   dig xn--9m1b22at9hd2c62blxw.com
   ```

2. **SSL 인증서 확인** (보통 5-10분 소요)
   - https://xn--9m1b22at9hd2c62blxw.com 접속 테스트
   - 브라우저에서 자물쇠 아이콘 확인

3. **사이트 동작 확인**
   - https://xn--9m1b22at9hd2c62blxw.com 접속
   - 자동으로 `/sites/band-program/`로 리다이렉트되는지 확인

## 6. 문제 해결

### 도메인이 작동하지 않는 경우

1. **DNS 전파 대기**
   - 최대 48시간까지 소요될 수 있음
   - 보통 5-30분 내 완료

2. **Cloudflare Pages 대시보드 확인**
   - Custom domains 섹션에서 상태 확인
   - "Active" 상태인지 확인

3. **DNS 레코드 확인**
   - CNAME이 올바르게 설정되었는지 확인
   - Target이 `bun-leader.pages.dev`인지 확인

4. **캐시 클리어**
   - 브라우저 캐시 삭제
   - Cloudflare 캐시 퍼지 (필요한 경우)

## 7. 추가 설정 (선택사항)

### Cloudflare 설정 최적화
1. **Speed** → **Auto Minify**: 활성화
2. **Caching** → **Caching Level**: Standard
3. **SSL/TLS** → **Encryption mode**: Full (strict)
4. **SSL/TLS** → **Always Use HTTPS**: On

### 환경 변수
- 프로덕션 환경에서만 커스텀 도메인 사용
- 미리보기 배포는 여전히 `*.pages.dev` 사용

## 참고
- 도메인 설정 후 코드의 `_middleware.js`에 도메인 매핑이 이미 추가되어 있습니다
- 데이터베이스의 `sites` 테이블에도 도메인 정보를 업데이트할 수 있습니다 (관리자 API 사용)

