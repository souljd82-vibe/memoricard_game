// 클라이언트 게임 로직
class MemoryCardGame {
    constructor() {
        this.socket = null; // 나중에 멀티플레이어 모드에서만 초기화
        this.playerId = null;
        this.gameState = null;
        this.selectedCards = [];
        this.isMyTurn = false;
        this.gameTimer = 0;
        this.timerInterval = null;
        this.gameMode = null; // 'single' or 'multi'
        this.singlePlayerGame = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.showGameModeSelection();
    }

    initializeElements() {
        // 모달 요소들
        this.gameModeModal = document.getElementById('gameModeModal');
        this.singlePlayerModal = document.getElementById('singlePlayerModal');
        this.userIdModal = document.getElementById('userIdModal');
        this.userIdInput = document.getElementById('userIdInput');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.difficultySelect = document.getElementById('difficultySelect');
        
        // 모드 선택 버튼들
        this.singlePlayerBtn = document.getElementById('singlePlayerBtn');
        this.multiPlayerBtn = document.getElementById('multiPlayerBtn');
        this.startSingleGameBtn = document.getElementById('startSingleGameBtn');
        this.joinGameBtn = document.getElementById('joinGameBtn');
        this.backToModeBtn = document.getElementById('backToModeBtn');
        this.backFromMultiBtn = document.getElementById('backFromMultiBtn');
        
        // 게임 컨테이너
        this.gameContainer = document.getElementById('gameContainer');
        
        // 게임 정보 요소들
        this.currentPlayer = document.getElementById('currentPlayer');
        this.roomCode = document.getElementById('roomCode');
        this.currentTurn = document.getElementById('currentTurn');
        this.myScore = document.getElementById('myScore');
        this.gameTimerEl = document.getElementById('gameTimer');
        this.playersList = document.getElementById('playersList');
        this.memoryCards = document.getElementById('memoryCards');
        
        // 버튼들
        this.newGameBtn = document.getElementById('newGameBtn');
        this.leaderboardBtn = document.getElementById('leaderboardBtn');
        this.leaveGameBtn = document.getElementById('leaveGameBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 리더보드 모달
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.closeLeaderboard = document.getElementById('closeLeaderboard');
        this.leaderboardList = document.getElementById('leaderboardList');
        
        // 게임 결과 모달
        this.gameResultModal = document.getElementById('gameResultModal');
        this.gameResult = document.getElementById('gameResult');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
        
        // 연결 상태
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
    }

    setupEventListeners() {
        // 모드 선택
        this.singlePlayerBtn.addEventListener('click', () => this.showSinglePlayerSetup());
        this.multiPlayerBtn.addEventListener('click', () => this.showMultiPlayerSetup());
        
        // 싱글플레이어 설정
        this.startSingleGameBtn.addEventListener('click', () => this.startSinglePlayerGame());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startSinglePlayerGame();
        });
        
