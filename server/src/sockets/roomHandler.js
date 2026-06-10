const db = require('../models/db');
const gameHandler = require('./gameHandler');

const rooms = new Map();

const getPlayerStats = (userId) => {
  return db.prepare('SELECT elo_rating, total_wins, avatar_id, theme_id FROM users WHERE id = ?').get(userId);
};

const roomHandler = (io, socket) => {
  socket.on('create_room', (user) => {
    const stats = getPlayerStats(user.id);
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomData = {
      id: roomId,
      players: [{ ...user, ...stats, socketId: socket.id, symbol: 'X' }],
      status: 'waiting',
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      moves: [],
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      chat: [],
      timer: parseInt(process.env.TURN_TIMEOUT) || 30, // Thời gian mặc định
      turnStartTime: Date.now()
    };
    Object.defineProperty(roomData, 'timerInterval', {
      value: null,
      writable: true,
      enumerable: false,
      configurable: true
    });
    rooms.set(roomId, roomData);
    socket.join(roomId);
    socket.emit('room_created', roomData);
    console.log(`Room created: ${roomId} by ${user.username}`);
  });

  socket.on('create_bot_room', ({ user, difficulty, symbol }) => {
    const stats = getPlayerStats(user.id);
    const roomId = 'BOT_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Tìm thông tin Bot từ DB
    const botUsername = `BOT_PIXEL_${difficulty.toUpperCase()}`;
    const botUser = db.prepare('SELECT id, username, elo_rating, avatar_id, theme_id FROM users WHERE username = ?').get(botUsername);
    
    if (!botUser) {
      return socket.emit('error_msg', 'Bot not found');
    }

    let userSymbol = symbol;
    if (symbol === 'Random') {
      userSymbol = Math.random() > 0.5 ? 'X' : 'O';
    }
    const botSymbol = userSymbol === 'X' ? 'O' : 'X';

    const players = [
      { ...user, ...stats, socketId: socket.id, symbol: userSymbol },
      { ...botUser, socketId: 'BOT_SOCKET', symbol: botSymbol }
    ];

    const roomData = {
      id: roomId,
      players: players,
      status: 'playing',
      isBotRoom: true,
      botDifficulty: difficulty,
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      moves: [],
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      chat: [],
      timer: parseInt(process.env.TURN_TIMEOUT) || 30,
      turnStartTime: Date.now()
    };

    Object.defineProperty(roomData, 'timerInterval', {
      value: null,
      writable: true,
      enumerable: false,
      configurable: true
    });

    rooms.set(roomId, roomData);
    socket.join(roomId);
    socket.emit('room_created', roomData);
    
    console.log(`Bot Room created: ${roomId} with ${difficulty} bot`);

    // Nếu Bot là X, thực hiện nước đi đầu tiên
    if (botSymbol === 'X') {
      gameHandler.triggerBotMove(io, roomData, db);
    } else {
      gameHandler.startTimer(io, roomData, db);
    }
  });

  socket.on('join_room', ({ roomId, user }) => {
    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit('error_msg', 'Room not found');
    }
    if (room.players.length >= 2) {
      return socket.emit('error_msg', 'Room is full');
    }

    const stats = getPlayerStats(user.id);
    room.players.push({ ...user, ...stats, socketId: socket.id, symbol: 'O' });
    room.status = 'playing';
    room.turnStartTime = Date.now();
    socket.join(roomId);
    socket.emit('room_updated', room);
    socket.to(roomId).emit('room_updated', room);
    gameHandler.startTimer(io, room, db);
    console.log(`User ${user.username} joined room: ${roomId}`);
  });

  socket.on('join_random', (user) => {
    let availableRoom = null;
    for (const [id, room] of rooms.entries()) {
      if (room.status === 'waiting' && room.players.length < 2) {
        availableRoom = room;
        break;
      }
    }

    if (availableRoom) {
      const stats = getPlayerStats(user.id);
      availableRoom.players.push({ ...user, ...stats, socketId: socket.id, symbol: 'O' });
      availableRoom.status = 'playing';
      availableRoom.turnStartTime = Date.now();
      socket.join(availableRoom.id);
      socket.emit('room_updated', availableRoom);
      socket.to(availableRoom.id).emit('room_updated', availableRoom);
      gameHandler.startTimer(io, availableRoom, db);
    } else {
      socket.emit('error_msg', 'No available rooms found');
    }
  });

  socket.on('send_chat', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        const chatMsg = { username: player.username, message, time: new Date() };
        room.chat.push(chatMsg);
        io.to(roomId).emit('new_chat', chatMsg);
      }
    }
  });

  socket.on('send_emote', ({ roomId, emoteId }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        io.to(roomId).emit('new_emote', { userId: player.id, emoteId });
      }
    }
  });

  const clearRoomTimer = (room) => {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
  };

  socket.on('leave_room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      clearRoomTimer(room);
      room.players = room.players.filter(p => p.socketId !== socket.id);
      socket.leave(roomId);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        room.status = 'waiting';
        room.board = Array(15).fill(null).map(() => Array(15).fill(null));
        room.moves = [];
        room.currentTurn = 'X';
        room.winner = null;
        room.winningLine = null;
        io.to(roomId).emit('room_updated', room);
      }
    }
  });

  socket.on('disconnect', () => {
    for (const [id, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          clearRoomTimer(room);
          rooms.delete(id);
        } else {
          clearRoomTimer(room);
          room.status = 'waiting';
          room.board = Array(15).fill(null).map(() => Array(15).fill(null));
          room.moves = [];
          room.currentTurn = 'X';
          room.winner = null;
          room.winningLine = null;
          io.to(id).emit('room_updated', room);
        }
        break;
      }
    }
  });

  return rooms;
};

module.exports = roomHandler;
