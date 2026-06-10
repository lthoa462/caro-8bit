const checkWin = (board, row, col, symbol) => {
  const directions = [
    [0, 1],  // Ngang
    [1, 0],  // Dọc
    [1, 1],  // Chéo xuôi
    [1, -1]  // Chéo ngược
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    let winningLine = [[row, col]];

    // Kiểm tra theo hướng dr, dc
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) {
      count++;
      winningLine.push([r, c]);
      r += dr;
      c += dc;
    }

    // Kiểm tra theo hướng ngược lại -dr, -dc
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === symbol) {
      count++;
      winningLine.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (count >= 5) return winningLine;
  }
  return null;
};

const updateElo = (db, winnerId, loserId) => {
  const winner = db.prepare('SELECT elo_rating, total_wins FROM users WHERE id = ?').get(winnerId);
  const loser = db.prepare('SELECT elo_rating FROM users WHERE id = ?').get(loserId);

  if (!winner || !loser) return;

  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo_rating - winner.elo_rating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo_rating - loser.elo_rating) / 400));

  const newWinnerElo = Math.round(winner.elo_rating + K * (1 - expectedWinner));
  const newLoserElo = Math.round(loser.elo_rating + K * (0 - expectedLoser));

  db.prepare('UPDATE users SET elo_rating = ?, total_wins = ? WHERE id = ?').run(newWinnerElo, winner.total_wins + 1, winnerId);
  db.prepare('UPDATE users SET elo_rating = ? WHERE id = ?').run(newLoserElo, loserId);

  return { newWinnerElo, newLoserElo };
};

