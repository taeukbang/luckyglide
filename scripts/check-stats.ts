/**
 * Supabase에서 통계 직접 조회
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkStats() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경변수 없음');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('📊 Supabase에서 통계 조회 중...');
  console.log('='.repeat(60));
  
  const { data, error } = await supabase
    .from('partner_mylink_stats')
    .select('*')
    .eq('partner_id', 'test-partner')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('❌ 조회 실패:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('📭 데이터 없음');
    return;
  }
  
  console.log(`✅ 총 ${data.length}개 레코드 발견:\n`);
  
  data.forEach(row => {
    console.log(`📅 ${row.date}`);
    console.log(`   파트너: ${row.partner_id}`);
    console.log(`   생성 개수: ${row.count}개`);
    console.log(`   생성일시: ${row.created_at}`);
    console.log(`   수정일시: ${row.updated_at}`);
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log(`🎯 오늘 (test-partner): ${data[0]?.count || 0}개 생성됨`);
}

checkStats();
