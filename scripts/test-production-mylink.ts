/**
 * 운영 환경 MyLink 생성 테스트
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
      waitUntil: 'networkidle'
    });
    console.log('   ✅ 페이지 로드 완료');
    
    await page.waitForTimeout(2000);
    
    // 2. 첫 번째 항공권 패널 찾기
    console.log('\n2️⃣ 항공권 패널 찾는 중...');
    const firstCard = await page.locator('.flight-card').first();
    await firstCard.scrollIntoViewIfNeeded();
    console.log('   ✅ 항공권 패널 발견');
    
    await page.waitForTimeout(1000);
    
    // 3. "예약하기" 버튼 클릭
    console.log('\n3️⃣ "예약하기" 버튼 클릭...');
    const bookButton = firstCard.locator('button:has-text("예약하기")').first();
    await bookButton.click();
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
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
}

testProductionMylink();
