# 로컬 프록시로 마이링크 생성하기 (무료)

## 개요

당신의 로컬 PC를 프록시 서버로 사용하여 **비용 없이** 마이링크를 실시간으로 생성하는 방법입니다.

---

## 🎯 아키텍처

```
[사용자] 
  ↓
[Vercel 프론트엔드]
  ↓
[Vercel API Route]
  ↓ HTTPS (인터넷)
[Ngrok/CloudFlare Tunnel] ← 공개 URL
  ↓
[당신의 로컬 PC:3001] ← 회사 VPN 연결
  ↓
[마이리얼트립 API] ✅
```

---

## 🚀 설치 및 실행 가이드

### 1️⃣ 로컬 프록시 서버 준비

```bash
# 프로젝트 루트에서
cd local-proxy

# 패키지 설치
npm install

# 환경변수 파일 생성
cat > .env <<EOF
PORT=3001
MRT_PARTNER_API_KEY_test-partner=실제_API_키
MRT_PARTNER_API_KEY_partner1=실제_API_키
EOF
```

### 2️⃣ 로컬 프록시 서버 실행

```bash
# local-proxy 디렉토리에서
npm start

# 출력:
# ╔════════════════════════════════════════╗
# ║  로컬 프록시 서버 시작됨!              ║
# ╚════════════════════════════════════════╝
# 포트: 3001
# Health Check: http://localhost:3001/health
```

### 3️⃣ Ngrok으로 공개 URL 생성

**새 터미널을 열고:**

```bash
# Ngrok 설치 (한 번만)
npm install -g ngrok

# 또는 Homebrew로 (Mac)
brew install ngrok

# Ngrok 실행 (local-proxy 서버를 외부에 노출)
ngrok http 3001

# 출력:
# Session Status   online
# Account          무료 계정
# Version          3.5.0
# Region           Asia Pacific (ap)
# Forwarding       https://abc123.ngrok.io -> http://localhost:3001
#                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#                  이 URL을 복사하세요!
```

### 4️⃣ Vercel 환경변수 설정

```bash
# Vercel Dashboard → luckyglide → Settings → Environment Variables

# 추가할 환경변수:
PROXY_URL=https://abc123.ngrok.io

# Production, Preview, Development 모두 체크
```

### 5️⃣ Vercel API Route 수정

