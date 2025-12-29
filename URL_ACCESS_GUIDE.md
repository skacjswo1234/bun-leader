# URL 접근 가이드

## 배포 후 접근 가능한 URL

### 기본 Pages URL

배포 후 Cloudflare Pages가 제공하는 URL:
- `https://4462807b.bun-leader.pages.dev` (또는 할당된 URL)

### 접근 방법

#### 1. 루트 접속 (가장 간단) ✅

```
https://4462807b.bun-leader.pages.dev/
```

**자동으로:**
- Middleware가 감지
- `/sites/band-program/`로 리다이렉트
- band-program 사이트 표시

#### 2. 직접 경로 접속

```
https://4462807b.bun-leader.pages.dev/sites/band-program/
또는
https://4462807b.bun-leader.pages.dev/sites/band-program/index.html
```

**둘 다 동일한 결과:**
- band-program 사이트 표시
- `index.html`은 생략 가능 (자동 인식)

#### 3. 다른 페이지 접속

```
https://4462807b.bun-leader.pages.dev/sites/band-program/program.html
https://4462807b.bun-leader.pages.dev/sites/band-program/guide.html
```

### 관리자 화면

```
https://4462807b.bun-leader.pages.dev/admin/
```

### API 엔드포인트

```
https://4462807b.bun-leader.pages.dev/api/inquiries
https://4462807b.bun-leader.pages.dev/api/admin/stats
```

## URL 구조 요약

```
루트 (/)
  ↓ (자동 리다이렉트)
/sites/band-program/
  ├── index.html (홍보대행)
  ├── program.html (프로그램판매)
  └── guide.html (권장사항)

/admin/ (관리자 화면)
/api/ (API 엔드포인트)
```

## 권장 접근 방법

**가장 간단:**
```
https://4462807b.bun-leader.pages.dev/
```
→ 자동으로 band-program 사이트로 이동

**직접 접근:**
```
https://4462807b.bun-leader.pages.dev/sites/band-program/
```
→ 바로 band-program 사이트 표시

## 커스텀 도메인 설정 후

커스텀 도메인(`band-program.com`)을 설정하면:

```
band-program.com/
```
→ 자동으로 band-program 사이트 표시

