# Vercel 환경변수 추가 가이드 (초보자용)

## 📍 1단계: Vercel 대시보드 접속

1. 브라우저를 엽니다 (Chrome, Safari 등)
2. 주소창에 다음을 입력하고 Enter:
   ```
   https://vercel.com
   ```
3. GitHub 계정으로 로그인합니다

---

## 📍 2단계: 프로젝트 선택

1. 로그인 후 화면이 나타납니다
2. **왼쪽 메뉴**를 확인합니다:
   - 상단에 **"Projects"** 또는 **"프로젝트"** 메뉴가 있습니다
3. **"Projects"** 클릭
4. 프로젝트 목록에서 **"luckyglide"** 클릭

---

## 📍 3단계: Settings 메뉴 찾기

프로젝트 페이지에서:

1. **상단 메뉴 바**를 확인합니다:
   - **Deployments** | **Analytics** | **Settings** | **Insights** 등이 있습니다
2. **"Settings"** 클릭

---

## 📍 4단계: Environment Variables 메뉴 찾기

Settings 페이지에서:

1. **왼쪽 사이드바 메뉴**를 확인합니다:
   - General
   - Domains
   - **Environment Variables** ← 이걸 찾으세요!
   - Git
   - 등등...
2. **"Environment Variables"** 클릭

---

## 📍 5단계: 환경변수 추가하기

Environment Variables 페이지에서:

### 화면 구성 확인
- 상단에 **"Add New"** 또는 **"Add"** 버튼이 있습니다
- 아래에 기존 환경변수 목록이 있을 수 있습니다

### 첫 번째 환경변수 추가: `MRT_PARTNER_API_KEY_partner1`

1. **"Add New"** 또는 **"Add"** 버튼 클릭
2. 입력 필드가 나타납니다:
   - **Key** 또는 **Name** 필드: `MRT_PARTNER_API_KEY_partner1` 입력
   - **Value** 필드: `8r1vY4dsnRdfnXsloZ-3C9XT5YMN0pnPTWhEA6w12xwGVUQAyczbFSsn_d6CM91Q` 입력
3. **Environment** 선택 (아래 체크박스들):
   - ☑️ **Production** 체크
   - ☑️ **Preview** 체크
   - ☑️ **Development** 체크
   - (모두 체크하는 것을 권장합니다)
4. **"Save"** 또는 **"Add"** 버튼 클릭

### 두 번째 환경변수 확인: `SUPABASE_URL`

이미 있는지 확인:
- 환경변수 목록에서 `SUPABASE_URL`이 있는지 확인
- **없다면** 위와 동일한 방법으로 추가:
  - **Key**: `SUPABASE_URL`
  - **Value**: `https://jnizgkommrslzdliwidg.supabase.co`
  - **Environment**: 모두 체크

### 세 번째 환경변수 확인: `SUPABASE_ANON_KEY`

이미 있는지 확인:
- 환경변수 목록에서 `SUPABASE_ANON_KEY`가 있는지 확인
- **없다면** 추가:
  - **Key**: `SUPABASE_ANON_KEY`
  - **Value**: `.env` 파일에서 전체 값을 복사해서 붙여넣기
  - **Environment**: 모두 체크

---

## 📍 6단계: 재배포하기

환경변수를 추가한 후:

### 방법 1: 자동 재배포 대기
- Vercel이 자동으로 재배포를 시작할 수 있습니다
- 몇 분 기다려보세요

### 방법 2: 수동 재배포
1. 상단 메뉴에서 **"Deployments"** 클릭
2. 가장 위에 있는 배포 항목을 찾습니다
3. 배포 항목 오른쪽에 **"..."** (점 3개) 버튼 클릭
4. 드롭다운 메뉴에서 **"Redeploy"** 클릭
5. 확인 팝업에서 **"Redeploy"** 클릭

---

## ✅ 완료 확인

재배포가 완료되면:

1. 배포 상태가 **"Ready"** (초록색)로 변경됩니다
2. `https://luckyglide.vercel.app/partner1` 접속
3. 예약하기 버튼 클릭 테스트
4. 개발자 도구(F12) → Console에서 에러가 사라졌는지 확인

---

## 🔍 문제 해결

### 환경변수가 보이지 않아요
- Settings → Environment Variables 메뉴를 다시 확인하세요
- 페이지를 새로고침(F5) 해보세요

### 재배포가 안 돼요
- Deployments 페이지에서 최신 배포를 확인하세요
- 수동으로 Redeploy를 시도해보세요

### 여전히 에러가 나요
- 환경변수 이름이 정확한지 확인 (대소문자 구분)
- 모든 Environment(Production, Preview, Development)에 체크했는지 확인
- 재배포가 완료되었는지 확인

---

## 📝 체크리스트

환경변수 추가 전:
- [ ] Vercel 대시보드 접속
- [ ] luckyglide 프로젝트 선택
- [ ] Settings → Environment Variables 메뉴 찾기

환경변수 추가:
- [ ] `MRT_PARTNER_API_KEY_partner1` 추가
- [ ] `SUPABASE_URL` 확인/추가
- [ ] `SUPABASE_ANON_KEY` 확인/추가
- [ ] 모든 Environment 체크

재배포:
- [ ] 재배포 완료 대기
- [ ] 배포 상태가 "Ready"인지 확인
- [ ] 테스트 사이트 접속 및 테스트

