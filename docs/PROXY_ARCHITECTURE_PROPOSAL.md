# 마이링크 실시간 생성을 위한 새로운 아키텍처 제안

## 문제점
- Vercel은 동적 IP 사용 → 마이리얼트립 IP 화이트리스트 적용 불가
- 사용자 요구사항: 실시간 동적 파라미터로 마이링크 생성 필요

---

## 🎯 제안 1: AWS Lambda + NAT Gateway (권장)

### 아키텍처

```
[사용자 브라우저]
    ↓
[Vercel 프론트엔드] (luckyglide.vercel.app)
    ↓
[Vercel API Route] (/api/mrt/partner/mylink)
    ↓ HTTPS 요청
[AWS Lambda Function] (고정 Elastic IP)
    ↓
[마이리얼트립 API] ✅
```

### 구현 단계

#### 1️⃣ AWS Lambda 함수 생성

```javascript
// lambda/mylink-proxy/index.js
export const handler = async (event) => {
  const { targetUrl, partnerId } = JSON.parse(event.body);
  
  // API 키 가져오기 (환경변수)
  const apiKey = process.env[`MRT_PARTNER_API_KEY_${partnerId}`];
  
  // 마이리얼트립 API 호출
  const response = await fetch('https://partner-ext-api.myrealtrip.com/v1/mylink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetUrl })
  });
  
  const data = await response.json();
  
  return {
    statusCode: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Vercel에서 접근 허용
    },
    body: JSON.stringify(data)
  };
};
```

#### 2️⃣ AWS 인프라 설정

**필요한 리소스:**
1. **VPC** (Virtual Private Cloud)
2. **NAT Gateway** + **Elastic IP** ← 고정 IP
3. **Lambda Function** (VPC 내부 배치)
4. **API Gateway** (Lambda 앞단)

**Terraform 스크립트:**

```hcl
# terraform/main.tf

# 1. VPC 생성
resource "aws_vpc" "mylink_vpc" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "mylink-proxy-vpc"
  }
}

# 2. 서브넷 생성
resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.mylink_vpc.id
  cidr_block = "10.0.1.0/24"
  
  tags = {
    Name = "mylink-private-subnet"
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.mylink_vpc.id
  cidr_block = "10.0.2.0/24"
  
  tags = {
    Name = "mylink-public-subnet"
  }
}

# 3. Elastic IP (고정 IP)
resource "aws_eip" "nat_gateway" {
  domain = "vpc"
  
  tags = {
    Name = "mylink-nat-eip"
  }
}

# 4. NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat_gateway.id
  subnet_id     = aws_subnet.public.id
  
  tags = {
    Name = "mylink-nat-gateway"
  }
}

# 5. Lambda Function
resource "aws_lambda_function" "mylink_proxy" {
  filename      = "lambda-deployment.zip"
  function_name = "mylink-proxy"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  
  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      MRT_PARTNER_API_KEY_partner1 = var.mrt_api_key_partner1
      MRT_PARTNER_API_KEY_test_partner = var.mrt_api_key_test_partner
    }
  }
}

# 6. API Gateway
resource "aws_apigatewayv2_api" "mylink_api" {
  name          = "mylink-proxy-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["https://luckyglide.vercel.app"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }
}

output "elastic_ip" {
  value = aws_eip.nat_gateway.public_ip
  description = "마이리얼트립에 등록할 고정 IP"
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.mylink_api.api_endpoint
  description = "Vercel에서 호출할 Lambda URL"
}
```

#### 3️⃣ Vercel API Route 수정

```typescript
// api/mrt/partner/mylink.ts (Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const LAMBDA_PROXY_URL = process.env.LAMBDA_PROXY_URL; // API Gateway URL

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUrl, partnerId } = req.body;

  try {
    // AWS Lambda로 프록시
    const response = await fetch(LAMBDA_PROXY_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUrl, partnerId }),
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[Vercel] Lambda proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 4️⃣ 배포 및 설정

```bash
# 1. Terraform 초기화
cd terraform
terraform init

# 2. 변수 설정
cat > terraform.tfvars <<EOF
mrt_api_key_partner1 = "실제_API_키_1"
mrt_api_key_test_partner = "실제_API_키_2"
EOF

# 3. AWS 인프라 배포
terraform apply

# 4. 출력된 Elastic IP 확인
terraform output elastic_ip
# 예: 52.79.123.45

# 5. 마이리얼트립에 IP 등록 요청
echo "마이리얼트립 담당자에게 다음 IP 등록 요청:"
terraform output elastic_ip

