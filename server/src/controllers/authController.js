const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
require('dotenv').config();

const register = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        elo_rating: user.elo_rating,
        total_wins: user.total_wins
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getLeaderboard = (req, res) => {
  try {
    const topPlayers = db.prepare(`
      SELECT username, elo_rating, total_wins 
      FROM users 
      ORDER BY elo_rating DESC 
      LIMIT 10
    `).all();
    res.json(topPlayers);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login, getLeaderboard };
