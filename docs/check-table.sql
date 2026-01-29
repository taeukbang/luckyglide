-- Supabase에서 partner_mylinks 테이블 존재 여부 확인

-- 방법 1: 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'partner_mylinks';

-- 방법 2: 테이블 구조 확인 (테이블이 있으면 컬럼 정보가 나옴)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'partner_mylinks'
ORDER BY ordinal_position;

-- 방법 3: 간단한 데이터 개수 확인 (테이블이 있으면 숫자가 나옴)
SELECT COUNT(*) as total_count FROM public.partner_mylinks;