# 6. Lambda URL을 Vercel 환경변수에 추가
terraform output api_gateway_url
# Vercel Dashboard → Settings → Environment Variables
# LAMBDA_PROXY_URL = <출력된 URL>
```

### 비용 예상

| 항목 | 월 비용 | 설명 |
|------|---------|------|
| NAT Gateway | $32 | 고정 |
| Elastic IP | $3.6 | 사용 시간 기준 |
| Lambda 실행 | $0.20 | 월 100만 요청 기준 |
| API Gateway | $1.00 | 월 100만 요청 기준 |
| **총계** | **~$37** | |

### 장점
- ✅ 고정 IP 보장 (Elastic IP)
- ✅ 완전 서버리스 (관리 불필요)
- ✅ 자동 스케일링
- ✅ 안정성 높음 (AWS 인프라)

### 단점
- ⚠️ 월 $37 비용
- ⚠️ AWS 지식 필요 (초기 설정)

---

## 🎯 제안 2: Railway / Fly.io + 고정 IP (더 간단)

### 아키텍처

```
[Vercel] → [Railway 앱] (고정 IP) → [마이리얼트립 API]
```

### Railway.app 사용 (권장 - 가장 쉬움) ⭐⭐⭐

#### 1️⃣ Railway 프로젝트 생성

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. 로그인
railway login

# 3. 새 프로젝트 생성
railway init
```

#### 2️⃣ Express 프록시 서버 생성

```javascript
// railway-proxy/server.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/mylink', async (req, res) => {
  const { targetUrl, partnerId } = req.body;
  
  const apiKey = process.env[`MRT_PARTNER_API_KEY_${partnerId}`];
  
  if (!apiKey) {
    return res.status(400).json({ error: 'Invalid partnerId' });
  }
  
  try {
    const response = await fetch('https://partner-ext-api.myrealtrip.com/v1/mylink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetUrl })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Mylink API error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

```json
// railway-proxy/package.json
{
  "name": "mylink-proxy",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

#### 3️⃣ Railway 배포

```bash
cd railway-proxy

# Railway에 배포
railway up

# 고정 IP 활성화 (Pro 플랜 필요 - $5/월)
railway domain

# 환경변수 설정
railway variables set MRT_PARTNER_API_KEY_partner1="실제_키"
railway variables set MRT_PARTNER_API_KEY_test_partner="실제_키"

# 배포된 URL 확인
railway status
# 예: https://mylink-proxy-production.up.railway.app
```

#### 4️⃣ Railway에서 고정 IP 설정

```bash
# Railway Pro 플랜 가입 ($5/월)
# Dashboard → Settings → Networking → Static IP 활성화

# 고정 IP 확인
railway logs
# 또는 Dashboard에서 확인
```

#### 5️⃣ Vercel에서 Railway 호출

```typescript
// api/mrt/partner/mylink.ts (Vercel)
const RAILWAY_PROXY_URL = process.env.RAILWAY_PROXY_URL; // Railway URL

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { targetUrl, partnerId } = req.body;

  try {
    const response = await fetch(`${RAILWAY_PROXY_URL}/mylink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl, partnerId }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy error' });
  }
}
```

### Railway 비용

| 플랜 | 월 비용 | 고정 IP | 특징 |
|------|---------|---------|------|
| Hobby | $5 | ❌ | 동적 IP |
| **Pro** | **$20** | **✅** | **고정 IP 제공** |

---

## 🎯 제안 3: 하이브리드 방식 (가장 경제적)

### 컨셉

```
1. 자주 사용되는 조합 → Supabase 사전 생성 (로컬 스크립트)
2. 없는 조합 → Railway/Lambda로 실시간 생성
```

### 구현

```typescript
// api/mrt/partner/mylink.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { targetUrl, partnerId } = req.body;

  // 1단계: Supabase에서 캐시 확인
  const cached = await checkSupabaseCache(targetUrl, partnerId);
  if (cached) {
    return res.json({ data: { mylink: cached }, cached: true });
  }

  // 2단계: Railway 프록시로 실시간 생성
  const response = await fetch(`${RAILWAY_PROXY_URL}/mylink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl, partnerId }),
  });

  const data = await response.json();

  // 3단계: Supabase에 저장 (캐싱)
  if (data.data?.mylink) {
    await saveToSupabase(targetUrl, partnerId, data.data.mylink);
  }

  return res.json({ ...data, cached: false });
}
```

---

## 📊 방식별 비교표

| 방식 | 초기 비용 | 월 비용 | 난이도 | 안정성 | 권장도 |
|------|----------|---------|--------|--------|--------|
| AWS Lambda + NAT | 설정 복잡 | $37 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Railway** | **매우 쉬움** | **$20** | **⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐⭐** |
| Fly.io | 쉬움 | $15 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 하이브리드 | 중간 | $5~20 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 최종 권장: Railway.app

**이유:**
- ✅ 가장 간단한 설정 (30분 내 완료)
- ✅ 고정 IP 제공 (Pro 플랜 $20/월)
- ✅ 자동 스케일링
- ✅ 무료 SSL 인증서
- ✅ 로그 및 모니터링 제공
- ✅ GitHub 연동 자동 배포

**다음 단계:**
1. Railway 계정 생성
2. Pro 플랜 가입 ($20/월)
3. 위 Express 서버 배포
4. 고정 IP 활성화
5. 마이리얼트립에 IP 등록
6. Vercel 환경변수에 Railway URL 추가
7. 완료! 🎉


