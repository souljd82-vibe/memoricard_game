# SBI 멀티플레이어 메모리카드 게임

실시간으로 여러 명이 함께 즐길 수 있는 메모리카드 게임입니다.

## 🎮 게임 특징

- **실시간 멀티플레이어**: 최대 4명까지 동시에 게임 가능
- **순위 시스템**: 일별, 주간, 전체 순위표
- **사용자 친화적 UI**: 반응형 디자인과 직관적인 인터페이스
- **실시간 통신**: WebSocket을 통한 즉시 게임 상태 동기화

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 서버 실행
```bash
npm start
```

또는 개발 모드로 실행 (자동 재시작):
```bash
npm run dev
```

### 3. 게임 접속
브라우저에서 `http://localhost:3000` 열기

## 🎯 게임 방법

1. **닉네임 입력**: 게임 시작 시 20자 이하의 닉네임 입력
2. **자동 매칭**: 2명 이상 모이면 자동으로 게임 시작 (3초 대기)
3. **턴 기반**: 순서대로 카드 2장씩 뒤집기
4. **점수 획득**: 같은 그림 카드 매칭 시 10점 획득
5. **게임 종료**: 8쌍 모두 매칭 완료 시 점수가 높은 플레이어 승리

## 📁 프로젝트 구조

```
memoricard_game/
├── index.html          # 메인 게임 페이지
├── styles.css          # 게임 스타일시트
├── client.js           # 클라이언트 게임 로직
├── server.js           # Node.js 서버 및 게임 로직
├── package.json        # 프로젝트 설정
└── README.md          # 프로젝트 문서
```

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **실시간 통신**: Socket.IO
- **기타**: UUID (방 ID 생성)

## 📊 게임 기능

### 멀티플레이어
- 최대 4명 동시 플레이
- 자동 방 매칭
- 실시간 플레이어 상태 표시

### 순위 시스템
- 승률 기반 순위
- 일별/주간/전체 통계
- 상위 50명 리더보드

### 게임 진행
- 턴 기반 게임플레이
- 실시간 점수 업데이트
- 게임 타이머
- 자동 게임 종료

## 🎨 UI 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **현대적 디자인**: 그라데이션과 부드러운 애니메이션
- **직관적 인터페이스**: 명확한 버튼과 상태 표시
- **실시간 피드백**: 카드 뒤집기 애니메이션과 매치 효과

## 📱 모바일 지원

- 터치 인터페이스 최적화
- 반응형 그리드 레이아웃
- 모바일 친화적 버튼 크기
- 세로/가로 방향 지원

## 🔧 커스터마이징

### 카드 개수 변경
`server.js`의 `symbols` 배열을 수정하여 카드 종류 조정:

```javascript
this.symbols = ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑', '🥭']; // 8쌍 = 16장
```

### 최대 플레이어 수 변경
`GameRoom` 클래스의 `addPlayer` 메서드에서 제한 수정:

```javascript
if (this.players.length >= 4) { // 원하는 수로 변경
```

### 점수 시스템 조정
`checkMatch` 메서드에서 점수 변경:

```javascript
this.players[this.currentPlayerIndex].score += 10; // 원하는 점수로 변경
```

## 🌐 배포

### Railway 자동 배포 (추천)
이 프로젝트는 GitHub Actions를 통해 Railway에 자동 배포됩니다.

1. **Railway 계정 생성**: https://railway.app (GitHub 로그인)
2. **프로젝트 연결**: GitHub 저장소를 Railway와 연결
3. **자동 배포**: `master` 브랜치에 푸시하면 자동으로 배포

### 수동 배포 옵션
- **Railway**: Git 연결 후 자동 배포
- **Render**: Node.js 환경 지원
- **Heroku**: `git push heroku main`

### 배포 설정 파일
- `.github/workflows/deploy.yml`: GitHub Actions 워크플로우
- `railway.json`: Railway 배포 설정
- `Procfile`: 프로세스 실행 명령어

## 🐛 문제 해결

### 연결 문제
- 방화벽 설정 확인
- 포트 3000 사용 가능 여부 확인
- 네트워크 연결 상태 확인

### 게임 오류
- 브라우저 콘솔에서 오류 메시지 확인
- 페이지 새로고침으로 재연결
- 서버 재시작

## 📈 향후 계획

- [ ] 게임 룸 비밀번호 설정
- [ ] 친구 초대 기능
- [ ] 다양한 카드 테마
- [ ] 게임 리플레이 기능
- [ ] 채팅 시스템
- [ ] 토너먼트 모드

## 🤝 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

---

즐거운 게임 되세요! 🎮✨