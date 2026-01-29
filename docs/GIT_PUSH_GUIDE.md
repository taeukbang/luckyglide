# Git 푸시 인증 가이드

## 🔐 인증 실패 해결 방법

### 방법 1: Personal Access Token 사용 (권장)

#### 1단계: GitHub에서 토큰 생성
1. GitHub 웹사이트 접속: https://github.com
2. 오른쪽 위 프로필 아이콘 클릭 → **Settings**
3. 왼쪽 하단 **Developer settings** 클릭
4. **Personal access tokens** → **Tokens (classic)** 클릭
5. **Generate new token (classic)** 클릭
6. 설정:
   - **Note**: "LuckyGlide Deploy" (원하는 이름)
   - **Expiration**: 원하는 기간 (예: 90 days)
   - **Scopes**: `repo` 체크박스 선택
7. **Generate token** 클릭
8. **토큰을 복사** (한 번만 표시됨! 저장해두세요)

#### 2단계: 터미널에서 푸시
```bash
cd /Users/sujung-hong/Documents/GitHub/luckyglide
git push
```

인증 요청 시:
- **Username**: GitHub 사용자명 입력
- **Password**: 위에서 복사한 Personal Access Token 붙여넣기

---

### 방법 2: GitHub Desktop 사용 (가장 쉬움)

1. **GitHub Desktop** 앱 다운로드 및 설치
   - https://desktop.github.com
2. GitHub 계정으로 로그인
3. **File** → **Add Local Repository**
4. `/Users/sujung-hong/Documents/GitHub/luckyglide` 선택
5. **Publish branch** 또는 **Push origin** 버튼 클릭

---

### 방법 3: SSH 키 설정 (고급)

SSH 키가 이미 설정되어 있다면:
```bash
cd /Users/sujung-hong/Documents/GitHub/luckyglide
git remote set-url origin git@github.com:taeukbang/luckyglide.git
git push
```

SSH 키가 없다면:
1. SSH 키 생성:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. 공개 키 복사:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. GitHub에 추가:
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - 복사한 키 붙여넣기

---

## 💡 추천 방법

**가장 쉬운 방법**: GitHub Desktop 사용
- GUI로 쉽게 푸시 가능
- 인증 자동 처리
- 시각적으로 변경사항 확인 가능

**빠른 방법**: Personal Access Token 사용
- 터미널에서 바로 가능
- 토큰만 생성하면 됨

어떤 방법을 사용하시겠어요?

