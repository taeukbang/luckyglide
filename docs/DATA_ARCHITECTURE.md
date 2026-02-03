# 📊 데이터 적재 아키텍처

## 현재 구조 분석

### 🗄️ Supabase 테이블 구조

```sql
CREATE TABLE public.partner_mylinks (
  id bigint PRIMARY KEY,
  partner_id text NOT NULL,              -- 파트너 식별자 (예: test-partner, partner1)
  "from" text NOT NULL,                  -- 출발지 공항코드 (예: ICN)
  "to" text NOT NULL,                    -- 도착지 공항코드 (예: TYO)
  departure_date date NOT NULL,          -- 출발일
  return_date date NOT NULL,             -- 귀국일
  trip_days int,                         -- 여행 일수
  nonstop boolean DEFAULT false,         -- 직항 여부
  booking_url text NOT NULL,             -- 원본 예약 URL
  mylink text NOT NULL,                  -- 변환된 MyLink
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 중복 방지: 동일 조건의 마이링크는 하나만 저장
  UNIQUE(partner_id, "from", "to", departure_date, return_date, trip_days, nonstop)
);

-- 빠른 조회를 위한 인덱스
CREATE INDEX idx_partner_mylinks_lookup 
  ON partner_mylinks (partner_id, "from", "to", departure_date, return_date, trip_days, nonstop);
  
CREATE INDEX idx_partner_mylinks_partner 
  ON partner_mylinks (partner_id);
```

---

## 🔄 현재 구현 방식: **완전 실시간 생성**

### ❌ 현재는 Supabase 저장 안 함!

```
사용자 예약하기 클릭
        ↓
    실시간 MyLink 생성
        ↓
    사용자에게 바로 전달
        ↓
    저장 안 함 ❌
```

**코드 확인:**
- `api/mrt/partner/mylink.ts`: Supabase 저장 로직 없음
- 매번 MyRealTrip API 실시간 호출
- 데이터베이스에 기록 안 됨

**장점:**
- ✅ 항상 최신 URL
- ✅ 파라미터 변경 시 자동 반영
- ✅ 스토리지 비용 없음

**단점:**
- ❌ MyRealTrip API 호출 횟수 증가
- ❌ 응답시간 의존 (평균 173ms)
- ❌ 사용 통계 추적 불가
- ❌ API 장애 시 서비스 중단

---

## 📋 설계된 하이브리드 방식 (구현 안 됨)

### 1️⃣ 사전 생성 스크립트

```bash
# scripts/generate-mylinks.ts
# 로컬 환경에서 실행 (IP 화이트리스트 통과)

인기 경로 + 날짜 조합 생성
        ↓
    MyRealTrip API 호출
        ↓
    Supabase에 일괄 저장
        ↓
    캐시 구축
```

**예시 데이터:**
```sql
INSERT INTO partner_mylinks VALUES
  ('test-partner', 'ICN', 'TYO', '2026-03-01', '2026-03-04', 3, false, 
   'https://flights.myrealtrip.com/...', 'https://myrealt.rip/Abc123'),
  ('test-partner', 'ICN', 'OSA', '2026-03-01', '2026-03-04', 3, false,
   'https://flights.myrealtrip.com/...', 'https://myrealt.rip/Def456'),
  ...
```

### 2️⃣ 조회 API (구현됨 - 미사용)

```typescript
// api/mrt/partner/mylink-query.ts
GET /api/mrt/partner/mylink-query?
    partnerId=test-partner
    &from=ICN
    &to=TYO
    &depdt=2026-03-01
    &rtndt=2026-03-04
    &tripDays=3
    &nonstop=false

→ Supabase에서 조회
→ 있으면 즉시 반환 (0ms)
→ 없으면 null 반환
```

### 3️⃣ 하이브리드 플로우 (설계만 됨)

```
사용자 예약하기 클릭
        ↓
    1. Supabase 조회 (빠름)
        ↓
    ┌──────────────┐
    │  있음?       │
    └──────────────┘
         ↓       ↓
        Yes      No
         ↓       ↓
    바로 반환  실시간 생성
    (0ms)    (173ms)
               ↓
           Supabase 저장 (선택)
```

---

## 📊 파트너별 데이터 관리

### ✅ 파트너 격리 구조

```sql
-- 파트너별로 완전히 분리된 데이터
SELECT * FROM partner_mylinks WHERE partner_id = 'test-partner';
SELECT * FROM partner_mylinks WHERE partner_id = 'partner1';
SELECT * FROM partner_mylinks WHERE partner_id = 'partner2';
```

