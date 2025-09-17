// 싱글플레이어 게임 로직
class SinglePlayerGame {
    constructor() {
        this.playerName = '';
        this.difficulty = 'medium';
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.moveCount = 0;
        this.gameTimer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.gameStartTime = null;
        this.bestTimes = this.loadBestTimes();
        
        // K-Pop Demon Hunters (Huntrix) 캐릭터들 - 로컬 이미지 사용
        this.characters = {
            rumi: { 
                name: 'Rumi', 
                image: 'images/Rumi.jpg',
                emoji: '💜', 
                color: '#8B4D9A',
                description: '보라색 머리의 우아한 리더'
            },
            mira: { 
                name: 'Mira', 
                image: 'images/Mira.jpg',
                emoji: '🔥', 
                color: '#DC143C',
                description: '빨간 머리의 열정적인 파이터'
            },
            zoey: { 
                name: 'Zoey', 
                image: 'images/Zoey.jpg',
                emoji: '🌱', 
                color: '#32CD32',
                description: '초록 테마의 상큼한 캐릭터'
            },
            jinsu: { 
                name: 'Jinsu', 
                image: 'images/Jinsu.jpg',
                emoji: '💙', 
                color: '#4169E1',
                description: '파란 테마의 쿨한 남성'
            },
            abby_saja: { 
                name: 'Abby Saja', 
                image: 'images/Abby Saja.jpg',
                emoji: '🌿', 
                color: '#228B22',
                description: '초록 재킷의 사자 멤버'
            },
            mystery_saja: { 
                name: 'Mystery Saja', 
                image: 'images/Mystery saja.jpg',
                emoji: '🤍', 
                color: '#B0C4DE',
                description: '은발의 신비로운 사자'
            },
            baby_saja: { 
                name: 'Baby Saja', 
                image: 'images/Baby saja.jpg',
                emoji: '💚', 
                color: '#00CED1',
                description: '청록 머리의 귀여운 사자'
            },
            romance_saja: { 
                name: 'Romance Saja', 
                image: 'images/Romance saja.jpg',
                emoji: '💖', 
                color: '#FFB6C1',
                description: '분홍 테마의 로맨틱 사자'
            },
            bobby: { 
                name: 'Bobby', 
                image: 'images/Bobby.jpg',
                emoji: '😄', 
                color: '#FFD700',
                description: '밝게 웃는 친근한 캐릭터'
            },
            sussie: { 
                name: 'Sussie', 
                image: 'images/Sussie.jpg',
                emoji: '🎩', 
                color: '#2F4F4F',
                description: '검은 모자의 미스터리 캐릭터'
            },
            derpy: { 
                name: 'Derpy', 
                image: 'images/Derpy.jpg',
                emoji: '👀', 
                color: '#4682B4',
                description: '파란 괴물 캐릭터'
            },
            extra1: { name: 'Shadow', image: 'images/shadow.png', emoji: '🌙', color: '#483D8B' },
            extra2: { name: 'Flame', image: 'images/flame.png', emoji: '🔥', color: '#FF4500' },
            extra3: { name: 'Crystal', image: 'images/crystal.png', emoji: '💎', color: '#9370DB' },
            extra4: { name: 'Storm', image: 'images/storm.png', emoji: '⚡', color: '#4B0082' }
        };

        this.difficultySettings = {
            easy: { 
                pairs: 6, 
                cols: 3, 
                rows: 4, 
                characters: ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja'] 
            },
            medium: { 
                pairs: 8, 
                cols: 4, 
                rows: 4, 
                characters: ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja', 'baby_saja', 'romance_saja'] 
            },
            hard: { 
                pairs: 10, 
                cols: 4, 
                rows: 5, 
                characters: ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja', 'baby_saja', 'romance_saja', 'bobby', 'sussie'] 
            },
            expert: { 
                pairs: 11, 
                cols: 4, 
                rows: 6, 
                characters: ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja', 'baby_saja', 'romance_saja', 'bobby', 'sussie', 'derpy'] 
            }
        };
    }

    initializeGame(playerName, difficulty) {
        console.log('싱글플레이어 게임 초기화 시작:', playerName, difficulty);
        
        this.playerName = playerName;
        this.difficulty = difficulty;
        
        const settings = this.difficultySettings[difficulty];
        this.totalPairs = settings.pairs;
        
        console.log('게임 설정:', settings);
        
        this.resetGameState();
        this.setupGameBoard();
        this.startTimer();
        this.updateUI();
        
        // 게임 모드 클래스 설정
        document.body.classList.add('single-player-mode');
        document.body.classList.remove('multi-player-mode');
        
        // UI 업데이트
        document.getElementById('currentPlayer').textContent = `플레이어: ${this.playerName}`;
        document.getElementById('roomCode').textContent = `난이도: ${this.getDifficultyText(difficulty)}`;
        document.getElementById('scoreLabel').textContent = '점수:';
        document.getElementById('currentTurnStatus').style.display = 'none';
        
        console.log('싱글플레이어 게임 초기화 완료');
        console.log('카드 개수:', this.cards.length);
    }

