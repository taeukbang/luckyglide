-- partner_mylinks 테이블 상세 확인

-- 1. 테이블 구조 확인 (컬럼 정보)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'partner_mylinks'
ORDER BY ordinal_position;

-- 2. 데이터 개수 확인
SELECT COUNT(*) as total_rows FROM public.partner_mylinks;

-- 3. 샘플 데이터 확인 (있다면)
SELECT 
  partner_id,
  "from",
  "to",
  departure_date,
  return_date,
  trip_days,
  nonstop,
  LEFT(booking_url, 50) as booking_url_preview,
  LEFT(mylink, 50) as mylink_preview,
  created_at
FROM public.partner_mylinks
ORDER BY created_at DESC
LIMIT 5;

-- 4. 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'partner_mylinks'
  AND schemaname = 'public';

