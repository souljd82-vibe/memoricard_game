const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 게임 데이터 저장소
class GameManager {
    constructor() {
        this.games = new Map(); // roomId -> GameRoom
        this.players = new Map(); // socketId -> Player
        this.leaderboard = new Map(); // playerId -> PlayerStats
        // K-Pop Demon Hunters (Huntrix) 캐릭터들 - 로컬 이미지 사용
        this.characters = {
            rumi: { name: 'Rumi', image: 'images/Rumi.jpg', emoji: '💜', color: '#8B4D9A' },
            mira: { name: 'Mira', image: 'images/Mira.jpg', emoji: '🔥', color: '#DC143C' },
            zoey: { name: 'Zoey', image: 'images/Zoey.jpg', emoji: '🌱', color: '#32CD32' },
            jinsu: { name: 'Jinsu', image: 'images/Jinsu.jpg', emoji: '💙', color: '#4169E1' },
            abby_saja: { name: 'Abby Saja', image: 'images/Abby Saja.jpg', emoji: '🌿', color: '#228B22' },
            mystery_saja: { name: 'Mystery Saja', image: 'images/Mystery saja.jpg', emoji: '🤍', color: '#B0C4DE' },
            baby_saja: { name: 'Baby Saja', image: 'images/Baby saja.jpg', emoji: '💚', color: '#00CED1' },
            romance_saja: { name: 'Romance Saja', image: 'images/Romance saja.jpg', emoji: '💖', color: '#FFB6C1' }
        };
        this.characterIds = ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja', 'baby_saja', 'romance_saja']; // 8개 캐릭터 (16장 카드)
    }

    createGame(hostPlayerId, hostSocketId) {
        const roomId = this.generateRoomId();
        const game = new GameRoom(roomId, hostPlayerId, hostSocketId);
        this.games.set(roomId, game);
        return game;
    }

    joinGame(playerId, socketId) {
        // 기존 게임 찾기 또는 새 게임 생성
        let availableGame = null;
        
        for (const game of this.games.values()) {
            if (game.players.length < 4 && game.state === 'waiting') {
                availableGame = game;
                break;
            }
        }

        if (!availableGame) {
            availableGame = this.createGame(playerId, socketId);
        }

        availableGame.addPlayer(playerId, socketId);
        this.players.set(socketId, {
            id: playerId,
            roomId: availableGame.roomId,
            socketId: socketId
        });

        return availableGame;
    }

    leaveGame(socketId) {
        const player = this.players.get(socketId);
        if (!player) return null;

        const game = this.games.get(player.roomId);
        if (game) {
            game.removePlayer(socketId);
            if (game.players.length === 0) {
                this.games.delete(game.roomId);
            }
        }

        this.players.delete(socketId);
        return game;
    }

    getPlayerGame(socketId) {
        const player = this.players.get(socketId);
        return player ? this.games.get(player.roomId) : null;
    }

    updateLeaderboard(playerId, won, totalScore) {
        if (!this.leaderboard.has(playerId)) {
            this.leaderboard.set(playerId, {
                playerId: playerId,
                wins: 0,
                totalGames: 0,
                totalScore: 0,
                lastPlayed: new Date()
            });
        }

        const stats = this.leaderboard.get(playerId);
        stats.totalGames++;
        stats.totalScore += totalScore;
        stats.lastPlayed = new Date();
        
        if (won) {
            stats.wins++;
        }
    }

    getLeaderboard(period = 'all') {
        const now = new Date();
        let cutoffDate;

        switch (period) {
            case 'today':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0); // 모든 기록
        }

        return Array.from(this.leaderboard.values())
            .filter(stats => stats.lastPlayed >= cutoffDate)
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.totalScore - a.totalScore;
            })
            .slice(0, 50); // 상위 50명
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

// 게임룸 클래스
class GameRoom {
    constructor(roomId, hostPlayerId, hostSocketId) {
        this.roomId = roomId;
        this.players = [];
        this.cards = [];
        this.state = 'waiting'; // waiting, playing, finished
        this.currentPlayerIndex = 0;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.gameStartTime = null;
        
        this.addPlayer(hostPlayerId, hostSocketId);
    }

