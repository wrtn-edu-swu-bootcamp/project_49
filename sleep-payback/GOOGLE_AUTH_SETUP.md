# 🔐 구글 로그인 설정 가이드

## 📝 준비물
- 구글 계정
- 5-10분의 시간

---

## 1️⃣ Google Cloud Console 설정

### Step 1: 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단의 프로젝트 선택 → **"새 프로젝트"** 클릭
3. 프로젝트 이름: `Sleep-Payback` (아무거나 OK)
4. **만들기** 클릭

### Step 2: OAuth 동의 화면 설정
1. 왼쪽 메뉴 → **"API 및 서비스"** → **"OAuth 동의 화면"**
2. User Type: **외부** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: `Sleep Payback`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. **저장 후 계속** 반복해서 완료

### Step 3: OAuth 클라이언트 ID 생성
1. 왼쪽 메뉴 → **"사용자 인증 정보"**
2. 상단 **"+ 사용자 인증 정보 만들기"** → **"OAuth 클라이언트 ID"**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `Sleep Payback Web`
5. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. **만들기** 클릭
7. ✅ **클라이언트 ID**와 **클라이언트 보안 비밀** 복사해두기!

---

## 2️⃣ .env.local 파일 생성

`sleep-payback` 폴더 안에 `.env.local` 파일을 만들고:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=여기에-클라이언트-ID-붙여넣기
GOOGLE_CLIENT_SECRET=여기에-클라이언트-비밀-붙여넣기

# 로그인 기능 활성화
NEXT_PUBLIC_ENABLE_AUTH=true
```

### NEXTAUTH_SECRET 생성 방법:
**Windows PowerShell**에서:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

또는 온라인: https://generate-secret.vercel.app/32

---

## 3️⃣ 서버 재시작

터미널에서:
```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

---

## 4️⃣ 테스트

1. http://localhost:3000 접속
2. 우측 상단 **로그인 버튼** 클릭
3. 구글 계정 선택
4. ✅ 로그인 완료!

---

## ❓ 자주 묻는 질문

### Q: API 키가 아니라 OAuth인가요?
A: 네! 구글 로그인은 API 키가 아니라 **OAuth 2.0 클라이언트 ID**를 사용해요.

### Q: 배포할 때는?
A: 리디렉션 URI에 배포 URL 추가:
```
https://yourdomain.com/api/auth/callback/google
```

### Q: 로그인 없이도 사용할 수 있나요?
A: 네! `.env.local` 없이도 모든 기능이 작동해요!

---

## 🎉 완료!

이제 로그인하면 여러 기기에서 데이터 동기화가 가능해요!
