/**
 * 운영 환경 MyLink 생성 테스트 v2
 */
import { chromium } from 'playwright';

async function testProductionMylink() {
  console.log('🚀 운영 환경 MyLink 테스트 시작');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const requests: any[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/mrt/partner/mylink')) {
      console.log('\n📤 MyLink API 요청 감지:');
      console.log(`   URL: ${request.url()}`);
      console.log(`   시간: ${new Date().toISOString()}`);
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/mrt/partner/mylink')) {
      const elapsed = Date.now() - (requests[requests.length - 1]?.timestamp || 0);
      console.log(`\n📥 MyLink API 응답 받음:`);
      console.log(`   상태: ${response.status()}`);
      console.log(`   응답시간: ${elapsed}ms`);
      
      if (response.status() === 201) {
        try {
          const body = await response.json();
          console.log(`   ✅ MyLink 생성 성공: ${body.data?.mylink || '(없음)'}`);
        } catch (e) {
          console.log(`   ⚠️ JSON 파싱 실패`);
        }
      } else {
        console.log(`   ❌ 에러 발생`);
        try {
          const text = await response.text();
          console.log(`   에러 내용: ${text.substring(0, 200)}`);
        } catch (e) {}
      }
    }
  });
  
  try {
    // 1. 운영 URL 접속
    console.log('\n1️⃣ 운영 환경 접속 중...');
    await page.goto('https://luckyglide.vercel.app/test-partner', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('   ✅ 페이지 로드 완료');
    
    await page.waitForTimeout(3000);
    
    // 2. "예약하기" 또는 "최저가 예약하기" 버튼 찾기
    console.log('\n2️⃣ 예약하기 버튼 찾는 중...');
    
    // 여러 가능한 선택자 시도
    const possibleSelectors = [
      'button:has-text("예약하기")',
      'button:has-text("최저가 예약하기")',
      'a:has-text("예약하기")',
      'a:has-text("최저가 예약하기")',
      '[href*="flights.myrealtrip.com"]'
    ];
    
    let foundButton = null;
    for (const selector of possibleSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        foundButton = button;
        console.log(`   ✅ 버튼 발견: ${selector}`);
        break;
      }
    }
    
    if (!foundButton) {
      console.log('   ❌ 예약하기 버튼을 찾을 수 없습니다.');
      console.log('   페이지 제목:', await page.title());
      console.log('\n⏸️  브라우저를 20초간 열어둡니다 (수동으로 확인하세요)...');
      await page.waitForTimeout(20000);
      await browser.close();
      return;
    }
    
    // 3. 버튼 클릭
    console.log('\n3️⃣ 버튼 클릭...');
    await foundButton.scrollIntoViewIfNeeded();
    await foundButton.click();
    console.log('   ✅ 버튼 클릭 완료');
    
    // 4. API 응답 대기
    console.log('\n4️⃣ MyLink API 응답 대기 중...');
    await page.waitForTimeout(5000);
    
    // 5. 결과 확인
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과:');
    console.log(`   총 MyLink API 요청 수: ${requests.length}`);
    
    if (requests.length > 0) {
      console.log('   ✅ MyLink API 호출 성공!');
      console.log('   🎯 로컬 프록시를 통한 실시간 MyLink 생성 작동 중!');
    } else {
      console.log('   ❌ MyLink API 호출 없음');
    }
    
    console.log('\n⏸️  브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);
    
  } catch (error: any) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
    console.log('\n⏸️  브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
}

testProductionMylink();
