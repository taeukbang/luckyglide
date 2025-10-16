## LuckyGlide 시스템 개요 (아키텍처/동작 원리/목표)

### 제품 비전과 목표
- 초기 로딩을 매우 빠르게: 사전 수집한 최저가를 DB(Supabase)에 저장해 카드에서 즉시 표시
- 최신성 보장: 상세 그래프와 카드/상세의 “새로고침”으로 실시간에 준하는 최신 값 확인
- 신뢰성: “가격 수집 시점(collectedAt)”을 카드/상세에 명확히 표기해 투명성 확보

### 핵심 KPI(예시)
- 초기 카드 그리드 LCP ~1.0–1.5s (DB 캐시 기반)
- 새로고침 후 반영까지: 네트워크 왕복 + 스캔 시간 최소화(단일 목적지 14일 × 3~7일 체류)

## 데이터 흐름
- 스캔 저장(`server/scan.ts` 또는 서버리스 `api/scan.ts`)
  - MyRealTrip 캘린더 API를 호출하여 출발일(`dep`), 체류일(`len`) 조합별로 정확 복귀일 = `dep + (len-1)`의 가격을 수집
  - `fares` 테이블에 삽입하며, 새로 넣는 행들은 `is_latest=true`로 기록
  - 동일 경로(from,to)의 기존 `is_latest=true` 행은 일괄 `false` 처리

- 조회(목록) `/api/latest`
  - 뷰 `fares_city_extrema`를 사용해 `(from,to)`별로 `is_latest=true` 집합 중 최저가 1행을 반환
  - 추가로 해당 목적지의 최신 수집 시점(같은 `(from,to)`의 `is_latest=true` 중 최상단 `collected_at`)을 계산해 `collectedAt`으로 표기

- 조회(상세 그래프) `/api/calendar-window`
  - 특정 체류일(`tripDays`)로 지정된 기간(`days`) 동안, 출발일별 가격(정확 복귀일 매칭)을 계산하여 차트용 `{date: MM/DD, price}` 배열 반환

## 데이터 모델
- `fares`
  - 컬럼: `from`, `to`, `departure_date`, `return_date`, `trip_days`, `min_price`, `min_airline`, `collected_at`, `is_latest`
  - 인덱스: 경로/날짜, 수집시점, 최신 플래그
- `fares_city_extrema`(VIEW)
  - `is_latest=true` 집합 중 최저가 행을 1개 선택. 추가로 `(from,to)`별 최대가도 같이 제공(`max_price`)

## 서버(Express) 엔드포인트
- `GET /api/latest`
  - 쿼리: `from=ICN`, `region=아시아|...`, `codes=A,B,...`
  - 응답: 카드 표시용 `{ code, city, region, price, originalPrice, departureDate, returnDate, airline, tripDays, collectedAt }[]`
- `POST /api/scan`
  - 바디/쿼리: `from`, `to` (단일 목적지 스캔, 기본 14일)
  - 동작: `fares`에 최신 스냅샷 저장
- `POST /api/calendar-window`
  - 바디: `{ from, to, startDate?, days=30, tripDays }`
  - 응답: 차트용 `{ date: MM/DD, price }[]`

## 서버리스(Preview, Vercel Edge)
- `api/latest.ts`, `api/scan.ts`
  - Express와 동일한 인터페이스로 Preview 환경에서 동작
  - 환경변수: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Preview 스코프에 설정)

## 프론트 동작 (화면/UX)
- `src/pages/Index.tsx`
  - 초기 로딩: `/api/latest`로 DB 캐시값을 불러와 카드 그리드 렌더링
  - 카드 새로고침: `/api/scan` → `/api/latest?codes=...` 재조회 → 선택 카드만 상태 갱신
  - 동시 로딩: `refreshingCodes(Set)`로 각 카드별 로딩/완료 상태를 독립 관리
  - 반짝 효과: 완료 시 `justRefreshedCodes(Set)`을 통해 해당 카드 외곽선 파란 플래시 처리
  - 상세 다이얼로그: 열릴 때 `/api/latest?codes=...`로 상단 정보(collectedAt/여행일/가격) 동기화 후 `/api/calendar-window` 호출로 그래프 데이터 로딩
  - 상세 새로고침: 카드와 동일 로직 + 그래프 재호출

- `src/components/FlightCard.tsx`
  - `collectedAt` 표기, 새로고침 버튼(예약 버튼 왼쪽), 가격 변동 확인 버튼
  - 새로고침 완료 시 `lg-flash-outline` 외곽선 효과

- `src/components/FlightDetailDialog.tsx`
  - 상단 정보에 수집 시점 표기, 새로고침 버튼 추가, 국기 아이콘 카드와 동일 처리

- 스타일: `src/index.css`
  - `.lg-flash-outline` 키프레임으로 파란 외곽선 플래시

## 개발/실행 방법
- 로컬 개발
  - 서버: `npm run server:dev` (http://localhost:8787)
  - 프론트: `npm run dev` (http://localhost:8080, `/api` 프록시로 서버와 연동)
  - 환경변수: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

- Vercel Preview
  - 브랜치 푸시 시 자동 배포, 서버리스 `api/` 라우트 사용
  - Preview 환경변수 설정 필수: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## 확장 아이디어(로드맵)
- 주기 스케줄러(크론)로 지정된 목적지 집합 자동 스캔
- 다중 출발지 지원 및 UI 필터 추가
- 가격 알림(웹훅/이메일)


