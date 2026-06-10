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
  pixel_coins: number;
  purchased_items: string;
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

const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8];
const PREMIUM_AVATARS = [
  { id: 9, icon: '👑', cost: 100 },
  { id: 10, icon: '🔥', cost: 150 },
  { id: 11, icon: '🌟', cost: 200 },
  { id: 12, icon: '💎', cost: 500 }
];

export const AVATAR_MAP: Record<number, string> = {
  1: '👾',
  2: '🤖',
  3: '🦊',
  4: '🐱',
  5: '🐸',
  6: '🐼',
  7: '👻',
  8: '☠️',
  9: '👑',
  10: '🔥',
  11: '🌟',
  12: '💎'
};

const THEMES = [
  { id: 'classic', name: 'CLASSIC' },
  { id: 'dark', name: 'DARK' },
  { id: 'gameboy', name: 'GAMEBOY' }
];

const Profile: React.FC<ProfileProps> = ({ user, onClose, onUpdate, onViewReplay, onLogout }) => {
  const [history, setHistory] = useState<Match[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_id);
  const [selectedTheme, setSelectedTheme] = useState(user.theme_id);
  const [activeTab, setActiveTab] = useState<'profile' | 'shop' | 'history'>('profile');

  const purchasedItems = JSON.parse(user.purchased_items || '[]');

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

  const handlePurchase = (itemId: number, cost: number) => {
    if (user.pixel_coins < cost) {
      alert('Not enough coins!');
      return;
    }

    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/user/purchase`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itemId, cost })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const updatedUser = { 
            ...user, 
            pixel_coins: data.pixel_coins, 
            purchased_items: JSON.stringify(data.purchased_items) 
          };
          onUpdate(updatedUser);
          alert('Item purchased!');
        } else {
          alert(data.error);
        }
      })
      .catch(err => console.error('Error purchasing item:', err));
  };

  return (
    <div className="profile-overlay">
      <div className="profile-modal pixel-border">
        <div className="profile-header">
          <div className="profile-tabs">
            <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>PROFILE</button>
            <button className={activeTab === 'shop' ? 'active' : ''} onClick={() => setActiveTab('shop')}>SHOP</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>HISTORY</button>
          </div>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <>
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
                  <p>COINS: <span className="coins">💰 {user.pixel_coins}</span></p>
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
                  {PREMIUM_AVATARS.filter(a => purchasedItems.includes(a.id)).map(a => (
                    <div 
                      key={a.id} 
                      className={`avatar-item pixel-border ${selectedAvatar === a.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAvatar(a.id)}
                    >
                      {a.icon}
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
            </>
          )}

          {activeTab === 'shop' && (
            <section className="shop-section">
              <h4>PREMIUM AVATARS</h4>
              <div className="shop-grid">
                {PREMIUM_AVATARS.map(item => (
                  <div key={item.id} className={`shop-item pixel-border ${purchasedItems.includes(item.id) ? 'owned' : ''}`}>
                    <span className="shop-item-icon">{item.icon}</span>
                    <span className="shop-item-cost">💰 {item.cost}</span>
                    <button 
                      disabled={purchasedItems.includes(item.id)}
                      onClick={() => handlePurchase(item.id, item.cost)}
                    >
                      {purchasedItems.includes(item.id) ? 'OWNED' : 'BUY'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'history' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
