# 다음 단계 가이드

## ✅ 완료된 작업

1. ✅ Supabase 스키마 생성 (`partner_mylinks` 테이블)
2. ✅ 환경변수 설정 (Supabase URL, API 키)
3. ✅ 마이링크 생성 스크립트 수정 및 테스트 성공

## 📋 다음 단계

### 1단계: 더 많은 마이링크 생성 (선택사항)

현재 테스트용으로 1개만 생성했으니, 실제 사용할 데이터를 생성할 수 있습니다:

```bash
# 예시: 도쿄(TYO) 14일치, 체류일 3-7일
PARTNER_ID=test-partner \
GEN_FROM=ICN \
GEN_CODES=TYO \
GEN_DAYS=14 \
GEN_MIN_DAYS=3 \
GEN_MAX_DAYS=7 \
GEN_NONSTOP=false \
npm run generate-mylinks

# 여러 도시를 한번에 생성하려면
PARTNER_ID=test-partner \
GEN_FROM=ICN \
GEN_CODES=TYO,FUK,OSA \
GEN_DAYS=14 \
GEN_MIN_DAYS=3 \
GEN_MAX_DAYS=7 \
GEN_NONSTOP=false \
npm run generate-mylinks
```

**참고**: 
- `GEN_DAYS`: 생성할 출발일 범위 (기본: 14일)
- `GEN_MIN_DAYS`, `GEN_MAX_DAYS`: 체류일 범위 (기본: 3-7일)
- `GEN_CODES`: 특정 목적지만 (비어있으면 모든 도시)
- `GEN_NONSTOP`: 직항만 (true/false)

### 2단계: Supabase에서 데이터 확인

Supabase 대시보드에서 생성된 마이링크 확인:

1. Supabase 대시보드 → Table Editor → `partner_mylinks` 테이블 클릭
2. 또는 SQL Editor에서:
```sql
SELECT 
  partner_id,
  "from",
  "to",
  departure_date,
  return_date,
  trip_days,
  mylink,
  created_at
FROM public.partner_mylinks
WHERE partner_id = 'test-partner'
ORDER BY created_at DESC
LIMIT 10;
```

### 3단계: 로컬 개발 서버 실행 및 API 테스트

#### 3-1. 개발 서버 실행

```bash
npm run dev
```

서버가 실행되면: `http://localhost:5173`

#### 3-2. API 엔드포인트 테스트

브라우저에서 직접 접속하거나 curl로 테스트:

```bash
# 생성한 마이링크가 있는 날짜로 테스트
curl "http://localhost:5173/api/mrt/partner/mylink-query?partnerId=test-partner&from=ICN&to=TYO&depdt=2026-01-29&rtndt=2026-01-31&tripDays=3&nonstop=false"
```

**예상 응답:**
```json
{
  "mylink": "https://myrealt.rip/TqWq07..."
}
```

또는 테스트 스크립트 사용:
```bash
./scripts/test-mylink-query.sh test-partner ICN TYO 2026-01-29 2026-01-31 3 false
```

### 4단계: 프론트엔드에서 파트너 경로 테스트

#### 4-1. 파트너 경로 접속

브라우저에서 접속:
```
http://localhost:5173/test-partner
```

**중요**: 
- 일반 경로 (`/`)는 기존 로직 그대로 작동
- 파트너 경로 (`/test-partner`)에서만 마이링크 사용

#### 4-2. 예약하기 버튼 클릭 테스트

1. 파트너 경로(`/test-partner`)에서 항공권 검색
2. 예약하기 버튼 클릭
3. 개발자 도구(F12) 열기:
   - **Network 탭**: `/api/mrt/partner/mylink-query` 요청 확인
   - **Console 탭**: 에러 메시지 확인
4. 실제 링크 확인:
   - 클릭한 링크가 `https://myrealt.rip/...` 형식인지 확인
   - 마이링크로 리다이렉트되는지 확인

### 5단계: Vercel 배포 및 환경변수 확인

#### 5-1. Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수 확인/설정:

**필수:**
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase anon public key

**파트너별 API 키 (필요시):**
- `MRT_PARTNER_API_KEY_test-partner`: 테스트 파트너 API 키
- `MRT_PARTNER_API_KEY_partner1`: 실제 파트너1 API 키
- ... (각 파트너마다 개별 설정)

**참고**: 
- Vercel에서는 마이링크 생성 API를 직접 호출하지 않으므로, 파트너 API 키는 로컬 스크립트 실행 시에만 필요합니다.
- Vercel에는 Supabase 정보만 있으면 됩니다.

#### 5-2. 배포 및 테스트

```bash
# Git에 커밋 및 푸시
git add .
git commit -m "feat: 파트너 마이링크 기능 추가"
git push

# Vercel이 자동으로 배포합니다
```

배포 후 테스트:
```
https://luckyglide.vercel.app/test-partner
```

### 6단계: 실제 파트너 설정

#### 6-1. 파트너별 API 키 발급

각 파트너마다:
1. 마이리얼트립 파트너 페이지 → Open API → API Key 발급
2. `.env` 파일에 추가:
```
MRT_PARTNER_API_KEY_partner1=발급받은_API_키
MRT_PARTNER_API_KEY_partner2=발급받은_API_키
```

#### 6-2. 파트너별 마이링크 생성

```bash
# 파트너1용 마이링크 생성
PARTNER_ID=partner1 \
GEN_FROM=ICN \
GEN_DAYS=30 \
GEN_MIN_DAYS=3 \
GEN_MAX_DAYS=7 \
GEN_NONSTOP=false \
npm run generate-mylinks

# 파트너2용 마이링크 생성
PARTNER_ID=partner2 \
GEN_FROM=ICN \
GEN_DAYS=30 \
GEN_MIN_DAYS=3 \
GEN_MAX_DAYS=7 \
GEN_NONSTOP=false \
npm run generate-mylinks
```

#### 6-3. 파트너별 URL 제공

각 파트너에게 고유 URL 제공:
- 파트너1: `https://luckyglide.vercel.app/partner1`
- 파트너2: `https://luckyglide.vercel.app/partner2`
- ...

## 🔍 문제 해결

### 문제 1: API에서 마이링크가 null로 반환됨

**원인**: Supabase에 해당 조건의 마이링크가 없음

**해결**:
1. Supabase에서 데이터 확인
2. 마이링크 생성 스크립트 실행
3. 날짜 형식 확인 (YYYY-MM-DD)

### 문제 2: 파트너 경로에서 마이링크가 사용되지 않음

**확인 사항**:
1. URL 경로가 올바른지 확인 (`/test-partner`)
2. 개발자 도구 콘솔에서 에러 확인
3. Network 탭에서 API 요청 확인

### 문제 3: Vercel에서 API 호출 실패

**확인 사항**:
1. Vercel 환경변수 설정 확인
2. Supabase 연결 확인
3. Vercel 로그 확인

## 📝 체크리스트

- [ ] 더 많은 마이링크 생성 (선택)
- [ ] Supabase에서 데이터 확인
- [ ] 로컬 개발 서버 실행
- [ ] API 엔드포인트 테스트
- [ ] 프론트엔드에서 파트너 경로 테스트
- [ ] 예약하기 버튼 클릭 테스트
- [ ] Vercel 환경변수 확인
- [ ] Vercel 배포 및 테스트
- [ ] 실제 파트너 설정 (필요시)

## 🎉 완료!

모든 단계를 완료하면 파트너별 마이링크 기능이 정상 작동합니다!



