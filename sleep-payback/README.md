# Sleep-Payback

AI 기반 수면 부채 관리 웹 서비스

## 프로젝트 개요

Sleep-Payback은 현대인의 만성적인 수면 부족 문제를 '수면 부채 상환'이라는 개념으로 해결하는 반응형 웹 서비스입니다. 사용자가 입력한 데이터를 바탕으로 AI가 컨디션 회복을 위한 최적의 상환 계획을 제안합니다.

## 주요 기능

- **수면 부채 시각화**: 실시간으로 업데이트되는 원형 게이지
- **AI 기반 분석**: OpenAI API를 활용한 맞춤형 회복 전략
- **집중력 예상**: 오늘의 컨디션 점수 (0-100)
- **전략적 낮잠 가이드**: 최적 시간 및 분량 제안
- **카페인 관리**: 섭취 중단 권장 시간
- **취침 시간 추천**: 개인화된 수면 스케줄

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI API

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 OpenAI API 키를 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

> **참고**: API 키가 없어도 더미 데이터로 서비스를 체험할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
sleep-payback/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # AI 분석 API 엔드포인트
│   ├── components/
│   │   ├── AIReport.tsx          # AI 리포트 컴포넌트
│   │   ├── InputForm.tsx         # 데이터 입력 폼
│   │   └── SleepDebtGauge.tsx    # 수면 부채 게이지
│   ├── types/
│   │   └── index.ts              # TypeScript 타입 정의
│   ├── globals.css               # 글로벌 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지
├── public/                       # 정적 파일
├── .env.local                    # 환경 변수 (gitignore)
├── .env.local.example            # 환경 변수 예시
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
└── package.json                  # 프로젝트 정보 및 의존성
```

## 주요 기능 설명

### 수면 부채 계산

```typescript
수면 부채 = 목표 수면 시간 - 실제 수면 시간
```

### AI 분석 항목

1. **집중력 예상 점수**: 수면 부채, 카페인, 피로도를 종합 분석
2. **전략적 낮잠**: 부채 정도에 따른 최적 낮잠 시간 및 길이
3. **카페인 중단 시간**: 수면의 질 향상을 위한 섭취 제한
4. **권장 취침 시간**: 회복을 위한 맞춤형 수면 스케줄
5. **실천 목록**: 오늘 당장 실천 가능한 행동 지침

## 과학적 근거

- 1시간의 수면 부채 회복에는 약 4일 소요
- 카페인 반감기는 5-6시간
- 효과적인 낮잠은 15-20분
- 최적 낮잠 시간은 오후 2-3시

## 배포

### Vercel 배포

```bash
npm run build
```

Vercel에서 자동으로 Next.js 프로젝트를 감지하고 배포합니다.

환경 변수는 Vercel 대시보드에서 설정하세요.

## 라이선스

MIT License

## 제작

서울여자대학교 부트캠프 프로젝트

---

**Sleep-Payback** - 수면 빚에서 자유로운 삶, 수면 상환 매니저와 함께