**장점:**
- ✅ 파트너 간 데이터 격리
- ✅ 파트너별 통계 추출 가능
- ✅ 파트너별 API 키 분리

**API 키 관리:**
```bash
# 환경변수로 파트너별 API 키 관리
MRT_PARTNER_API_KEY_test-partner=key1
MRT_PARTNER_API_KEY_partner1=key2
MRT_PARTNER_API_KEY_partner2=key3
```

---

## 📈 데이터 활용 가능성

### 1. 사용 통계 (구현 필요)

```sql
-- 파트너별 인기 경로
SELECT 
  partner_id,
  "from",
  "to",
  COUNT(*) as usage_count
FROM partner_mylinks
GROUP BY partner_id, "from", "to"
ORDER BY usage_count DESC;

-- 파트너별 일별 사용량
SELECT 
  partner_id,
  DATE(created_at) as date,
  COUNT(*) as daily_count
FROM partner_mylinks
GROUP BY partner_id, DATE(created_at);
```

### 2. 캐시 히트율 분석 (구현 필요)

```sql
-- 재사용된 MyLink 확인
SELECT 
  mylink,
  COUNT(*) as reuse_count
FROM partner_mylinks
GROUP BY mylink
HAVING COUNT(*) > 1;
```

### 3. API 호출 최적화

```sql
-- 자주 조회되는 패턴 미리 생성
SELECT 
  "from",
  "to",
  trip_days,
  COUNT(*) as frequency
FROM partner_mylinks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY "from", "to", trip_days
ORDER BY frequency DESC
LIMIT 100;
```

---

## 🚀 권장 개선 방안

### 옵션 1: 하이브리드 방식 (권장)

**구현 필요:**
1. ✅ 조회 API 활성화 (`mylink-query.ts` 사용)
2. ❌ 생성 API에 저장 로직 추가
3. ❌ 프론트엔드에서 조회 → 생성 플로우 구현

**예상 효과:**
- 캐시 히트 시: **0ms 응답** (Supabase 조회)
- 캐시 미스 시: **173ms 응답** (실시간 생성)
- API 호출 감소: **70-90%** (인기 경로)

### 옵션 2: 완전 실시간 (현재 상태)

**현재 구조 유지:**
- 매번 실시간 생성
- 저장 안 함
- 간단하지만 API 호출 많음

**적합한 경우:**
- MyRealTrip API 호출 비용 무제한
- 항상 최신 URL 필요
- 트래픽 적음

### 옵션 3: 완전 사전 생성

**모든 조합 미리 생성:**
- 로컬에서 대량 생성
- Supabase에 저장
- 실시간 생성 안 함

**적합한 경우:**
- 제한된 경로 조합
- 예측 가능한 날짜 범위
- API 호출 최소화 필요

---

## 📊 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| Supabase 테이블 | ✅ 생성됨 | `partner_mylinks` |
| 조회 API | ✅ 구현됨 | `mylink-query.ts` (미사용) |
| 생성 API | ✅ 구현됨 | `mylink.ts` (저장 안 함) |
| 생성 스크립트 | ✅ 구현됨 | `generate-mylinks.ts` |
| 저장 로직 | ❌ 없음 | 실시간만 |
| 하이브리드 플로우 | ❌ 미구현 | 조회 후 생성 |
| 파트너별 격리 | ✅ 설계됨 | `partner_id` 필드 |
| 사용 통계 | ❌ 미구현 | 추적 안 됨 |

---

## 💡 다음 단계 제안

### 빠른 개선 (1-2시간)

```typescript
// api/mrt/partner/mylink.ts 수정
// 1. Supabase 클라이언트 추가
// 2. 생성 후 저장 로직 추가

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// MyLink 생성 후
const mylinkUrl = data.data.mylink;

// Supabase에 저장 (비동기, 실패해도 무시)
supabase.from('partner_mylinks').upsert({
  partner_id: partnerId,
  from: extractFrom(targetUrl),
  to: extractTo(targetUrl),
  departure_date: extractDepDate(targetUrl),
  return_date: extractRtnDate(targetUrl),
  booking_url: targetUrl,
  mylink: mylinkUrl,
}).then();

// 사용자에게 바로 반환 (저장 완료 기다리지 않음)
return json(data);
```

### 전체 하이브리드 구현 (4-6시간)

1. URL 파싱 함수 작성
2. 저장 로직 추가
3. 프론트엔드 수정 (조회 → 생성)
4. 테스트 및 검증

---

**현재: 완전 실시간 방식 (저장 안 함)**
**설계: 하이브리드 방식 (인프라는 준비됨, 구현만 필요)**


