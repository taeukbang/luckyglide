/**
 * 통계 기록 테스트
 */

async function testStatsRecording() {
  console.log('📊 통계 기록 테스트 시작');
  console.log('='.repeat(60));
  
  // 5번 MyLink 생성
  for (let i = 1; i <= 5; i++) {
    console.log(`\n[${i}/5] MyLink 생성 중...`);
    
    const response = await fetch('http://localhost:8787/api/mrt/partner/mylink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천',
        partnerId: 'test-partner'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ 성공: ${data.data?.mylink || '(mylink 없음)'}`);
    } else {
      console.log(`   ❌ 실패: ${response.status}`);
    }
    
    // 약간의 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 5번 생성 완료!');
  console.log('\nSupabase에서 확인하세요:');
  console.log('SELECT * FROM partner_mylink_stats');
  console.log('WHERE partner_id = \'test-partner\'');
  console.log('AND date = CURRENT_DATE;');
  console.log('\n예상 count: 5 + 1(테스트) = 6');
}

testStatsRecording().catch(console.error);
