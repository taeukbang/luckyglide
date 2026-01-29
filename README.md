# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4164116b-de94-4fa5-8eb8-6261ae8e7826

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4164116b-de94-4fa5-8eb8-6261ae8e7826) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4164116b-de94-4fa5-8eb8-6261ae8e7826) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Environment variables

Partner mylink (MyRealTrip Marketing Partner) integration requires:

```
MRT_PARTNER_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9....
```

- The token is used server-side to mint a short-lived access token.
- Server endpoints:
  - GET `/api/mrt/partner/token` — ensures access token and returns expiry info (no token body).
  - POST `/api/mrt/partner/landing-url` — body: `{ depAirportCd, depDate, arrAirportCd, arrDate?, tripTypeCd? }`, returns `{ data: { url, gid } }`.
- Frontend booking CTAs automatically call the landing-url endpoint and fall back to the legacy web URL on failure.

Test page:
- Route: `/mrt-partner-test`
- Step-by-step: 1) Issue access token, 2) Request landing URL for given inputs.

### Partner-specific MyLink (하이브리드 방식)

파트너별 마이링크 변환은 **하이브리드 방식**으로 동작합니다:
- **사전 변환**: 로컬 스크립트로 마이링크를 미리 생성하여 Supabase에 저장
- **실시간 조회**: 사용자 클릭 시 저장된 마이링크를 조회하여 사용
- **Fallback**: 저장된 마이링크가 없으면 기존 예약 URL 사용

**Setup Steps:**

1. **Supabase 스키마 생성**: `server/schema.sql`의 `partner_mylinks` 테이블 생성

2. **API Key 발급**: 각 파트너마다 개별 API 키를 마이리얼트립 파트너 페이지에서 발급
   - 파트너 페이지 → Open API → API Key 발급
   - 각 파트너별로 별도의 API 키 필요

3. **로컬 스크립트 실행**: 마이링크 생성 및 저장
   ```bash
   PARTNER_ID=partner1 \
   MRT_PARTNER_API_KEY_partner1=YOUR_API_KEY \
   SUPABASE_URL=your_supabase_url \
   SUPABASE_ANON_KEY=your_supabase_key \
   tsx scripts/generate-mylinks.ts
   ```
   
   환경변수:
   - `PARTNER_ID`: 파트너 식별자 (필수)
   - `MRT_PARTNER_API_KEY_파트너식별자`: 파트너별 API 키 (필수)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase 인증 정보 (필수)
   - `GEN_FROM`: 출발지 (기본: ICN)
   - `GEN_DAYS`: 생성할 일수 (기본: 14)
   - `GEN_MIN_DAYS`, `GEN_MAX_DAYS`: 체류일 범위 (기본: 3-7)
   - `GEN_NONSTOP`: 직항만 (기본: false)
   - `GEN_CODES`: 특정 목적지만 (예: "TYO,FUK")

4. **환경변수 설정**: Vercel 환경변수에 Supabase 정보 설정 (이미 설정되어 있을 수 있음)

**How it works:**

- Partner identification: URL path 기반 (`https://luckyglide.vercel.app/파트너식별자`)
- 사용자가 파트너 경로에서 예약하기 버튼 클릭 시:
  1. Supabase에서 저장된 마이링크 조회
  2. 있으면 마이링크 반환
  3. 없으면 기존 예약 URL 반환 (fallback)
- 일반 경로(`/`)는 기존 로직 그대로 유지

**API Endpoints:**

- GET `/api/mrt/partner/mylink-query` — 저장된 마이링크 조회
  - Query params: `partnerId`, `from`, `to`, `depdt`, `rtndt?`, `tripDays?`, `nonstop?`
  - Returns: `{ mylink: "https://myrealt.rip/..." | null }`

**테스트 가이드:**

자세한 테스트 방법은 [`docs/TESTING_MYLINK.md`](docs/TESTING_MYLINK.md)를 참고하세요.

빠른 테스트:
```bash
# 마이링크 조회 API 테스트
./scripts/test-mylink-query.sh test-partner ICN TYO
```