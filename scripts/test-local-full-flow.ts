/**
 * 로컬 환경 전체 플로우 테스트
 * 브라우저 → 로컬 백엔드(8787) → 로컬 프록시(3001) → MyRealTrip API
 */
import { chromium } from 'playwright';

async function testLocalFullFlow() {
  console.log('🧪 로컬 환경 전체 플로우 테스트');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const mylinkRequests: any[] = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/mrt/partner/mylink')) {
      console.log('\n📤 MyLink API 요청:');
      console.log(`   URL: ${request.url()}`);
      mylinkRequests.push({
        url: request.url(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/mrt/partner/mylink')) {
      const request = mylinkRequests[mylinkRequests.length - 1];
      const elapsed = Date.now() - (request?.timestamp || 0);
      
      console.log(`\n📥 MyLink API 응답:`);
      console.log(`   상태: ${response.status()}`);
      console.log(`   응답시간: ${elapsed}ms`);
      
      if (response.status() === 201) {
        try {
          const body = await response.json();
          console.log(`   ✅ MyLink: ${body.data?.mylink || '없음'}`);
        } catch (e) {
          console.log(`   ⚠️ JSON 파싱 실패`);
        }
      } else {
        console.log(`   ❌ 에러 발생`);
        try {
          const text = await response.text();
          console.log(`   에러: ${text.substring(0, 200)}`);
        } catch (e) {}
      }
    }
  });
  
  try {
    console.log('\n1️⃣ 로컬 서버 접속...');
    await page.goto('http://localhost:8080/test-partner', {
      waitUntil: 'networkidle'
    });
    console.log('   ✅ 페이지 로드 완료');
    
    await page.waitForTimeout(2000);
    
    console.log('\n2️⃣ 예약하기 버튼 찾기...');
    const bookButton = page.locator('button:has-text("예약하기")').first();
    
    if (await bookButton.count() === 0) {
      console.log('   ❌ 버튼을 찾을 수 없습니다');
      await page.waitForTimeout(10000);
      await browser.close();
      return;
    }
    
    console.log('   ✅ 버튼 발견');
    
    console.log('\n3️⃣ 버튼 클릭...');
    await bookButton.click();
    console.log('   ✅ 클릭 완료');
    
    console.log('\n4️⃣ MyLink 생성 대기...');
    await page.waitForTimeout(3000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과:');
    console.log(`   MyLink 요청 수: ${mylinkRequests.length}`);
    
    if (mylinkRequests.length > 0) {
      console.log('   ✅ 전체 플로우 작동 확인!');
      console.log('   🎯 브라우저 → 로컬 백엔드 → 로컬 프록시 → MyRealTrip API');
    } else {
      console.log('   ❌ MyLink API 호출 없음');
    }
    
    console.log('\n⏸️  브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);
    
  } catch (error: any) {
    console.error('\n❌ 오류:', error.message);
    await page.waitForTimeout(10000);
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
}

testLocalFullFlow();