    getDifficultyText(difficulty) {
        const texts = {
            easy: '쉬움',
            medium: '보통',
            hard: '어려움',
            expert: '전문가'
        };
        return texts[difficulty];
    }

    resetGameState() {
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.moveCount = 0;
        this.gameTimer = 0;
        this.isPaused = false;
        this.gameStartTime = new Date();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    setupGameBoard() {
        const settings = this.difficultySettings[this.difficulty];
        const cardPairs = [];
        
        // 필요한 만큼의 캐릭터로 카드 쌍 생성
        for (let i = 0; i < settings.pairs; i++) {
            const characterId = settings.characters[i];
            const character = this.characters[characterId];
            cardPairs.push({ 
                characterId, 
                character, 
                isFlipped: false, 
                isMatched: false, 
                id: i * 2 
            });
            cardPairs.push({ 
                characterId, 
                character, 
                isFlipped: false, 
                isMatched: false, 
                id: i * 2 + 1 
            });
        }

        // 카드 섞기
        this.cards = this.shuffleArray(cardPairs);
        
        // 게임 보드 렌더링
        this.renderGameBoard();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderGameBoard() {
        const memoryCards = document.getElementById('memoryCards');
        const settings = this.difficultySettings[this.difficulty];
        
        // 그리드 설정
        memoryCards.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
        memoryCards.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            
            if (card.isFlipped || card.isMatched) {
                // 이미지가 있으면 이미지 사용, 없으면 이모지 사용
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
                cardElement.classList.add('flipped');
            }
            
            if (card.isMatched) {
                cardElement.classList.add('matched');
            }
            
            if (this.isPaused) {
                cardElement.classList.add('disabled');
            }
            
            cardElement.addEventListener('click', () => this.handleCardClick(index));
            memoryCards.appendChild(cardElement);
        });
    }

    handleCardClick(cardIndex) {
        if (this.isPaused) {
            return;
        }

        const card = this.cards[cardIndex];
        
        // 이미 뒤집혔거나 매치된 카드는 클릭 불가
        if (card.isFlipped || card.isMatched) {
            return;
        }

        // 이미 2장이 선택된 상태면 클릭 불가
        if (this.selectedCards.length >= 2) {
            return;
        }

        // 카드 뒤집기
        card.isFlipped = true;
        this.selectedCards.push(cardIndex);
        
        // 카드 요소 업데이트
        const cardElement = document.querySelector(`[data-index="${cardIndex}"]`);
        
        // 이미지 생성
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
        cardElement.classList.add('flipped', 'flip-animation');
        
        setTimeout(() => {
            cardElement.classList.remove('flip-animation');
        }, 600);

        // 2장이 선택되었으면 매칭 체크
        if (this.selectedCards.length === 2) {
            this.moveCount++;
            this.updateUI();
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        if (this.selectedCards.length !== 2) return;

        const [card1Index, card2Index] = this.selectedCards;
        const card1 = this.cards[card1Index];
        const card2 = this.cards[card2Index];

        if (card1.characterId === card2.characterId) {
            // 매치 성공
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            const card1Element = document.querySelector(`[data-index="${card1Index}"]`);
            const card2Element = document.querySelector(`[data-index="${card2Index}"]`);
            
            card1Element.classList.add('matched', 'match-animation');
            card2Element.classList.add('matched', 'match-animation');
            
            setTimeout(() => {
                card1Element.classList.remove('match-animation');
                card2Element.classList.remove('match-animation');
            }, 500);

            // 게임 완료 체크
            if (this.matchedPairs === this.totalPairs) {
                this.endGame();
            }
        } else {
            // 매치 실패
            card1.isFlipped = false;
            card2.isFlipped = false;
            
            const card1Element = document.querySelector(`[data-index="${card1Index}"]`);
            const card2Element = document.querySelector(`[data-index="${card2Index}"]`);
            
            setTimeout(() => {
                card1Element.innerHTML = '';
                card1Element.classList.remove('flipped');
                card2Element.innerHTML = '';
                card2Element.classList.remove('flipped');
            }, 500);
        }

        this.selectedCards = [];
        this.updateUI();
    }

    endGame() {
        this.stopTimer();
        
        // 점수 계산 (시간과 이동 횟수 기반)
        const timeBonus = Math.max(0, 300 - this.gameTimer); // 5분 기준 시간 보너스
        const moveBonus = Math.max(0, this.totalPairs * 3 - this.moveCount); // 최소 이동 횟수 기준
        const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2, expert: 3 }[this.difficulty];
        
        const finalScore = Math.round((timeBonus + moveBonus * 5) * difficultyMultiplier);
        
        // 베스트 타임 업데이트
        this.updateBestTime();
        
        // 결과 표시
        this.showGameResult(finalScore);
    }

