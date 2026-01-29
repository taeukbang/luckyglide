# MyLink 생성 가이드

## 📋 사전 준비

### 1. 환경변수 확인

`.env` 파일에 다음이 설정되어 있어야 합니다:

```bash
# Supabase (필수)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 파트너별 API 키 (필수)
MRT_PARTNER_API_KEY_partner1=your-api-key-here
```

### 2. API 키 발급 확인

- 마이리얼트립 파트너 페이지 → Open API → API Key 발급
- 각 파트너마다 별도의 API 키가 필요합니다
- API 키에 IP 화이트리스트가 설정되어 있다면, 로컬 IP를 등록해야 합니다

## 🚀 MyLink 생성 실행

### 기본 실행 (모든 도시, 14일치)

```bash
PARTNER_ID=partner1 npm run generate-mylinks
```

### 특정 도시만 생성

```bash
# 후쿠오카(FUK)만
PARTNER_ID=partner1 \
GEN_FROM=ICN \
GEN_CODES=FUK \
npm run generate-mylinks

# 여러 도시
PARTNER_ID=partner1 \
GEN_FROM=ICN \
GEN_CODES=FUK,TYO,OSA \
npm run generate-mylinks
```

### 날짜 범위 및 체류일 설정

```bash
# 30일치, 체류일 3-7일
PARTNER_ID=partner1 \
GEN_FROM=ICN \
GEN_DAYS=30 \
GEN_MIN_DAYS=3 \
GEN_MAX_DAYS=7 \
GEN_NONSTOP=false \
npm run generate-mylinks
```

### 직항만 생성

```bash
PARTNER_ID=partner1 \
GEN_FROM=ICN \
GEN_NONSTOP=true \
npm run generate-mylinks
```

## 📊 환경변수 설명

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|-------|------|
| `PARTNER_ID` | 파트너 식별자 (필수) | - | `partner1` |
| `GEN_FROM` | 출발 공항 코드 | `ICN` | `ICN` |
| `GEN_CODES` | 목적지 공항 코드 (쉼표 구분) | 모든 도시 | `FUK,TYO` |
| `GEN_DAYS` | 생성할 출발일 범위 | `14` | `30` |
| `GEN_MIN_DAYS` | 최소 체류일 | `3` | `3` |
| `GEN_MAX_DAYS` | 최대 체류일 | `7` | `7` |
| `GEN_NONSTOP` | 직항만 (`true`/`false`) | `false` | `true` |

## ✅ 실행 결과 확인

### 콘솔 출력 예시

```
[generate-mylinks] partner=partner1 from=ICN targets=1 days=14 tripDays=3-7 nonstop=false
[success] ICN -> FUK 2026-05-26 ~ 2026-05-28 (3일) - https://myrealt.rip/...
[success] ICN -> FUK 2026-05-27 ~ 2026-05-29 (3일) - https://myrealt.rip/...
...
[summary] success=42 fail=0 skipped=0
```

### Supabase에서 확인

```sql
SELECT 
  partner_id,
  "from",
  "to",
  departure_date,
  return_date,
  trip_days,
  nonstop,
  LEFT(mylink, 50) as mylink_preview,
  created_at
FROM public.partner_mylinks
WHERE partner_id = 'partner1'
ORDER BY departure_date DESC
LIMIT 10;
```

## ⚠️ 주의사항

1. **API 호출 제한**: MyRealTrip API에 호출 제한이 있을 수 있습니다. 너무 많은 요청을 한 번에 보내지 마세요.
2. **IP 화이트리스트**: API 키에 IP 화이트리스트가 설정되어 있다면, 로컬 IP를 등록해야 합니다.
3. **날짜 범위**: 너무 긴 날짜 범위(`GEN_DAYS`)는 많은 API 호출을 유발할 수 있습니다.
4. **중복 생성**: 같은 조건의 MyLink가 이미 있으면 스킵됩니다 (unique constraint).

## 🔍 문제 해결

### API 키 오류

```
Error: API key not found: MRT_PARTNER_API_KEY_partner1
```

**해결**: `.env` 파일에 `MRT_PARTNER_API_KEY_partner1=your-key` 추가

### API 호출 실패

```
[mylink-api] Error 403: ...
```

**해결**: 
- API 키 권한 확인
- IP 화이트리스트 확인
- API 키가 만료되지 않았는지 확인

### Supabase 연결 실패

```
Error: Supabase env missing
```

**해결**: `.env` 파일에 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 확인

