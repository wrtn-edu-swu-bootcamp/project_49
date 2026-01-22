# 🌌 Star 테마 추가 - 복구 가이드

## 📦 백업 파일 (V2)
- `app/page.v2.backup.tsx` - 전문적 디자인 (이전 버전)
- `app/globals.v2.backup.css` - 전문적 스타일 (이전 버전)

## 📦 백업 파일 (V1)
- `app/page.backup.tsx` - 최초 디자인
- `app/globals.backup.css` - 최초 스타일

## 🔄 복구 방법

### V2로 복구 (Star 테마 제거, 전문적 디자인)
```powershell
cd c:\Users\PC\Downloads\project.real\sleep-payback
Copy-Item app\page.v2.backup.tsx app\page.tsx -Force
Copy-Item app\globals.v2.backup.css app\globals.css -Force
```

### V1으로 복구 (최초 디자인)
```powershell
cd c:\Users\PC\Downloads\project.real\sleep-payback
Copy-Item app\page.backup.tsx app\page.tsx -Force
Copy-Item app\globals.backup.css app\globals.css -Force
```

## 🌟 Star 테마 특징

### 디자인 컨셉
- **우주 배경**: 딥 블루/퍼플 그라데이션
- **별빛 애니메이션**: 미세하게 움직이는 별들
- **네온 글로우**: 사이버펑크 느낌의 밝은 파란색
- **그라데이션 텍스트**: 타이틀에 컬러 그라데이션
- **glassmorphism**: 반투명 카드 + 블러 효과

### 색상 팔레트
```css
--bg-primary: #0a0a1e        /* 딥 스페이스 */
--bg-secondary: #121230      /* 다크 네이비 */
--text-primary: #e8f4ff      /* 크리스탈 화이트 */
--text-secondary: #8ba4c7    /* 소프트 블루 */
--accent: #4FD1FF            /* 네온 블루 */
--success: #00d9a3           /* 에메랄드 */
--warning: #ffc44d           /* 골드 */
--danger: #ff6b9d            /* 핑크 */
```

### 특수 효과
1. **Starfield Background**: 움직이는 별 배경
2. **Glow Effects**: 버튼/카드에 네온 글로우
3. **Gradient Text**: 제목에 그라데이션
4. **Backdrop Blur**: 반투명 효과

## 🎨 테마 전환

버튼 클릭 순서:
1. **Day** (☀️) → 깔끔한 화이트
2. **Night** (🌙) → 다크 모드
3. **Star** (✨) → 우주 테마
4. Day로 다시 순환

## 🚀 특징

### 감각적인 요소
- 볼드한 색상 대비
- 그라데이션 활용
- 동적인 애니메이션
- 네온 글로우 효과

### 깔끔함 유지
- 미니멀한 레이아웃
- 절제된 애니메이션
- 명확한 타이포그래피
- 직관적인 UI

## 📝 주의사항
- Star 테마는 약간의 GPU 사용 (별 애니메이션)
- 성능이 걱정되면 V2로 복구 가능
- 백업 파일은 절대 삭제하지 마세요!
