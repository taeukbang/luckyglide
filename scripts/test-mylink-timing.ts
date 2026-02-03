// 마이리얼트립 MyLink API 응답시간 테스트
// 실행: tsx -r dotenv/config scripts/test-mylink-timing.ts

async function testMylinkAPI() {
  // 환경변수에서 API 키 읽기
  const partnerId = process.env.PARTNER_ID || 'test-partner';
  const apiKeyEnvName = `MRT_PARTNER_API_KEY_${partnerId}`;
  const apiKey = process.env[apiKeyEnvName];
  
  if (!apiKey) {
    console.error(`❌ API 키를 찾을 수 없습니다: ${apiKeyEnvName}`);
    console.log('\n사용 가능한 환경변수:');
    Object.keys(process.env)
      .filter(key => key.startsWith('MRT_PARTNER'))
      .forEach(key => console.log(`  - ${key}`));
    process.exit(1);
  }
  
  const targetUrl = "https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천";
  const apiUrl = "https://partner-ext-api.myrealtrip.com/v1/mylink";
  
  console.log('🧪 마이리얼트립 MyLink API 테스트');
  console.log('='.repeat(60));
  console.log(`파트너 ID: ${partnerId}`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`Target URL: ${targetUrl.substring(0, 80)}...`);
  console.log('='.repeat(60));
  console.log('');
  
  // 3번 테스트
  const results: number[] = [];
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📡 테스트 ${i}/3...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUrl }),
      });
      
      const elapsed = Date.now() - startTime;
      results.push(elapsed);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`❌ 실패 (${response.status}) - ${elapsed}ms`);
        console.log(`   에러: ${data?.error || data?.message || '알 수 없는 오류'}`);
      } else if (data?.data?.mylink) {
        console.log(`✅ 성공 - ${elapsed}ms`);
        console.log(`   MyLink: ${data.data.mylink.substring(0, 60)}...`);
      } else {
        console.log(`⚠️  응답 이상 - ${elapsed}ms`);
        console.log(`   데이터:`, JSON.stringify(data).substring(0, 100));
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      results.push(elapsed);
      console.log(`❌ 예외 발생 - ${elapsed}ms`);
      console.log(`   오류: ${error.message}`);
      console.log(`   상세: ${error.cause?.message || error.cause?.code || '없음'}`);
      if (error.cause) {
        console.log(`   원인:`, error.cause);
      }
    }
    
    // 다음 테스트 전 1초 대기
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`총 테스트: ${results.length}회`);
  console.log(`평균 응답시간: ${(results.reduce((a, b) => a + b, 0) / results.length).toFixed(0)}ms`);
  console.log(`최소 응답시간: ${Math.min(...results)}ms`);
  console.log(`최대 응답시간: ${Math.max(...results)}ms`);
  console.log('');
  
  if (Math.max(...results) > 10000) {
    console.log('⚠️  경고: 일부 요청이 10초를 초과했습니다 (Vercel 타임아웃!)');
  } else if (Math.max(...results) > 8000) {
    console.log('⚠️  주의: 일부 요청이 8초를 초과했습니다');
  } else {
    console.log('✅ 모든 요청이 정상 범위 내에서 완료되었습니다');
  }
}

testMylinkAPI().catch((e) => {
  console.error('\n❌ 테스트 실행 중 오류:', e?.message || e);
  process.exit(1);
});

