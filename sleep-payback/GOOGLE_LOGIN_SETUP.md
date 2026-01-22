# Sleep Debt - 구글 로그인 설정 가이드

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "사용자 인증 정보"로 이동
4. "OAuth 2.0 클라이언트 ID" 생성
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/callback/google` (개발용)
   - `https://yourdomain.com/api/auth/callback/google` (배포 시)

## 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```
OPENAI_API_KEY=your_openai_api_key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=openssl-rand-base64-32-로-생성한-랜덤-문자열

GOOGLE_CLIENT_ID=구글-클라우드-콘솔에서-발급받은-ID
GOOGLE_CLIENT_SECRET=구글-클라우드-콘솔에서-발급받은-시크릿
```

## 3. NEXTAUTH_SECRET 생성

터미널에서 실행:
```bash
openssl rand -base64 32
```

또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

## 4. 서버 재시작

환경 변수 설정 후 개발 서버를 재시작하세요:
```bash
npm run dev
```

## 5. 로그인 테스트

1. http://localhost:3000 접속
2. 자동으로 로그인 페이지로 리디렉션
3. "Google로 시작하기" 버튼 클릭
4. 구글 계정 선택
5. 메인 페이지로 이동
