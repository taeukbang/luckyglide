## LuckyGlide 백엔드 스크래퍼 구현 개요
## 변경 로그 (feat/myrealtrip-calendar → 실시간 하이브리드)

- 2025-10-14
  - 캘린더 API 클라이언트(`server/myrealtrip.ts`)와 스캔 로직(`server/scan.ts`) 정리
  - 스캔 시 창 전체 최저가를 선택하고 해당 날짜를 `departure_date`로 저장하도록 수정
  - `/api/calendar-window`: 각 출발일 창 내 최저가 산출로 일관화
  - `/api/latest-live` 추가: DB 없이 MyRealTrip 캘린더 실시간 호출로 카드 리스트 구성, 10분 캐시, 동시성 제한
  - 프론트
    - 카드 목록을 실시간(`/api/latest-live`) 기반 점진 렌더링으로 변경(days=14, 8개 청크)
    - 카드 가격 미표시 문구를 "로딩 중"으로 변경
    - 상세 다이얼로그가 카드의 여행일수와 동기화되도록 수정
    - 그래프 로드 후 더 낮은 실시간 최저가가 있으면 카드 가격도 즉시 갱신

### 실시간 카드 엔드포인트

`GET /api/latest-live?from=ICN&region=아시아&codes=FUK,TYO&days=14&minTripDays=3&maxTripDays=7&concurrency=16`

- 각 목적지에 대해 출발일(+14일) × 체류(3~7일) 범위를 스캔하여 창 내 최저가를 계산
- 응답: `{ code, city, region, price, originalPrice(관측 최고값), departureDate, returnDate, airline, tripDays }`
- 메모리 캐시 TTL 10분

### 프론트 점진 렌더링

- 초기 플레이스홀더 렌더링 후 코드 묶음(8개) 단위로 실시간 가격을 합치는 방식
- 네트워크/속도는 `days`, `concurrency`, 청크 크기로 조절


- **목표**: 프론트를 변경하지 않고 백엔드에서 MyRealTrip 캘린더 API를 호출해 가격 정보를 수집/저장
- **브랜치**: `feat/myrealtrip-calendar`
- **핵심 API**: `https://api3.myrealtrip.com/flight/api/price/calendar`

## 디렉터리/파일

- `server/index.ts`: Express 서버, 라우트 정의
- `server/myrealtrip.ts`: 캘린더 API 클라이언트 및 최소가 계산 유틸
- `server/scan.ts`: 스캔(내일부터 +30일, 3~7일 여정) 및 Supabase 저장 로직
- `server/supabase.ts`: Supabase 클라이언트 초기화(.env 기반)
- `server/schema.sql`: Supabase 테이블/뷰 스키마(SQL)

## 실행 전제 및 설치

- Node.js 18+ (fetch 내장)
- 의존성 설치:
  - 런타임: `express`, `cors`, `@supabase/supabase-js`
  - 개발: `tsx`, `dotenv`, 타입들(`@types/express`, `@types/cors`)

프로젝트 루트에서:

```bash
npm install
npm install express cors @supabase/supabase-js
npm install -D tsx dotenv @types/express @types/cors
```

## 환경 변수(.env)

루트에 `.env` 생성:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

`package.json` 스크립트는 dotenv를 프리로드하여 `.env`를 자동 로드합니다:

```json
{
  "scripts": {
    "server:dev": "tsx -r dotenv/config server/index.ts"
  }
}
```

## 서버 실행

```bash
npm run server:dev
# server listening on http://localhost:8787
```

## 라우트(백엔드)

- `GET /api/calendar`
  - 쿼리: `from`, `to`, `date(YYYY-MM-DD)`, `period(기본 30)`, `transfer(기본 -1)`, `international(기본 true)`, `airlines(기본 All)`
  - 설명: MyRealTrip 캘린더 API 호출 후 응답 + `min`(최저가 항목) 반환

- `POST /api/calendar`
  - 바디: 캘린더 API 스펙 그대로(예: `{from,to,departureDate,period,transfer,international,airlines}`)

- `POST /api/scan`
  - 바디: `{ from: string, to: string }`
  - 동작: 내일 날짜부터 +30일까지, 체류일 3~7일 조합을 스캔하여 각 출발일 구간의 최저가를 계산하고 Supabase `public.fares`에 저장

## 스캔 로직(요약)

- 기준: `startDate = 내일`
- 범위: `+30일`
- 체류일: `3 ~ 7일`
- 각 출발일에 대해 캘린더 API를 호출하고, 해당 기간(보수적으로 `period = 체류일`) 내 최소가를 선택

관련 코드: `server/scan.ts`의 `scanAndStore`

## 데이터베이스 스키마

- 파일: `server/schema.sql`
- 테이블: `public.fares`
  - 컬럼: `"from" text`, `"to" text`, `departure_date date`, `return_date date`, `trip_days int`, `min_price numeric`, `min_airline text`, `collected_at timestamptz`
  - 인덱스: `("from", "to", departure_date, return_date)`, `(collected_at desc)`
  - 뷰: `public.fares_latest` (출/도착/출발/복귀 기준 최신 수집 1건)

주의: `from`, `to`는 SQL 예약어이므로 스키마/쿼리에서 항상 `"from"`, `"to"`처럼 이스케이프 처리합니다.

## 저장 정책(히스토리 보존)

- 기존 upsert가 아닌, 매 수집 시 `insert`로 이력을 누적 저장합니다.
- 구현 위치: `server/scan.ts`

## 테스트 예시

1) 캘린더 단건 조회(POST):

```bash
curl --location "http://localhost:8787/api/calendar" \
  --header "Content-Type: application/json" \
  --data '{
    "from": "ICN",
    "to": "TYO",
    "departureDate": "2025-11-05",
    "airlines": ["All"],
    "period": 30,
    "transfer": -1,
    "international": true
  }'
```

2) 스캔 실행(POST):

```bash
curl --location "http://localhost:8787/api/scan" \
  --header "Content-Type: application/json" \
  --data '{"from":"ICN","to":"TYO"}'
```

3) Supabase 조회 예시(SQL):

```sql
select * from public.fares
where "from"='ICN' and "to"='TYO'
order by collected_at desc
limit 20;

-- 최신가 뷰
select * from public.fares_latest
where "from"='ICN' and "to"='TYO'
order by departure_date;
```

## 참고

- 캘린더 API(운영): `https://api3.myrealtrip.com/flight/api/price/calendar`
- 프론트엔드는 변경하지 않으며, 백엔드 API만 호출하도록 분리되어 있습니다.