현재 `api/mrt/partner/mylink.ts` 파일을 수정:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROXY_URL = process.env.PROXY_URL; // Ngrok URL

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUrl, partnerId } = req.body;

  if (!targetUrl || !partnerId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['targetUrl', 'partnerId']
    });
  }

  // 로컬 프록시 사용 여부 확인
  if (!PROXY_URL) {
    return res.status(500).json({ 
      error: 'PROXY_URL not configured',
      hint: 'Set PROXY_URL environment variable to your ngrok URL'
    });
  }

  try {
    console.log(`[Vercel] 로컬 프록시 호출: ${PROXY_URL}/mylink`);
    
    const response = await fetch(`${PROXY_URL}/mylink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUrl, partnerId }),
      signal: AbortSignal.timeout(15000) // 15초 타임아웃
    });

    const data = await response.json();
    
    console.log(`[Vercel] 로컬 프록시 응답: ${response.status}`);
    
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[Vercel] 로컬 프록시 오류:', error);
    
    return res.status(503).json({ 
      error: 'Local proxy unavailable',
      details: error.message,
      hint: '로컬 프록시 서버와 ngrok이 실행 중인지 확인하세요'
    });
  }
}
```

### 6️⃣ 테스트

```bash
# Health Check
curl https://abc123.ngrok.io/health

# 마이링크 생성 테스트
curl -X POST https://abc123.ngrok.io/mylink \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1?initform=RT&domintgubun=I&depctycd=ICN&depctynm=인천&arrctycd=TYO",
    "partnerId": "test-partner"
  }'

# 예상 응답:
# {
#   "data": {
#     "mylink": "https://myrealt.rip/Txtxxx"
#   },
#   "result": {
#     "status": 200,
#     "message": "SUCCESS"
#   }
# }
```

---

## 💡 Ngrok 무료 플랜 제한

| 항목 | 무료 플랜 | 유료 플랜 |
|------|----------|----------|
| 동시 세션 | 1개 | 무제한 |
| URL 고정 | ❌ 재시작 시 변경됨 | ✅ 고정 URL |
| 월 비용 | **무료** | $8/월 |

**무료 플랜 사용 시:**
- ⚠️ Ngrok 재시작할 때마다 URL이 바뀜
- ⚠️ URL이 바뀔 때마다 Vercel 환경변수 업데이트 필요

**해결책:**
```bash
# Ngrok 유료 플랜 ($8/월) - 고정 URL
ngrok http 3001 --domain=mylink-proxy.ngrok.app
```

---

## 🎯 방법 2: CloudFlare Tunnel (완전 무료 + 고정 URL)

### 장점
- ✅ **완전 무료**
- ✅ **URL 고정** (재시작해도 동일)
- ✅ DDoS 보호
- ✅ 무제한 대역폭

### 설치

```bash
# CloudFlare Tunnel 설치
brew install cloudflared

# 또는 다운로드
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 설정

```bash
# 1. CloudFlare 로그인
cloudflared tunnel login

# 2. 터널 생성
cloudflared tunnel create mylink-proxy

# 출력: Tunnel credentials written to: ~/.cloudflared/<TUNNEL_ID>.json

# 3. 도메인 연결 (CloudFlare에 도메인이 있어야 함)
cloudflared tunnel route dns mylink-proxy mylink.yourdomain.com

# 4. 설정 파일 생성
cat > ~/.cloudflared/config.yml <<EOF
url: http://localhost:3001
tunnel: <TUNNEL_ID>
credentials-file: /Users/YOUR_USERNAME/.cloudflared/<TUNNEL_ID>.json
EOF

# 5. 터널 실행
cloudflared tunnel run mylink-proxy

# 출력:
# 2026-01-30 Your tunnel is now online!
# https://mylink.yourdomain.com → http://localhost:3001
```

### CloudFlare Tunnel 장점

- ✅ **완전 무료**
- ✅ **고정 URL** (재시작해도 동일)
- ✅ 자동 HTTPS
- ✅ DDoS 보호
- ✅ Vercel 환경변수 한 번만 설정

---

## 🔄 자동 시작 설정 (선택사항)

### Mac: launchd 사용

```bash
# 1. 로컬 프록시 서비스 파일 생성
cat > ~/Library/LaunchAgents/com.mylink.proxy.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mylink.proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(pwd)/local-proxy/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/mylink-proxy.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mylink-proxy-error.log</string>
</dict>
</plist>
EOF

# 2. 서비스 활성화
launchctl load ~/Library/LaunchAgents/com.mylink.proxy.plist

# 3. CloudFlare Tunnel 서비스 파일
cat > ~/Library/LaunchAgents/com.cloudflared.mylink.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflared.mylink</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>mylink-proxy</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# 4. CloudFlare Tunnel 서비스 활성화
launchctl load ~/Library/LaunchAgents/com.cloudflared.mylink.plist
```

이제 Mac 재부팅 시 자동으로 시작됩니다!

---

## 📊 방식별 비교

| 방식 | 비용 | URL 고정 | 설정 난이도 | 권장도 |
|------|------|----------|-------------|--------|
| Ngrok 무료 | 무료 | ❌ 매번 변경 | ⭐ | ⭐⭐ |
| Ngrok 유료 | $8/월 | ✅ 고정 | ⭐ | ⭐⭐⭐⭐ |
| **CloudFlare Tunnel** | **무료** | **✅ 고정** | **⭐⭐** | **⭐⭐⭐⭐⭐** |
| Railway | $20/월 | ✅ 고정 | ⭐ | ⭐⭐⭐ |

---

## ⚠️ 주의사항

### 로컬 프록시 방식의 한계

1. **로컬 PC가 항상 켜져 있어야 함**
   - PC가 꺼지면 서비스 중단
   - 잠자기 모드로 들어가면 중단

2. **회사 VPN이 항상 연결되어 있어야 함**
   - VPN 끊기면 마이리얼트립 API 접근 불가

3. **안정성**
   - 인터넷 연결 불안정 시 영향
   - 정전 시 서비스 중단

### 권장 사용 시나리오

- ✅ **테스트/프로토타입** - 실제로 작동하는지 검증
- ✅ **초기 베타 사용자** - 소수 파트너 대상
- ⚠️ **프로덕션** - Railway 등으로 이전 권장

---

## 🎯 최종 권장 로드맵

### 1단계: 로컬 프록시로 테스트 (지금)
- CloudFlare Tunnel 사용 (무료 + 고정 URL)
- 실제 작동 검증
- 몇 명의 파트너와 베타 테스트

### 2단계: 안정화 후 Railway 이전 (나중)
- 서비스가 안정적으로 작동 확인
- 사용자 수 증가 시
- Railway로 이전 ($20/월)

---

## 🚀 빠른 시작 (5분 완성)

```bash
# 1. 로컬 프록시 실행
cd local-proxy
npm install
npm start

# 2. 새 터미널 - Ngrok 실행
ngrok http 3001

# 3. Ngrok URL 복사하여 Vercel 환경변수에 추가
# PROXY_URL=https://abc123.ngrok.io

# 4. Vercel 재배포
# (환경변수 추가 후 자동 배포됨)

# 5. 테스트!
# https://luckyglide.vercel.app/test-partner
```

완료! 🎉


