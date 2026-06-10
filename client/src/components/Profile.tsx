import React, { useEffect, useState } from 'react';
import './Profile.css';
import { API_BASE_URL } from '../config';
import { getRankTier } from '../utils/rankUtils';

interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  winner_id: number;
  created_at: string;
  player1_name: string;
  player2_name: string;
}

interface User {
  id: number;
  username: string;
  elo_rating: number;
  total_wins: number;
  avatar_id: number;
  theme_id: string;
}

interface ProfileProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  onViewReplay: (matchId: number) => void;
  onLogout: () => void;
}

export const AVATAR_MAP: Record<number, string> = {
  1: '👾',
  2: '🤖',
  3: '🦊',
  4: '🐱',
  5: '🐸',
  6: '🐼',
  7: '👻',
  8: '☠️'
};

const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8];
const THEMES = [
  { id: 'classic', name: 'CLASSIC' },
  { id: 'dark', name: 'DARK' },
  { id: 'gameboy', name: 'GAMEBOY' }
];

const Profile: React.FC<ProfileProps> = ({ user, onClose, onUpdate, onViewReplay, onLogout }) => {
  const [history, setHistory] = useState<Match[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_id);
  const [selectedTheme, setSelectedTheme] = useState(user.theme_id);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/matches/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching history:', err));
  }, []);

  const handleSave = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ avatar_id: selectedAvatar, theme_id: selectedTheme })
    })
      .then(res => res.json())
      .then(() => {
        const updatedUser = { ...user, avatar_id: selectedAvatar, theme_id: selectedTheme };
        onUpdate(updatedUser);
        alert('Profile updated!');
      })
      .catch(err => console.error('Error updating profile:', err));
  };

  return (
    <div className="profile-overlay">
      <div className="profile-modal pixel-border">
        <div className="profile-header">
          <h2>USER PROFILE</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        <div className="profile-content">
          <section className="stats-section">
            <div className="avatar-display pixel-border">
              <span className="pixel-avatar-large">{AVATAR_MAP[selectedAvatar] || '👤'}</span>
            </div>
            <div className="stats-info">
              <h3>{user.username}</h3>
              <div className="rank-display">
                <span className="rank-name" style={{ color: getRankTier(user.elo_rating).color }}>
                  {getRankTier(user.elo_rating).icon} {getRankTier(user.elo_rating).name}
                </span>
              </div>
              <p>ELO: <span className="elo">{user.elo_rating}</span></p>
              <p>WINS: {user.total_wins}</p>
            </div>
          </section>

          <section className="custom-section">
            <h4>CHOOSE AVATAR</h4>
            <div className="avatar-grid">
              {AVATARS.map(id => (
                <div 
                  key={id} 
                  className={`avatar-item pixel-border ${selectedAvatar === id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(id)}
                >
                  {AVATAR_MAP[id]}
                </div>
              ))}
            </div>

            <h4>THEME</h4>
            <div className="theme-options">
              {THEMES.map(theme => (
                <button 
                  key={theme.id} 
                  className={selectedTheme === theme.id ? 'selected' : ''}
                  onClick={() => setSelectedTheme(theme.id)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
            <button className="save-btn" onClick={handleSave}>SAVE CHANGES</button>
            <button className="profile-logout-btn" onClick={onLogout}>LOGOUT</button>
          </section>

          <section className="history-section">
            <h4>MATCH HISTORY</h4>
            <div className="history-list">
              {history.map(match => (
                <div key={match.id} className="history-item pixel-border">
                  <div className="match-info">
                    <span className={match.winner_id === user.id ? 'win' : 'lose'}>
                      {match.winner_id === user.id ? 'WIN' : 'LOSE'}
                    </span>
                    <span className="vs-text">VS {match.player1_id === user.id ? match.player2_name : match.player1_name}</span>
                  </div>
                  <button className="replay-btn" onClick={() => onViewReplay(match.id)}>REPLAY</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
