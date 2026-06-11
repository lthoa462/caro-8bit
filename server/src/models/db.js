const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const db = new Database(dbPath);

// Khởi tạo bảng Users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    elo_rating INTEGER DEFAULT 1000,
    total_wins INTEGER DEFAULT 0,
    pixel_coins INTEGER DEFAULT 0,
    purchased_items TEXT DEFAULT '[]',
    avatar_id INTEGER DEFAULT 1,
    theme_id TEXT DEFAULT 'classic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Khởi tạo bảng Matches
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER,
    player2_id INTEGER,
    winner_id INTEGER,
    board_state TEXT,
    moves_history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users (id),
    FOREIGN KEY (player2_id) REFERENCES users (id),
    FOREIGN KEY (winner_id) REFERENCES users (id)
  )
`);

// Khởi tạo bảng Friends
db.exec(`
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    friend_id INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (friend_id) REFERENCES users (id),
    UNIQUE(user_id, friend_id)
  )
`);

// Khởi tạo bảng Achievements
db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirement_type TEXT NOT NULL, -- 'wins', 'elo', 'games'
    requirement_value INTEGER NOT NULL,
    reward_coins INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER,
    achievement_id INTEGER,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (achievement_id) REFERENCES achievements (id)
  )
`);

// Seed Achievements
const seedAchievements = () => {
  const achievements = [
    { title: 'FIRST WIN', description: 'Win your first match', type: 'wins', value: 1, reward: 50 },
    { title: 'WINNER', description: 'Win 10 matches', type: 'wins', value: 10, reward: 200 },
    { title: 'VETERAN', description: 'Win 50 matches', type: 'wins', value: 50, reward: 1000 },
    { title: 'MASTER', description: 'Reach 1500 ELO', type: 'elo', value: 1500, reward: 500 },
    { title: 'GODLIKE', description: 'Reach 2000 ELO', type: 'elo', value: 2000, reward: 2000 }
  ];

  const check = db.prepare('SELECT id FROM achievements WHERE title = ?');
  const insert = db.prepare('INSERT INTO achievements (title, description, requirement_type, requirement_value, reward_coins) VALUES (?, ?, ?, ?, ?)');

  achievements.forEach(a => {
    if (!check.get(a.title)) {
      insert.run(a.title, a.description, a.type, a.value, a.reward);
    }
  });
};

seedAchievements();

const bcrypt = require('bcryptjs');

// Seed Bot Users
const seedBots = () => {
  const bots = [
    { username: 'BOT_PIXEL_EASY', elo_rating: 800, avatar_id: 4 },
    { username: 'BOT_PIXEL_MEDIUM', elo_rating: 1200, avatar_id: 5 },
    { username: 'BOT_PIXEL_HARD', elo_rating: 1600, avatar_id: 6 }
  ];

  const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
  const insertUser = db.prepare('INSERT INTO users (username, password, elo_rating, avatar_id, theme_id) VALUES (?, ?, ?, ?, ?)');

  bots.forEach(bot => {
    const existing = checkUser.get(bot.username);
    if (!existing) {
      const hashedPassword = bcrypt.hashSync('bot_pixel_secure_password_random_12345', 10);
      insertUser.run(bot.username, hashedPassword, bot.elo_rating, bot.avatar_id, 'classic');
      console.log(`Seeded bot user: ${bot.username}`);
    }
  });
};

try {
  seedBots();
} catch (err) {
  console.error('Error seeding bot users:', err);
}

console.log('Database initialized with advanced features.');

module.exports = db;
