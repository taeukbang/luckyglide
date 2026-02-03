# 📊 통계 기능 테스트 가이드

## ✅ 완료된 구현

1. ✅ Supabase 테이블 스키마 (`create-stats-table.sql`)
2. ✅ 카운터 증가 함수 (`increment_mylink_count`)
3. ✅ Vercel API 수정 (`api/mrt/partner/mylink.ts`)
4. ✅ 로컬 백엔드 수정 (`server/index.ts`)
5. ✅ 통계 조회 API (`api/stats/mylink-daily.ts`)

---

## 🚀 테스트 단계

### 1단계: Supabase 테이블 생성 (1분)

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **luckyglide 프로젝트 선택**
3. **SQL Editor 클릭**
4. **New query 클릭**
5. **`docs/create-stats-table.sql` 내용을 복사해서 붙여넣기**
6. **Run 버튼 클릭**

**예상 출력:**
```
✅ 테이블 생성 완료!
row_count: 1
```

**확인:**
```sql
SELECT * FROM partner_mylink_stats;
-- 1개 row가 있어야 함 (테스트 데이터)
```

---

### 2단계: 환경변수 확인 (1분)

로컬 `.env` 파일에 다음이 있는지 확인:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**없다면 Supabase 대시보드에서:**
1. **Settings → API** 클릭
2. **Project URL** 복사 → `SUPABASE_URL`
3. **anon public** 키 복사 → `SUPABASE_ANON_KEY`

---

### 3단계: 로컬 서버 재시작 (1분)

```bash
# 터미널 1: 로컬 백엔드 재시작
cd /Users/sujung-hong/Documents/GitHub/luckyglide
npm run dev

# 터미널 2: 로컬 프록시 (이미 실행 중이면 불필요)
cd /Users/sujung-hong/Documents/GitHub/luckyglide/local-proxy
node server.js
```

---

### 4단계: 브라우저 테스트 (1분)

1. **브라우저로 접속**: http://localhost:8080/test-partner
2. **아무 항공권의 "예약하기" 버튼 클릭**
3. **터미널 로그 확인**:

**예상 로그:**
```bash
[Stats] 기록 중: test-partner / 2026-01-30
[Stats] ✅ 기록 완료
```

---

### 5단계: Supabase에서 확인 (1분)

Supabase SQL Editor에서:

```sql
SELECT * FROM partner_mylink_stats 
WHERE partner_id = 'test-partner'
ORDER BY date DESC;
```

**예상 결과:**
```
| partner_id   | date       | count | created_at          |
|--------------|------------|-------|---------------------|
| test-partner | 2026-01-30 | 1     | 2026-01-30 12:34:56 |
```

---

### 6단계: 여러 번 클릭해서 카운터 증가 확인 (2분)

1. **예약하기 버튼을 5번 클릭**
2. **Supabase에서 다시 확인**:

```sql
SELECT * FROM partner_mylink_stats 
WHERE partner_id = 'test-partner'
AND date = CURRENT_DATE;
```

**예상 결과:**
```
| partner_id   | date       | count | 
|--------------|------------|-------|
| test-partner | 2026-01-30 | 6     |  ← 1 + 5 = 6
```

---

### 7단계: 통계 조회 API 테스트 (1분)

**브라우저에서 접속:**
```
http://localhost:8787/api/stats/mylink-daily?partnerId=test-partner
```

**또는 curl:**
```bash
curl "http://localhost:8787/api/stats/mylink-daily?partnerId=test-partner"
```

**예상 응답:**
```json
{
  "partner_id": "test-partner",
  "period": {
    "start": null,
    "end": null
  },
  "total": 6,
  "days": 1,
  "daily": [
    {
      "date": "2026-01-30",
      "count": 6
    }
  ]
}
```

---

### 8단계: 날짜 범위 조회 테스트 (1분)

```bash
# 최근 7일
curl "http://localhost:8787/api/stats/mylink-daily?partnerId=test-partner&startDate=2026-01-24&endDate=2026-01-30"

# 최근 10일만
curl "http://localhost:8787/api/stats/mylink-daily?partnerId=test-partner&limit=10"
```

---

## 🎯 성공 기준

✅ Supabase 테이블 생성 완료  
✅ 예약하기 클릭 시 로그에 `[Stats] ✅ 기록 완료` 출력  
✅ Supabase에서 count 증가 확인  
✅ 통계 API에서 데이터 조회 가능  

---

## 🐛 문제 해결

### 문제 1: `[Stats] Supabase 환경변수 없음`

**원인:** `.env` 파일에 환경변수 없음

**해결:**
```bash
# .env 파일에 추가
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 서버 재시작
npm run dev
```

---

### 문제 2: `[Stats] 기록 실패: function increment_mylink_count does not exist`

**원인:** Supabase 함수가 생성되지 않음

**해결:**
1. Supabase SQL Editor 열기
2. `docs/create-stats-table.sql` 3단계 부분만 다시 실행:

```sql
CREATE OR REPLACE FUNCTION increment_mylink_count(
  p_partner_id text,
  p_date date
) RETURNS void AS $$
BEGIN
  INSERT INTO partner_mylink_stats (partner_id, date, count, updated_at)
  VALUES (p_partner_id, p_date, 1, NOW())
  ON CONFLICT (partner_id, date)
  DO UPDATE SET 
    count = partner_mylink_stats.count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

### 문제 3: 카운터가 증가하지 않음

**확인 사항:**
1. 예약하기 버튼이 제대로 작동하는지 (MyLink 생성 성공하는지)
2. 터미널에 `[Stats]` 로그가 출력되는지
3. Supabase 테이블 권한 확인:

```sql
-- Supabase SQL Editor에서
GRANT ALL ON partner_mylink_stats TO anon;
GRANT ALL ON partner_mylink_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_mylink_count TO anon;
GRANT EXECUTE ON FUNCTION increment_mylink_count TO authenticated;
```

---

## 📊 통계 활용 예시

### 파트너별 월별 사용량

```sql
SELECT 
  TO_CHAR(date, 'YYYY-MM') as month,
  SUM(count) as monthly_total
FROM partner_mylink_stats
WHERE partner_id = 'test-partner'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;
```

### 전체 파트너 비교

```sql
SELECT 
  partner_id,
  SUM(count) as total,
  COUNT(DISTINCT date) as active_days
FROM partner_mylink_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY partner_id
ORDER BY total DESC;
```

### 요일별 평균

```sql
SELECT 
  TO_CHAR(date, 'Day') as day_of_week,
  ROUND(AVG(count)) as avg_count
FROM partner_mylink_stats
WHERE partner_id = 'test-partner'
  AND date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY TO_CHAR(date, 'Day'), EXTRACT(DOW FROM date)
ORDER BY EXTRACT(DOW FROM date);
```

---

## ✅ 완료!

통계 기능이 정상적으로 작동하면:
- 파트너별 일일 사용량 추적 가능
- 대시보드 구축 가능
- API 호출 패턴 분석 가능

**다음 단계:**
- Vercel에 배포해서 운영 환경에서도 테스트
- 통계 대시보드 UI 구축 (선택)