    addPlayer(playerId, socketId) {
        if (this.players.length >= 4) {
            throw new Error('게임이 가득 참');
        }

        // 중복 플레이어 체크
        if (this.players.some(p => p.id === playerId)) {
            throw new Error('이미 사용 중인 닉네임입니다');
        }

        this.players.push({
            id: playerId,
            socketId: socketId,
            score: 0,
            isHost: this.players.length === 0
        });

        // 2명 이상이면 게임 자동 시작
        if (this.players.length >= 2 && this.state === 'waiting') {
            setTimeout(() => this.startGame(), 3000); // 3초 후 자동 시작
        }
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.socketId === socketId);
        if (playerIndex !== -1) {
            this.players.splice(playerIndex, 1);
            
            // 현재 플레이어가 나간 경우 턴 조정
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
        }
    }

    startGame() {
        if (this.state !== 'waiting' || this.players.length < 2) {
            return;
        }

        this.state = 'playing';
        this.gameStartTime = new Date();
        this.currentPlayerIndex = 0;
        this.matchedPairs = 0;
        
        // 카드 초기화
        this.initializeCards();
        
        // 모든 플레이어 점수 초기화
        this.players.forEach(player => {
            player.score = 0;
        });
    }

    initializeCards() {
        const characterIds = ['rumi', 'mira', 'zoey', 'jinsu', 'abby_saja', 'mystery_saja', 'baby_saja', 'romance_saja'];
        const characters = {
            rumi: { name: 'Rumi', image: 'images/Rumi.jpg', emoji: '💜', color: '#8B4D9A' },
            mira: { name: 'Mira', image: 'images/Mira.jpg', emoji: '🔥', color: '#DC143C' },
            zoey: { name: 'Zoey', image: 'images/Zoey.jpg', emoji: '🌱', color: '#32CD32' },
            jinsu: { name: 'Jinsu', image: 'images/Jinsu.jpg', emoji: '💙', color: '#4169E1' },
            abby_saja: { name: 'Abby Saja', image: 'images/Abby Saja.jpg', emoji: '🌿', color: '#228B22' },
            mystery_saja: { name: 'Mystery Saja', image: 'images/Mystery saja.jpg', emoji: '🤍', color: '#B0C4DE' },
            baby_saja: { name: 'Baby Saja', image: 'images/Baby saja.jpg', emoji: '💚', color: '#00CED1' },
            romance_saja: { name: 'Romance Saja', image: 'images/Romance saja.jpg', emoji: '💖', color: '#FFB6C1' }
        };
        
        const cardPairs = [];
        
        // 각 캐릭터를 2장씩 추가
        characterIds.forEach(characterId => {
            const character = characters[characterId];
            cardPairs.push({ characterId, character, isFlipped: false, isMatched: false });
            cardPairs.push({ characterId, character, isFlipped: false, isMatched: false });
        });

        // 카드 섞기
        this.cards = this.shuffleArray(cardPairs);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    handleCardClick(socketId, cardIndex) {
        if (this.state !== 'playing') {
            return { error: '게임이 진행 중이 아닙니다' };
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.socketId !== socketId) {
            return { error: '당신의 턴이 아닙니다' };
        }

        if (cardIndex < 0 || cardIndex >= this.cards.length) {
            return { error: '잘못된 카드 인덱스입니다' };
        }

        const card = this.cards[cardIndex];
        if (card.isFlipped || card.isMatched) {
            return { error: '이미 뒤집힌 카드입니다' };
        }

        if (this.flippedCards.length >= 2) {
            return { error: '이미 2장의 카드가 뒤집혀있습니다' };
        }

        // 카드 뒤집기
        card.isFlipped = true;
        this.flippedCards.push(cardIndex);

        const result = {
            success: true,
            cardIndex: cardIndex,
            characterId: card.characterId,
            character: card.character,
            flippedCards: this.flippedCards
        };

        // 2장이 뒤집혔을 때 매칭 체크
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 1500);
        }

        return result;
    }

    checkMatch() {
        if (this.flippedCards.length !== 2) return;

        const [card1Index, card2Index] = this.flippedCards;
        const card1 = this.cards[card1Index];
        const card2 = this.cards[card2Index];

        if (card1.characterId === card2.characterId) {
            // 매치 성공
            card1.isMatched = true;
            card2.isMatched = true;
            
            // 현재 플레이어 점수 증가
            this.players[this.currentPlayerIndex].score += 10;
            this.matchedPairs++;

            const result = {
                matched: true,
                matchedCards: [card1Index, card2Index],
                currentPlayer: this.players[this.currentPlayerIndex],
                matchedPairs: this.matchedPairs
            };

            // 게임 종료 체크
            if (this.matchedPairs === 8) { // 8쌍 모두 매칭
                this.endGame();
                return result;
            }

            // 매치 성공 시 턴 유지
            this.flippedCards = [];
            return result;
        } else {
            // 매치 실패
            card1.isFlipped = false;
            card2.isFlipped = false;
            
            // 다음 플레이어로 턴 변경
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.flippedCards = [];

            return {
                matched: false,
                flippedCards: [card1Index, card2Index],
                currentPlayer: this.players[this.currentPlayerIndex]
            };
        }
    }

    endGame() {
        this.state = 'finished';
        
        // 점수별로 정렬
        const finalScores = [...this.players].sort((a, b) => b.score - a.score);
        const winner = finalScores[0];

        // 리더보드 업데이트는 GameManager에서 처리
        return {
            finished: true,
            winner: winner.id,
            finalScores: finalScores.map(p => ({ id: p.id, score: p.score }))
        };
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getGameState() {
        return {
            roomId: this.roomId,
            state: this.state,
            players: this.players.map(p => ({ id: p.id, score: p.score })),
            cards: this.cards,
            currentPlayer: this.getCurrentPlayer()?.id,
            matchedPairs: this.matchedPairs
        };
    }
}