    updateBestTime() {
        const key = this.difficulty;
        if (!this.bestTimes[key] || this.gameTimer < this.bestTimes[key].time) {
            this.bestTimes[key] = {
                time: this.gameTimer,
                moves: this.moveCount,
                playerName: this.playerName,
                date: new Date().toISOString()
            };
            this.saveBestTimes();
        }
    }

    showGameResult(finalScore) {
        const gameResult = document.getElementById('gameResult');
        const bestTime = this.bestTimes[this.difficulty];
        const isNewRecord = bestTime && bestTime.time === this.gameTimer;
        
        let resultHTML = '<div class="single-player-result">';
        resultHTML += `<h3>게임 완료! 🎉</h3>`;
        resultHTML += `<div class="result-stats">`;
        resultHTML += `<div class="stat-item">`;
        resultHTML += `<span class="stat-label">완료 시간:</span>`;
        resultHTML += `<span class="stat-value">${this.formatTime(this.gameTimer)} ${isNewRecord ? '🏆 신기록!' : ''}</span>`;
        resultHTML += `</div>`;
        resultHTML += `<div class="stat-item">`;
        resultHTML += `<span class="stat-label">이동 횟수:</span>`;
        resultHTML += `<span class="stat-value">${this.moveCount}회</span>`;
        resultHTML += `</div>`;
        resultHTML += `<div class="stat-item">`;
        resultHTML += `<span class="stat-label">최종 점수:</span>`;
        resultHTML += `<span class="stat-value">${finalScore}점</span>`;
        resultHTML += `</div>`;
        
        if (bestTime) {
            resultHTML += `<div class="stat-item best-record">`;
            resultHTML += `<span class="stat-label">개인 기록:</span>`;
            resultHTML += `<span class="stat-value">${this.formatTime(bestTime.time)} (${bestTime.moves}회)</span>`;
            resultHTML += `</div>`;
        }
        
        resultHTML += `</div></div>`;
        
        gameResult.innerHTML = resultHTML;
        document.getElementById('gameResultModal').classList.remove('hidden');
        
        document.getElementById('myScore').textContent = finalScore;
    }

    pauseGame() {
        if (this.isPaused) {
            // 게임 재개
            this.isPaused = false;
            this.startTimer();
            document.getElementById('pauseBtn').textContent = '일시정지';
            
            // 카드들 활성화
            document.querySelectorAll('.memory-card').forEach(card => {
                if (!card.classList.contains('matched')) {
                    card.classList.remove('disabled');
                }
            });
        } else {
            // 게임 일시정지
            this.isPaused = true;
            this.stopTimer();
            document.getElementById('pauseBtn').textContent = '게임 재개';
            
            // 모든 카드 비활성화
            document.querySelectorAll('.memory-card').forEach(card => {
                card.classList.add('disabled');
            });
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.gameTimer++;
                this.updateTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const timerElement = document.getElementById('gameTimer');
        timerElement.textContent = this.formatTime(this.gameTimer);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateUI() {
        document.getElementById('myScore').textContent = this.matchedPairs * 10;
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('matchCount').textContent = `${this.matchedPairs} / ${this.totalPairs}`;
        this.updateTimer();
    }

    newGame() {
        this.resetGameState();
        this.setupGameBoard();
        this.startTimer();
        this.updateUI();
        
        document.getElementById('pauseBtn').textContent = '일시정지';
    }

    loadBestTimes() {
        try {
            const saved = localStorage.getItem('memoryGame_bestTimes');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    saveBestTimes() {
        try {
            localStorage.setItem('memoryGame_bestTimes', JSON.stringify(this.bestTimes));
        } catch (e) {
            console.warn('베스트 타임 저장 실패:', e);
        }
    }

    getBestTimes() {
        return this.bestTimes;
    }

    getLeaderboardData(period = 'all') {
        // 싱글플레이어는 개인 기록만 반환
        const results = [];
        Object.entries(this.bestTimes).forEach(([difficulty, record]) => {
            results.push({
                playerId: record.playerName,
                difficulty: this.getDifficultyText(difficulty),
                time: record.time,
                moves: record.moves,
                score: this.calculateScore(record.time, record.moves, difficulty),
                date: new Date(record.date)
            });
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    calculateScore(time, moves, difficulty) {
        const settings = this.difficultySettings[difficulty];
        const timeBonus = Math.max(0, 300 - time);
        const moveBonus = Math.max(0, settings.pairs * 3 - moves);
        const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2, expert: 3 }[difficulty];
        
        return Math.round((timeBonus + moveBonus * 5) * difficultyMultiplier);
    }
}