        // 멀티플레이어 참여
        this.joinGameBtn.addEventListener('click', () => this.joinMultiPlayerGame());
        this.userIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinMultiPlayerGame();
        });
        
        // 뒤로 가기 버튼들
        this.backToModeBtn.addEventListener('click', () => this.showGameModeSelection());
        this.backFromMultiBtn.addEventListener('click', () => this.showGameModeSelection());

        // 게임 컨트롤
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.leaveGameBtn.addEventListener('click', () => this.leaveGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());

        // 리더보드
        this.closeLeaderboard.addEventListener('click', () => {
            this.leaderboardModal.classList.add('hidden');
        });

        // 리더보드 탭 이벤트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadLeaderboard(e.target.dataset.tab);
            });
        });

        // 게임 결과 모달
        this.playAgainBtn.addEventListener('click', () => {
            this.gameResultModal.classList.add('hidden');
            this.startNewGame();
        });

        this.viewLeaderboardBtn.addEventListener('click', () => {
            this.gameResultModal.classList.add('hidden');
            this.showLeaderboard();
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.leaderboardModal.classList.add('hidden');
                this.gameResultModal.classList.add('hidden');
            }
        });
    }

    setupSocketListeners() {
        // 연결 상태
        this.socket.on('connect', () => {
            this.statusText.textContent = '연결됨';
            this.connectionStatus.classList.add('connected');
            this.connectionStatus.classList.remove('disconnected');
        });

        this.socket.on('disconnect', () => {
            this.statusText.textContent = '연결 끊김';
            this.connectionStatus.classList.add('disconnected');
            this.connectionStatus.classList.remove('connected');
        });

        // 게임 이벤트
        this.socket.on('gameJoined', (data) => {
            this.playerId = data.playerId;
            this.currentPlayer.textContent = `플레이어: ${data.playerId}`;
            this.roomCode.textContent = `방 코드: ${data.roomId}`;
            this.userIdModal.classList.add('hidden');
            this.gameContainer.classList.remove('hidden');
        });

        this.socket.on('gameStateUpdate', (gameState) => {
            this.updateGameState(gameState);
        });

        this.socket.on('cardFlipped', (data) => {
            this.handleCardFlip(data);
        });

        this.socket.on('cardsMatched', (data) => {
            this.handleCardsMatched(data);
        });

        this.socket.on('turnChanged', (data) => {
            this.handleTurnChange(data);
        });

        this.socket.on('gameEnded', (data) => {
            this.handleGameEnd(data);
        });

        this.socket.on('playersUpdate', (players) => {
            this.updatePlayersList(players);
        });

        this.socket.on('leaderboardData', (data) => {
            this.displayLeaderboard(data);
        });

        this.socket.on('error', (error) => {
            alert(`오류: ${error.message}`);
        });
    }

    // 게임 모드 선택 관련 메서드들
    showGameModeSelection() {
        this.gameModeModal.classList.remove('hidden');
        this.singlePlayerModal.classList.add('hidden');
        this.userIdModal.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        
        // 게임 모드 초기화
        this.gameMode = null;
        document.body.classList.remove('single-player-mode', 'multi-player-mode');
    }

    showSinglePlayerSetup() {
        this.gameModeModal.classList.add('hidden');
        this.singlePlayerModal.classList.remove('hidden');
        this.playerNameInput.focus();
    }

    showMultiPlayerSetup() {
        this.gameModeModal.classList.add('hidden');
        this.userIdModal.classList.remove('hidden');
        this.userIdInput.focus();
    }

    startSinglePlayerGame() {
        const playerName = this.playerNameInput.value.trim();
        const difficulty = this.difficultySelect.value;

        if (!playerName) {
            alert('닉네임을 입력해주세요!');
            return;
        }

        if (playerName.length > 20) {
            alert('닉네임은 20자 이하로 입력해주세요!');
            return;
        }

        this.gameMode = 'single';
        this.singlePlayerGame = new SinglePlayerGame();
        
        // 모든 모달 숨기기
        this.singlePlayerModal.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        
        // 싱글플레이어 게임 시작
        this.singlePlayerGame.initializeGame(playerName, difficulty);
    }

    joinMultiPlayerGame() {
        const userId = this.userIdInput.value.trim();
        if (!userId) {
            alert('닉네임을 입력해주세요!');
            return;
        }

        if (userId.length > 20) {
            alert('닉네임은 20자 이하로 입력해주세요!');
            return;
        }

        this.gameMode = 'multi';
        
        // Socket.IO 초기화 (멀티플레이어 모드에서만)
        if (!this.socket) {
            this.socket = io();
            this.setupSocketListeners();
        }
        
        this.socket.emit('joinGame', { playerId: userId });
        
        // 멀티플레이어 모드 설정
        document.body.classList.add('multi-player-mode');
        document.body.classList.remove('single-player-mode');
    }

    startNewGame() {
        if (this.gameMode === 'single') {
            if (this.singlePlayerGame) {
                this.singlePlayerGame.newGame();
            }
        } else if (this.gameMode === 'multi' && this.socket) {
            this.socket.emit('startNewGame');
            this.resetTimer();
        }
    }

    pauseGame() {
        if (this.gameMode === 'single' && this.singlePlayerGame) {
            this.singlePlayerGame.pauseGame();
        }
    }

    leaveGame() {
        if (confirm('정말로 게임을 나가시겠습니까?')) {
            if (this.gameMode === 'multi' && this.socket) {
                this.socket.emit('leaveGame');
            }
            
            // 모든 타이머 정지
            this.resetTimer();
            if (this.singlePlayerGame) {
                this.singlePlayerGame.stopTimer();
            }
            
            // 입력 필드 초기화
            this.userIdInput.value = '';
            this.playerNameInput.value = '';
            
            // 게임 모드 선택 화면으로 돌아가기
            this.showGameModeSelection();
        }
    }

    updateGameState(gameState) {
        this.gameState = gameState;
        this.isMyTurn = gameState.currentPlayer === this.playerId;
        
        // 게임 보드 업데이트
        this.renderGameBoard(gameState.cards);
        
        // 현재 턴 표시
        this.currentTurn.textContent = gameState.currentPlayer || '-';
        
        // 내 점수 업데이트
        const myPlayer = gameState.players.find(p => p.id === this.playerId);
        this.myScore.textContent = myPlayer ? myPlayer.score : 0;
        
        // 플레이어 목록 업데이트
        this.updatePlayersList(gameState.players);
    }

    renderGameBoard(cards) {
        this.memoryCards.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            
            if (card.isFlipped || card.isMatched) {
                if (card.character) {
                    // 캐릭터 시스템 사용
                    const img = document.createElement('img');
                    img.src = card.character.image;
                    img.alt = card.character.name;
                    img.className = 'character-image';
                    
                    // 이미지 로드 실패시 이모지 표시
                    img.onerror = () => {
                        cardElement.innerHTML = `
                            <div class="character-fallback" data-character="${card.characterId}">
                                <div class="character-emoji">${card.character.emoji}</div>
                                <div class="character-name">${card.character.name}</div>
                            </div>
                        `;
                    };
                    
                    cardElement.innerHTML = '';
                    cardElement.appendChild(img);
                } else {
                    // 기존 심볼 시스템 (하위 호환성)
                    cardElement.textContent = card.symbol || '❓';
                }
                cardElement.classList.add('flipped');
            }
            
            if (card.isMatched) {
                cardElement.classList.add('matched');
            }
            
            if (!this.isMyTurn || card.isMatched) {
                cardElement.classList.add('disabled');
            }
            
            cardElement.addEventListener('click', () => this.handleCardClick(index));
            this.memoryCards.appendChild(cardElement);
        });
    }

    handleCardClick(cardIndex) {
        if (!this.isMyTurn) {
            alert('당신의 턴이 아닙니다!');
            return;
        }

        const card = this.gameState.cards[cardIndex];
        if (card.isFlipped || card.isMatched) {
            return;
        }

        if (this.selectedCards.length >= 2) {
            return;
        }

        this.socket.emit('cardClick', { cardIndex });
    }

    handleCardFlip(data) {
        const cardElement = this.memoryCards.children[data.cardIndex];
        
        if (data.character) {
            // 캐릭터 시스템 사용
            const img = document.createElement('img');
            img.src = data.character.image;
            img.alt = data.character.name;
            img.className = 'character-image';
            
            // 이미지 로드 실패시 이모지 표시
            img.onerror = () => {
                cardElement.innerHTML = `
                    <div class="character-fallback" data-character="${data.characterId}">
                        <div class="character-emoji">${data.character.emoji}</div>
                        <div class="character-name">${data.character.name}</div>
                    </div>
                `;
            };
            
            cardElement.innerHTML = '';
            cardElement.appendChild(img);
        } else {
            // 기존 심볼 시스템 (하위 호환성)
            cardElement.textContent = data.symbol || '❓';
        }
        
        cardElement.classList.add('flipped', 'flip-animation');
        
        setTimeout(() => {
            cardElement.classList.remove('flip-animation');
        }, 600);
    }

    handleCardsMatched(data) {
        data.matchedCards.forEach(cardIndex => {
            const cardElement = this.memoryCards.children[cardIndex];
            cardElement.classList.add('matched', 'match-animation');
            
            setTimeout(() => {
                cardElement.classList.remove('match-animation');
            }, 500);
        });
    }

    handleTurnChange(data) {
        this.isMyTurn = data.currentPlayer === this.playerId;
        this.currentTurn.textContent = data.currentPlayer;
        
        // 카드들의 disabled 상태 업데이트
        document.querySelectorAll('.memory-card').forEach(card => {
            if (!this.isMyTurn || card.classList.contains('matched')) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }

    handleGameEnd(data) {
        this.resetTimer();
        
        let resultHTML = '<div class="winner-announcement">';
        if (data.winner === this.playerId) {
            resultHTML += '🎉 축하합니다! 승리했습니다! 🎉';
        } else if (data.winner) {
            resultHTML += `🏆 ${data.winner}님이 승리했습니다!`;
        } else {
            resultHTML += '🤝 무승부입니다!';
        }
        resultHTML += '</div>';
        
        resultHTML += '<div class="final-scores"><h3>최종 점수</h3>';
        data.finalScores.forEach(player => {
            resultHTML += `
                <div class="score-item">
                    <span>${player.id}</span>
                    <span>${player.score}점</span>
                </div>
            `;
        });
        resultHTML += '</div>';
        
        this.gameResult.innerHTML = resultHTML;
        this.gameResultModal.classList.remove('hidden');
    }

    updatePlayersList(players) {
        this.playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            
            if (this.gameState && player.id === this.gameState.currentPlayer) {
                playerElement.classList.add('current-turn');
            }
            
            playerElement.innerHTML = `
                <span>${player.id}</span>
                <span class="player-score">${player.score}점</span>
            `;
            
            this.playersList.appendChild(playerElement);
        });
    }

    showLeaderboard() {
        this.leaderboardModal.classList.remove('hidden');
        this.loadLeaderboard('today');
    }

    loadLeaderboard(period) {
        if (this.gameMode === 'single' && this.singlePlayerGame) {
            // 싱글플레이어 리더보드 표시
            const data = this.singlePlayerGame.getLeaderboardData(period);
            this.displaySinglePlayerLeaderboard(data);
        } else if (this.gameMode === 'multi' && this.socket) {
            // 멀티플레이어 리더보드 요청
            this.socket.emit('getLeaderboard', { period });
        }
    }

    displayLeaderboard(data) {
        this.leaderboardList.innerHTML = '';
        
        if (data.length === 0) {
            this.leaderboardList.innerHTML = '<p style="text-align: center; color: #666;">아직 기록이 없습니다.</p>';
            return;
        }
        
        data.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            item.innerHTML = `
                <span class="rank">${rankEmoji} ${index + 1}</span>
                <span class="player-name">${player.playerId}</span>
                <div class="player-stats">
                    <div class="wins">${player.wins}승</div>
                    <div>${player.totalGames}게임</div>
                </div>
            `;
            
            this.leaderboardList.appendChild(item);
        });
    }

    displaySinglePlayerLeaderboard(data) {
        this.leaderboardList.innerHTML = '';
        
        if (data.length === 0) {
            this.leaderboardList.innerHTML = '<p style="text-align: center; color: #666;">아직 기록이 없습니다.</p>';
            return;
        }
        
        data.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            const timeText = this.formatTime(record.time);
            
            item.innerHTML = `
                <span class="rank">${rankEmoji} ${index + 1}</span>
                <span class="player-name">${record.playerId}</span>
                <div class="player-stats">
                    <div class="difficulty">${record.difficulty}</div>
                    <div class="time">${timeText} (${record.moves}회)</div>
                    <div class="score">${record.score}점</div>
                </div>
            `;
            
            this.leaderboardList.appendChild(item);
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.gameTimer = 0;
        this.gameTimerEl.textContent = '00:00';
    }

    startTimer() {
        this.resetTimer();
        this.timerInterval = setInterval(() => {
            this.gameTimer++;
            const minutes = Math.floor(this.gameTimer / 60);
            const seconds = this.gameTimer % 60;
            this.gameTimerEl.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MemoryCardGame();
});