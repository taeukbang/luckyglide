/**
 * 로컬 환경 100번 반복 테스트
 * 다양한 시나리오로 안정성 검증
 */

interface TestResult {
  success: boolean;
  elapsed: number;
  mylink?: string;
  error?: string;
}

async function test100Times() {
  console.log('🧪 로컬 환경 100번 반복 테스트 시작');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  // 다양한 항공권 URL 시나리오
  const testScenarios = [
    {
      name: '인천 → 도쿄 (왕복)',
      url: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천&arrctycd=TYO&arrctynm=도쿄'
    },
    {
      name: '인천 → 오사카 (왕복)',
      url: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천&arrctycd=OSA&arrctynm=오사카'
    },
    {
      name: '인천 → 방콕 (왕복)',
      url: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천&arrctycd=BKK&arrctynm=방콕'
    },
    {
      name: '인천 → 다낭 (왕복)',
      url: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천&arrctycd=DAD&arrctynm=다낭'
    },
    {
      name: '인천만 (검색 페이지)',
      url: 'https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천'
    }
  ];
  
  console.log(`\n📋 테스트 시나리오: ${testScenarios.length}개`);
  testScenarios.forEach((s, i) => console.log(`   ${i + 1}. ${s.name}`));
  console.log('\n');
  
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const scenario = testScenarios[i % testScenarios.length];
    const testNum = i + 1;
    
    process.stdout.write(`\r[${testNum}/100] ${scenario.name.padEnd(30)} `);
    
    try {
      const reqStartTime = Date.now();
      
      const response = await fetch('http://localhost:8080/api/mrt/partner/mylink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: scenario.url,
          partnerId: 'test-partner'
        })
      });
      
      const elapsed = Date.now() - reqStartTime;
      
      if (response.ok) {
        const data = await response.json();
        const mylink = data.data?.mylink;
        
        if (mylink) {
          results.push({ success: true, elapsed, mylink });
          process.stdout.write(`✅ ${elapsed}ms - ${mylink}`);
        } else {
          results.push({ success: false, elapsed, error: 'No mylink in response' });
          process.stdout.write(`❌ ${elapsed}ms - No mylink`);
        }
      } else {
        const errorText = await response.text();
        results.push({ success: false, elapsed, error: `HTTP ${response.status}` });
        process.stdout.write(`❌ ${elapsed}ms - ${response.status}`);
      }
    } catch (error: any) {
      const elapsed = Date.now() - reqStartTime;
      results.push({ success: false, elapsed: elapsed || 0, error: error.message });
      process.stdout.write(`❌ Error - ${error.message}`);
    }
    
    // 약간의 딜레이 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 테스트 결과 통계');
  console.log('='.repeat(60));
  
  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  
  console.log(`\n✅ 성공: ${successResults.length}/100 (${(successResults.length)}%)`);
  console.log(`❌ 실패: ${failedResults.length}/100 (${(failedResults.length)}%)`);
  
  if (successResults.length > 0) {
    const times = successResults.map(r => r.elapsed);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    
    console.log(`\n⏱️  응답시간 통계:`);
    console.log(`   평균: ${avgTime.toFixed(0)}ms`);
    console.log(`   최소: ${minTime}ms`);
    console.log(`   최대: ${maxTime}ms`);
    console.log(`   중앙값: ${medianTime}ms`);
    
    // 응답시간 분포
    const under500 = times.filter(t => t < 500).length;
    const under1000 = times.filter(t => t >= 500 && t < 1000).length;
    const over1000 = times.filter(t => t >= 1000).length;
    
    console.log(`\n📈 응답시간 분포:`);
    console.log(`   < 500ms: ${under500}회 (${((under500/successResults.length)*100).toFixed(1)}%)`);
    console.log(`   500-1000ms: ${under1000}회 (${((under1000/successResults.length)*100).toFixed(1)}%)`);
    console.log(`   > 1000ms: ${over1000}회 (${((over1000/successResults.length)*100).toFixed(1)}%)`);
  }
  
  if (failedResults.length > 0) {
    console.log(`\n❌ 실패 원인:`);
    const errorTypes = new Map<string, number>();
    failedResults.forEach(r => {
      const error = r.error || 'Unknown';
      errorTypes.set(error, (errorTypes.get(error) || 0) + 1);
    });
    errorTypes.forEach((count, error) => {
      console.log(`   ${error}: ${count}회`);
    });
  }
  
  console.log(`\n⏱️  총 소요시간: ${(totalTime / 1000).toFixed(1)}초`);
  console.log(`   평균 처리량: ${(100 / (totalTime / 1000)).toFixed(1)} requests/sec`);
  
  // 시나리오별 통계
  console.log(`\n📋 시나리오별 성공률:`);
  testScenarios.forEach((scenario, idx) => {
    const scenarioResults = results.filter((_, i) => i % testScenarios.length === idx);
    const scenarioSuccess = scenarioResults.filter(r => r.success).length;
    console.log(`   ${scenario.name}: ${scenarioSuccess}/${scenarioResults.length}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (successResults.length >= 95) {
    console.log('✅ 테스트 통과! 안정성 검증 완료! 🎉');
  } else if (successResults.length >= 80) {
    console.log('⚠️  테스트 부분 통과. 일부 불안정성 있음.');
  } else {
    console.log('❌ 테스트 실패. 심각한 문제 발견.');
  }
  
  console.log('='.repeat(60));
}

test100Times().catch(console.error);


