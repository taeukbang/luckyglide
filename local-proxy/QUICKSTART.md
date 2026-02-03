# 🚀 로컬 프록시 5분 시작 가이드

당신의 PC를 프록시로 사용하여 **무료**로 마이링크를 실시간 생성합니다!

---

## 📋 필요한 것

- ✅ 회사 VPN 연결 (IP 화이트리스트 통과용)
- ✅ 로컬 PC 항상 켜두기
- ✅ 인터넷 연결

---

## ⚡ 빠른 시작

### 1️⃣ 로컬 프록시 서버 실행 (터미널 1)

```bash
# 프로젝트 루트에서
cd local-proxy

# 패키지 설치 (최초 1회만)
npm install

# .env 파일 생성
cat > .env <<'EOF'
PORT=3001
MRT_PARTNER_API_KEY_test-partner=실제_API_키_입력
EOF

# 서버 실행
npm start
```

**출력 예시:**
```
╔════════════════════════════════════════╗
║  로컬 프록시 서버 시작됨!              ║
╚════════════════════════════════════════╝

포트: 3001
Health Check: http://localhost:3001/health
마이링크 생성: http://localhost:3001/mylink
```

### 2️⃣ Ngrok으로 공개 URL 만들기 (터미널 2)

```bash
# Ngrok 실행
npx ngrok http 3001
```

**출력 예시:**
```
ngrok

Session Status   online
Account          무료 계정 (Sign up: https://ngrok.com/signup)
Version          3.5.0
Region           Asia Pacific (ap)
Latency          -
Web Interface    http://127.0.0.1:4040
Forwarding       https://abc123-456-789.ngrok-free.app -> http://localhost:3001

Connections      ttl     opn     rt1     rt5     p50     p90
                 0       0       0.00    0.00    0.00    0.00
```

✅ **이 URL을 복사하세요**: `https://abc123-456-789.ngrok-free.app`

### 3️⃣ Vercel 환경변수 설정

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - `luckyglide` 프로젝트 선택

2. **Settings → Environment Variables**
   - 변수명: `PROXY_URL`
   - 값: `https://abc123-456-789.ngrok-free.app` (위에서 복사한 URL)
   - 체크박스: `Production`, `Preview`, `Development` 모두 선택
   - **Save** 클릭

3. **재배포 대기**
   - 환경변수 추가 시 자동으로 재배포됨
   - 약 1~2분 소요

### 4️⃣ 테스트!

```bash
# Health Check
curl https://abc123-456-789.ngrok-free.app/health

# 예상 응답:
# {
#   "status": "healthy",
#   "timestamp": "2026-01-30T...",
#   "message": "로컬 프록시 서버 정상 작동 중"
# }

# 실제 웹사이트에서 테스트
# https://luckyglide.vercel.app/test-partner
# → 항공권 예약하기 버튼 클릭
# → 504 에러 대신 마이링크로 리다이렉트! 🎉
```

---

## 🎯 작동 흐름

```
[사용자] 예약 버튼 클릭
   ↓
[Vercel 프론트엔드] luckyglide.vercel.app
   ↓
[Vercel API Route] /api/mrt/partner/mylink
   ↓ HTTPS (인터넷)
[Ngrok] https://abc123.ngrok-free.app
   ↓
[당신의 로컬 PC:3001] ← 회사 VPN 연결 ✅
   ↓
[마이리얼트립 API] partner-ext-api.myrealtrip.com
   ↓
[마이링크 생성] myrealt.rip/xxxxx
   ↓
[사용자에게 전달] 🎉
```

---

## 🔍 문제 해결

### ❌ 503 Service Unavailable

**원인**: 로컬 프록시 서버가 꺼져 있거나 Ngrok이 중단됨

**해결**:
```bash
# 터미널 1: 로컬 프록시 확인
cd local-proxy
npm start

# 터미널 2: Ngrok 확인
npx ngrok http 3001
```

### ❌ 401 Unauthorized

**원인**: API 키가 잘못됨

**해결**:
```bash
# local-proxy/.env 파일 확인
cat local-proxy/.env

# API 키가 맞는지 확인
# MRT_PARTNER_API_KEY_test-partner=실제_API_키
```

### ❌ Connection Timeout

**원인**: 회사 VPN 연결 끊김

**해결**:
- 회사 VPN 재연결
- 로컬 프록시 서버 재시작

### 🔗 Ngrok URL이 계속 바뀜

**원인**: Ngrok 무료 플랜은 재시작 시 URL 변경

**해결책 1: Ngrok URL 바뀔 때마다 Vercel 환경변수 업데이트**
- Vercel Dashboard에서 `PROXY_URL` 수정

**해결책 2: Ngrok 유료 플랜 ($8/월)**
```bash
# 고정 URL 사용
ngrok http 3001 --domain=mylink-proxy.ngrok.app
```

**해결책 3: CloudFlare Tunnel (무료 + 고정 URL)**
- `local-proxy/README.md` 참고

---

## 📊 예상 성능

| 항목 | 시간 |
|------|------|
| 사용자 → Vercel | ~50ms |
| Vercel → Ngrok → 로컬 | ~100ms |
| 로컬 → 마이리얼트립 | ~200ms |
| **총 응답 시간** | **~350ms** ✅ |

기존 직접 호출 대비 **약간 느리지만** 504 에러 없이 안정적!

---

## 💰 비용

| 항목 | 비용 |
|------|------|
| 로컬 프록시 서버 | **무료** (당신의 PC) |
| Ngrok 무료 플랜 | **무료** |
| Ngrok 유료 (고정 URL) | $8/월 (선택) |
| CloudFlare Tunnel | **무료** (권장) |

---

## ⚠️ 주의사항

1. **로컬 PC가 항상 켜져 있어야 합니다**
   - Mac 시스템 환경설정 → 에너지 절약 → 디스플레이 끄기만 허용

2. **회사 VPN이 항상 연결되어 있어야 합니다**

3. **인터넷 연결이 안정적이어야 합니다**

4. **프로덕션 환경에는 권장하지 않음**
   - 테스트/베타 용도로만 사용
   - 안정화 후 Railway 등으로 이전 권장

---

## 🎯 다음 단계

### 현재 (테스트 단계)
- ✅ 로컬 프록시로 실제 작동 검증
- ✅ 소수 파트너와 베타 테스트

### 나중 (프로덕션 전환)
- 📦 Railway로 이전 ($20/월, 고정 IP)
- 🚀 AWS Lambda + NAT Gateway (확장 가능)

---

## 📞 도움이 필요하면

1. **로컬 프록시 로그 확인**
   ```bash
   # 터미널 1에서 실시간 로그 확인
   ```

2. **Ngrok Web Interface**
   ```bash
   # 브라우저에서 접속
   http://127.0.0.1:4040
   
   # 모든 요청/응답 확인 가능
   ```

3. **Vercel 로그 확인**
   - Vercel Dashboard → Deployments → 최신 배포 → Logs

---

## ✅ 체크리스트

- [ ] 회사 VPN 연결됨
- [ ] 로컬 프록시 서버 실행 중 (터미널 1)
- [ ] Ngrok 실행 중 (터미널 2)
- [ ] Ngrok URL 복사함
- [ ] Vercel 환경변수 `PROXY_URL` 추가함
- [ ] Vercel 재배포 완료 대기함
- [ ] 테스트 성공! 🎉

---

**완료되면 당신의 로컬 PC가 마이링크 생성 서버가 됩니다!** 🚀