// 게임 매니저 인스턴스
const gameManager = new GameManager();

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log(`플레이어 연결됨: ${socket.id}`);

    // 게임 참여
    socket.on('joinGame', (data) => {
        try {
            const { playerId } = data;
            
            if (!playerId || playerId.trim().length === 0) {
                socket.emit('error', { message: '닉네임을 입력해주세요' });
                return;
            }

            if (playerId.length > 20) {
                socket.emit('error', { message: '닉네임은 20자 이하로 입력해주세요' });
                return;
            }

            const game = gameManager.joinGame(playerId, socket.id);
            
            // 방에 입장
            socket.join(game.roomId);
            
            // 입장 확인
            socket.emit('gameJoined', {
                playerId: playerId,
                roomId: game.roomId,
                isHost: game.players.find(p => p.socketId === socket.id)?.isHost || false
            });

            // 모든 방 참가자에게 게임 상태 업데이트
            io.to(game.roomId).emit('gameStateUpdate', game.getGameState());
            io.to(game.roomId).emit('playersUpdate', game.players.map(p => ({ id: p.id, score: p.score })));

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // 새 게임 시작
    socket.on('startNewGame', () => {
        const game = gameManager.getPlayerGame(socket.id);
        if (!game) {
            socket.emit('error', { message: '게임을 찾을 수 없습니다' });
            return;
        }

        game.startGame();
        io.to(game.roomId).emit('gameStateUpdate', game.getGameState());
    });

    // 카드 클릭
    socket.on('cardClick', (data) => {
        const game = gameManager.getPlayerGame(socket.id);
        if (!game) {
            socket.emit('error', { message: '게임을 찾을 수 없습니다' });
            return;
        }

        const result = game.handleCardClick(socket.id, data.cardIndex);
        
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }

        // 카드 뒤집기 이벤트
        io.to(game.roomId).emit('cardFlipped', {
            cardIndex: data.cardIndex,
            characterId: result.characterId,
            character: result.character
        });

        // 게임 상태 업데이트
        io.to(game.roomId).emit('gameStateUpdate', game.getGameState());

        // 2장이 뒤집혔을 때 매칭 체크 결과 처리
        if (result.flippedCards.length === 2) {
            setTimeout(() => {
                const matchResult = game.checkMatch();
                
                if (matchResult.matched) {
                    // 매치 성공
                    io.to(game.roomId).emit('cardsMatched', {
                        matchedCards: matchResult.matchedCards
                    });
                    
                    if (matchResult.matched && game.state === 'finished') {
                        // 게임 종료
                        const endResult = game.endGame();
                        
                        // 리더보드 업데이트
                        game.players.forEach(player => {
                            const won = player.id === endResult.winner;
                            gameManager.updateLeaderboard(player.id, won, player.score);
                        });
                        
                        io.to(game.roomId).emit('gameEnded', endResult);
                    }
                } else {
                    // 매치 실패 - 턴 변경
                    io.to(game.roomId).emit('turnChanged', {
                        currentPlayer: matchResult.currentPlayer.id
                    });
                }
                
                // 게임 상태 업데이트
                io.to(game.roomId).emit('gameStateUpdate', game.getGameState());
            }, 1500);
        }
    });

    // 리더보드 요청
    socket.on('getLeaderboard', (data) => {
        const leaderboard = gameManager.getLeaderboard(data.period);
        socket.emit('leaderboardData', leaderboard);
    });

    // 게임 나가기
    socket.on('leaveGame', () => {
        const game = gameManager.leaveGame(socket.id);
        if (game) {
            socket.leave(game.roomId);
            io.to(game.roomId).emit('playersUpdate', game.players.map(p => ({ id: p.id, score: p.score })));
            io.to(game.roomId).emit('gameStateUpdate', game.getGameState());
        }
    });

    // 연결 해제
    socket.on('disconnect', () => {
        console.log(`플레이어 연결 해제됨: ${socket.id}`);
        const game = gameManager.leaveGame(socket.id);
        if (game) {
            io.to(game.roomId).emit('playersUpdate', game.players.map(p => ({ id: p.id, score: p.score })));
            io.to(game.roomId).emit('gameStateUpdate', game.getGameState());
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`브라우저에서 http://localhost:${PORT} 를 열어주세요`);
});