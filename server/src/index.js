const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Import database
const db = require('./models/db');
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/auth');

app.get('/', (req, res) => {
  res.send('Caro Pixel Server is running...');
});

// Auth & Stats Routes
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.get('/api/leaderboard', authController.getLeaderboard);

// User & History Routes
const userController = require('./controllers/userController');
app.put('/api/user/profile', authMiddleware, userController.updateProfile);
app.get('/api/matches/history', authMiddleware, userController.getMatchHistory);
app.get('/api/matches/:id', authMiddleware, userController.getMatchDetail);

// Shop Routes
app.post('/api/user/purchase', authMiddleware, async (req, res) => {
  const { itemId, cost } = req.body;
  const user = db.prepare('SELECT pixel_coins, purchased_items FROM users WHERE id = ?').get(req.userId);
  
  if (user.pixel_coins < cost) {
    return res.status(400).json({ error: 'Not enough coins' });
  }

  const purchased = JSON.parse(user.purchased_items || '[]');
  if (purchased.includes(itemId)) {
    return res.status(400).json({ error: 'Item already owned' });
  }

  purchased.push(itemId);
  db.prepare('UPDATE users SET pixel_coins = pixel_coins - ?, purchased_items = ? WHERE id = ?')
    .run(cost, JSON.stringify(purchased), req.userId);

  res.json({ success: true, pixel_coins: user.pixel_coins - cost, purchased_items: purchased });
});

// Social Routes
app.get('/api/users/search', authMiddleware, (req, res) => {
  const { query } = req.query;
  const users = db.prepare('SELECT id, username, elo_rating, avatar_id FROM users WHERE username LIKE ? AND id != ? LIMIT 10')
    .all(`%${query}%`, req.userId);
  res.json(users);
});

app.post('/api/friends/add', authMiddleware, (req, res) => {
  const { friendId } = req.body;
  try {
    db.prepare('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)')
      .run(req.userId, friendId, 'pending');
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Already sent request or already friends' });
  }
});

app.get('/api/friends', authMiddleware, (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.username, u.elo_rating, u.avatar_id, f.status 
    FROM users u 
    JOIN friends f ON (f.friend_id = u.id OR f.user_id = u.id) 
    WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
  `).all(req.userId, req.userId, req.userId);
  res.json(friends);
});

// Protected Route Example
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, elo_rating, total_wins, avatar_id, theme_id FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

// Socket.io logic
const roomHandler = require('./sockets/roomHandler');
const gameHandler = require('./sockets/gameHandler');

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Register Handlers
  const rooms = roomHandler(io, socket);
  gameHandler(io, socket, rooms, db);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT}`);
});
