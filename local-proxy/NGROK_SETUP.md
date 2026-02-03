# Ngrok 설정 및 실행 가이드

## 1. Ngrok 계정 생성 (무료)

1. https://dashboard.ngrok.com/signup 접속
2. 계정 생성 (GitHub, Google 계정으로 가능)
3. Dashboard에서 authtoken 복사

## 2. Authtoken 설정

```bash
# Authtoken 설정 (한 번만 실행)
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## 3. Ngrok 실행

```bash
# 터미널 2에서 실행 (로컬 프록시가 실행 중인 상태에서)
ngrok http 3001

# 출력 예시:
# Forwarding   https://abc123.ngrok-free.app -> http://localhost:3001
#              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#              이 URL을 복사하세요!
```

## 4. Vercel 환경변수 설정

1. Vercel Dashboard 접속: https://vercel.com/dashboard
2. `luckyglide` 프로젝트 선택
3. Settings → Environment Variables
4. 추가:
   - Name: `PROXY_URL`
   - Value: `https://abc123.ngrok-free.app` (복사한 URL)
   - Environment: Production, Preview, Development 모두 체크
5. Save

## 5. 재배포

- 환경변수 추가 후 자동으로 재배포됩니다 (1~2분 소요)

## 주의사항

- 로컬 프록시 서버(localhost:3001)가 항상 실행 중이어야 합니다
- 회사 VPN이 연결되어 있어야 합니다
- Ngrok 무료 플랜은 재시작 시 URL이 바뀝니다


