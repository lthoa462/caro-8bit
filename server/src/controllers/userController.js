const db = require('../models/db');

const updateProfile = (req, res) => {
  const { avatar_id, theme_id } = req.body;
  const userId = req.userId;

  try {
    const stmt = db.prepare('UPDATE users SET avatar_id = ?, theme_id = ? WHERE id = ?');
    stmt.run(avatar_id, theme_id, userId);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMatchHistory = (req, res) => {
  const userId = req.userId;

  try {
    const matches = db.prepare(`
      SELECT 
        m.id, 
        m.winner_id, 
        m.created_at,
        u1.username as player1_name,
        u2.username as player2_name,
        m.player1_id,
        m.player2_id
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.id
      JOIN users u2 ON m.player2_id = u2.id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.created_at DESC
      LIMIT 20
    `).all(userId, userId);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMatchDetail = (req, res) => {
  const { id } = req.params;

  try {
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateProfile, getMatchHistory, getMatchDetail };