const saveMatch = (db, room) => {
  try {
    const player1 = room.players.find(p => p.symbol === 'X');
    const player2 = room.players.find(p => p.symbol === 'O');
    
    if (!player1 || !player2) return;

    const stmt = db.prepare(`
      INSERT INTO matches (player1_id, player2_id, winner_id, board_state, moves_history)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      player1.id, 
      player2.id, 
      room.winner, 
      JSON.stringify(room.board), 
      JSON.stringify(room.moves)
    );
  } catch (error) {
    console.error('Error saving match:', error);
  }
};

const startTimer = (io, room, db) => {
  if (room.timerInterval) clearInterval(room.timerInterval);
  
  room.timer = parseInt(process.env.TURN_TIMEOUT) || 30; // Reset timer
  room.turnStartTime = Date.now();
  
  const interval = setInterval(() => {
    room.timer--;
    
    if (room.timer <= 0) {
      clearInterval(room.timerInterval);
      handleTimeout(io, room, db);
    } else {
      io.to(room.id).emit('timer_update', { roomId: room.id, timer: room.timer });
    }
  }, 1000);

  Object.defineProperty(room, 'timerInterval', {
    value: interval,
    writable: true,
    enumerable: false,
    configurable: true
  });
};

const handleTimeout = (io, room, db) => {
  room.status = 'finished';
  const loser = room.players.find(p => p.symbol === room.currentTurn);
  const winner = room.players.find(p => p.symbol !== room.currentTurn);
  
  if (winner && loser) {
    room.winner = winner.id;
    const eloUpdates = updateElo(db, winner.id, loser.id);
    saveMatch(db, room);
    io.to(room.id).emit('game_over', { 
      room, 
      winner: winner.username, 
      reason: 'timeout',
      eloUpdates 
    });
  }
};

// --- Bot AI Logic ---

const BOT_MESSAGES = {
  welcome: ["Hello! Let's see if you can beat me.", "Good luck, human!", "Prepare for a challenge!"],
  blocked: ["Nice try!", "Not so fast!", "I saw that coming.", "Hehe, blocked!"],
  impressed: ["Wow, good move!", "Impressive!", "You're better than I thought."],
  win: ["I win! Better luck next time.", "As expected from a machine.", "GG! Want a rematch?"],
  lose: ["You win this time...", "I must've had a glitch.", "Well played, human.", "Impossible! How did I lose?"]
};

const sendBotInteraction = (io, room, type) => {
  const msgs = BOT_MESSAGES[type];
  if (!msgs) return;
  
  const bot = room.players.find(p => p.socketId === 'BOT_SOCKET');
  if (!bot) return;

  const isEmote = Math.random() > 0.6;
  if (isEmote) {
    const emotes = ['😊', '😂', '😎', '😱', 'GG', 'WP'];
    const emote = emotes[Math.floor(Math.random() * emotes.length)];
    io.to(room.id).emit('new_emote', { userId: bot.id, emoteId: emote });
  } else {
    const message = msgs[Math.floor(Math.random() * msgs.length)];
    const chatMsg = { username: bot.username, message, time: new Date() };
    room.chat.push(chatMsg);
    io.to(room.id).emit('new_chat', chatMsg);
  }
};

const evaluateLine = (line, symbol) => {
  const opponent = symbol === 'X' ? 'O' : 'X';
  let score = 0;

  const lineStr = line.join('');
  const patterns = [
    { p: symbol.repeat(5), score: 100000 }, // 5 in a row
    { p: '.' + symbol.repeat(4) + '.', score: 10000 }, // Open 4
    { p: symbol.repeat(4) + '.', score: 1000 },
    { p: '.' + symbol.repeat(4), score: 1000 },
    { p: '.' + symbol.repeat(3) + '.', score: 1000 }, // Open 3
    { p: symbol.repeat(3) + '..', score: 100 },
    { p: '..' + symbol.repeat(3), score: 100 },
    { p: '.' + symbol.repeat(2) + '.', score: 100 }, // Open 2
  ];

  patterns.forEach(pat => {
    if (lineStr.includes(pat.p)) score += pat.score;
  });

  return score;
};

const getBoardLines = (board, row, col, symbol) => {
  const lines = [];
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    let line = [];
    for (let i = -4; i <= 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15) {
        line.push(board[r][c] || '.');
      } else {
        line.push('|'); // Boundary
      }
    }
    lines.push(line);
  }
  return lines;
};

const getBotMove = (room) => {
  const bot = room.players.find(p => p.socketId === 'BOT_SOCKET');
  const player = room.players.find(p => p.socketId !== 'BOT_SOCKET');
  const difficulty = room.botDifficulty || 'medium';

  let bestMoves = [];
  let maxScore = -1;

  // Cân bằng Tấn công/Phòng thủ dựa trên độ khó
  let wAttack = 1.0;
  let wDefense = 1.0;

  if (difficulty === 'easy') { wAttack = 1.2; wDefense = 0.5; }
  if (difficulty === 'hard') { wAttack = 1.0; wDefense = 1.5; }

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (room.board[r][c] === null) {
        const lines = getBoardLines(room.board, r, c, bot.symbol);
        let attackScore = 0;
        let defenseScore = 0;

        lines.forEach(line => {
          // Giả lập đặt quân cờ vào ô đó
          const midIdx = 4;
          line[midIdx] = bot.symbol;
          attackScore += evaluateLine(line, bot.symbol);
          
          line[midIdx] = player.symbol;
          defenseScore += evaluateLine(line, player.symbol);
        });

        const totalScore = (attackScore * wAttack) + (defenseScore * wDefense);
        
        if (totalScore > maxScore) {
          maxScore = totalScore;
          bestMoves = [{ r, c }];
        } else if (totalScore === maxScore) {
          bestMoves.push({ r, c });
        }
      }
    }
  }

  // Nếu là nước đi đầu tiên của X và bàn cờ trống
  if (room.moves.length === 0 && bot.symbol === 'X') {
    return { r: 7, c: 7 };
  }

  // Random trong top các nước đi tốt nhất tùy độ khó
  if (difficulty === 'easy') {
    // Sắp xếp và lấy top 3
    // (Đơn giản hóa: lấy đại một cái nếu có nhiều cái bằng điểm)
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

const triggerBotMove = (io, room, db) => {
  if (room.status !== 'playing') return;
  
  const bot = room.players.find(p => p.socketId === 'BOT_SOCKET');
  if (room.currentTurn !== bot.symbol) return;

  // Giả lập thời gian suy nghĩ
  const thinkTime = 500 + Math.random() * 1000;
  
  setTimeout(() => {
    const move = getBotMove(room);
    if (!move) return;

    const { r, c } = move;
    room.board[r][c] = bot.symbol;
    room.moves.push({ player: bot.username, symbol: bot.symbol, row: r, col: c, time: new Date() });

    const winningLine = checkWin(room.board, r, c, bot.symbol);

    if (winningLine) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.status = 'finished';
      room.winner = bot.id;
      room.winningLine = winningLine;

      const loser = room.players.find(p => p.id !== bot.id);
      updateElo(db, bot.id, loser.id);
      saveMatch(db, room);

      io.to(room.id).emit('game_over', { 
        room, 
        winner: bot.username,
        eloUpdates: null // Không cập nhật elo local cho bot
      });
      sendBotInteraction(io, room, 'win');
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      io.to(room.id).emit('room_updated', room);
      startTimer(io, room, db);
      
      // Random tương tác
      if (Math.random() > 0.8) sendBotInteraction(io, room, 'blocked');
    }
  }, thinkTime);
};

const gameHandler = (io, socket, rooms, db) => {
  socket.on('make_move', ({ roomId, row, col }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.symbol !== room.currentTurn) return;

    if (room.board[row][col] !== null) return;

    room.board[row][col] = player.symbol;
    room.moves.push({ player: player.username, symbol: player.symbol, row, col, time: new Date() });
    
    const winningLine = checkWin(room.board, row, col, player.symbol);
    
    if (winningLine) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.status = 'finished';
      room.winner = player.id;
      room.winningLine = winningLine;

      const loser = room.players.find(p => p.id !== player.id);
      const eloUpdates = updateElo(db, player.id, loser.id);

      saveMatch(db, room);

      io.to(roomId).emit('game_over', { 
        room, 
        winner: player.username,
        eloUpdates
      });
      
      if (room.isBotRoom) sendBotInteraction(io, room, 'lose');
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      io.to(roomId).emit('room_updated', room);
      
      if (room.isBotRoom) {
        // Nếu là phòng Bot, kích hoạt lượt của Bot
        triggerBotMove(io, room, db);
      } else {
        startTimer(io, room, db);
      }
    }
  });

  socket.on('restart_game', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    room.board = Array(15).fill(null).map(() => Array(15).fill(null));
    room.moves = [];
    room.currentTurn = 'X';
    room.status = 'playing';
    room.winner = null;
    room.winningLine = null;
    io.to(roomId).emit('room_updated', room);

    if (room.isBotRoom) {
      const bot = room.players.find(p => p.socketId === 'BOT_SOCKET');
      if (bot.symbol === 'X') {
        triggerBotMove(io, room, db);
      }
    } else {
      startTimer(io, room, db);
    }
  });
};

gameHandler.startTimer = startTimer;
gameHandler.triggerBotMove = triggerBotMove;

module.exports = gameHandler;
