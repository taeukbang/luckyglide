#!/bin/bash
# 마이링크 조회 API 빠른 테스트 스크립트

# 기본값 설정
PARTNER_ID=${1:-"test-partner"}
FROM=${2:-"ICN"}
TO=${3:-"TYO"}
DEPDT=${4:-"$(date -v+1d '+%Y-%m-%d' 2>/dev/null || date -d '+1 day' '+%Y-%m-%d')"}
RTNDT=${5:-"$(date -v+4d '+%Y-%m-%d' 2>/dev/null || date -d '+4 days' '+%Y-%m-%d')"}
TRIP_DAYS=${6:-"3"}
NONSTOP=${7:-"false"}

# 로컬 개발 서버 URL (필요시 수정)
BASE_URL=${BASE_URL:-"http://localhost:5173"}

echo "=== 마이링크 조회 API 테스트 ==="
echo "Partner ID: $PARTNER_ID"
echo "From: $FROM"
echo "To: $TO"
echo "Departure: $DEPDT"
echo "Return: $RTNDT"
echo "Trip Days: $TRIP_DAYS"
echo "Nonstop: $NONSTOP"
echo ""

# API 호출
URL="${BASE_URL}/api/mrt/partner/mylink-query?partnerId=${PARTNER_ID}&from=${FROM}&to=${TO}&depdt=${DEPDT}&rtndt=${RTNDT}&tripDays=${TRIP_DAYS}&nonstop=${NONSTOP}"

echo "Request URL: $URL"
echo ""

RESPONSE=$(curl -s "$URL")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 결과 확인
if echo "$RESPONSE" | grep -q '"mylink"'; then
  MYLINK=$(echo "$RESPONSE" | grep -o '"mylink":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$MYLINK" ] && [ "$MYLINK" != "null" ]; then
    echo "✅ 마이링크 조회 성공: $MYLINK"
  else
    echo "⚠️  마이링크가 없습니다 (fallback으로 기존 URL 사용)"
  fi
else
  echo "❌ API 호출 실패"
fi




