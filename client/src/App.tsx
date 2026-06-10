import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import AuthForm from './components/AuthForm'
import GameRoom from './components/GameRoom'
import Leaderboard from './components/Leaderboard'
import Profile, { AVATAR_MAP } from './components/Profile'
import Replay from './components/Replay'
import { useSocket } from './hooks/useSocket'
import * as SoundManager from './audio/soundManager'
import * as Tone from 'tone'
import { getRankTier } from './utils/rankUtils'

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

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [room, setRoom] = useState<any>(null);
  const [joinId, setJoinId] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);
  const [botConfig, setBotConfig] = useState({ difficulty: 'medium', symbol: 'Random' });
  const [replayMatchId, setReplayMatchId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('isMuted') === 'true';
  });

  const audioInitializedRef = useRef(false);

  useEffect(() => {
    const initAudio = async () => {
      if (audioInitializedRef.current) return;
      try {
        await Tone.start();
        audioInitializedRef.current = true;
        SoundManager.setMuted(isMuted);
        
        // Phát nhạc dựa trên trạng thái hiện tại
        if (roomRef.current) {
          SoundManager.startBattleMusic();
        } else {
          SoundManager.startLobbyMusic();
        }
        
        window.removeEventListener('click', initAudio);
        window.removeEventListener('touchstart', initAudio);
      } catch {
        // ignore
      }
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio); // Thêm touchstart cho mobile
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, [isMuted]);

  // Global click sound
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.pixel-border')) {
        SoundManager.playClickSound();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // BGM Switching logic
  useEffect(() => {
    if (!audioInitializedRef.current) return;
    
    if (room) {
      SoundManager.startBattleMusic();
    } else {
      SoundManager.startLobbyMusic();
    }
  }, [!!room]);

  const userRef = useRef(user);
  const roomRef = useRef(room);

  useEffect(() => {
    userRef.current = user;
    roomRef.current = room;
  }, [user, room]);

  const socket = useSocket(token);

  useEffect(() => {
    if (socket) {
      socket.on('room_created', (roomData) => {
        setRoom(roomData);
        SoundManager.playMoveSound();
      });

      socket.on('room_updated', (roomData) => {
        const oldBoard = roomRef.current?.board;
        setRoom(roomData);
        
        if (oldBoard && JSON.stringify(oldBoard) !== JSON.stringify(roomData.board)) {
          SoundManager.playMoveSound();
        }
      });

      socket.on('new_chat', (chatMsg) => {
        setRoom((prev: any) => {
          if (!prev) return null;
          return { ...prev, chat: [...(prev.chat || []), chatMsg] };
        });
      });

      socket.on('game_over', ({ room: updatedRoom, reason, eloUpdates }) => {
        setRoom({ ...updatedRoom, reason });
        const currentUser = userRef.current;
        if (currentUser && updatedRoom.winner === currentUser.id) {
          SoundManager.playWinSound();
          if (eloUpdates) {
            const updatedUser = { 
              ...currentUser, 
              elo_rating: eloUpdates.newWinnerElo, 
              total_wins: currentUser.total_wins + 1,
              pixel_coins: currentUser.pixel_coins + 10 
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          SoundManager.playLoseSound();
          if (eloUpdates && currentUser) {
            const updatedUser = { ...currentUser, elo_rating: eloUpdates.newLoserElo };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      });

      socket.on('error_msg', (msg) => {
        alert(msg);
      });

      return () => {
        socket.off('room_created');
        socket.off('room_updated');
        socket.off('new_chat');
        socket.off('game_over');
        socket.off('error_msg');
      };
    }
  }, [socket]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('isMuted', String(nextMuted));
    SoundManager.setMuted(nextMuted);
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setRoom(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    SoundManager.stopAllMusic(); // Dừng tất cả nhạc
    audioInitializedRef.current = false;
    setShowProfile(false);
  };

  const createRoom = () => {
    if (socket && user) {
      socket.emit('create_room', user);
    }
  };

  const createBotRoom = () => {
    if (socket && user) {
      socket.emit('create_bot_room', { user, ...botConfig });
      setShowBotModal(false);
    }
  };

  const joinRandom = () => {
    if (socket && user) {
      socket.emit('join_random', user);
    }
  };

  const joinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && user && joinId) {
      socket.emit('join_room', { roomId: joinId.toUpperCase(), user });
    }
  };

  const leaveRoom = () => {
    if (socket && room) {
      socket.emit('leave_room', room.id);
      setRoom(null);
    }
  };

  const makeMove = (row: number, col: number) => {
    if (socket && room) {
      socket.emit('make_move', { roomId: room.id, row, col });
    }
  };

  const restartGame = () => {
    if (socket && room) {
      socket.emit('restart_game', room.id);
    }
  };

  const updateLocalUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <div className={`app-container ${(room?.theme_id || user?.theme_id) || 'classic'} ${socket ? 'socket-connected' : ''}`}>
      {user ? (
        <header className="pixel-border main-header">
          <div className="header-content logged-in">
            <div className="header-left">
              <button 
                className="header-avatar-btn pixel-border" 
                onClick={() => setShowProfile(true)} 
                title="View Profile"
              >
                {AVATAR_MAP[user.avatar_id] || '👤'}
              </button>
            </div>
            
            <div className="header-center" onClick={() => setShowProfile(true)}>
              <span className="header-username">{user.username}</span>
              <div className="header-stats">
                <span className="rank-badge" style={{ color: getRankTier(user.elo_rating).color }}>
                  {getRankTier(user.elo_rating).icon} {getRankTier(user.elo_rating).name}
                </span>
                <span className="stats-separator">|</span>
                <span className="coins-display">💰 <strong>{user.pixel_coins || 0}</strong></span>
                <span className="stats-separator">|</span>
                <span>ELO: <strong className="header-elo">{user.elo_rating || 1000}</strong></span>
                <span className="stats-separator">|</span>
                <span>WINS: <strong>{user.total_wins || 0}</strong></span>
              </div>
            </div>

            <div className="header-right">
              <button 
                className="mute-btn pixel-border" 
                onClick={toggleMute} 
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="pixel-border logged-out-header">
          <h1>CARO PIXEL</h1>
        </header>
      )}

      <main>
        {!user ? (
          <AuthForm 
            type={authType} 
            onSuccess={handleAuthSuccess} 
            onSwitch={() => setAuthType(authType === 'login' ? 'register' : 'login')}
          />
        ) : room ? (
          <GameRoom 
            room={room} 
            user={user} 
            socket={socket}
            onLeave={leaveRoom} 
            onMove={makeMove}
            onRestart={restartGame}
          />
        ) : (
          <div className="lobby-container">
            <div className="lobby pixel-border">
              <div className="lobby-actions">
                <button className="create-btn bot-btn" style={{ backgroundColor: '#9b59b6', marginBottom: '10px' }} onClick={() => setShowBotModal(true)}>PLAY WITH BOT</button>
                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', opacity: 0.6 }}>
                  <div style={{ flex: 1, height: '2px', backgroundColor: '#000' }}></div>
                  <span style={{ margin: '0 10px', fontSize: '0.5rem' }}>OR ONLINE</span>
                  <div style={{ flex: 1, height: '2px', backgroundColor: '#000' }}></div>
                </div>
                <button className="create-btn" onClick={createRoom}>CREATE ROOM</button>
                <button className="join-btn" onClick={joinRandom}>JOIN RANDOM</button>
                
                <form className="join-code-form" onSubmit={joinByCode}>
                  <input 
                    type="text" 
                    placeholder="ROOM CODE" 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    maxLength={6}
                  />
                  <button type="submit">JOIN</button>
                </form>
              </div>
            </div>
            <Leaderboard />
          </div>
        )}
      </main>

      {showBotModal && (
        <div className="modal-overlay">
          <div className="pixel-border bot-modal" style={{ 
            backgroundColor: '#34495e', 
            padding: '20px', 
            zIndex: 1000, 
            position: 'relative',
            maxWidth: '350px',
            width: '90%'
          }}>
            <h2 style={{ color: '#f1c40f', fontSize: '1rem', marginBottom: '20px' }}>PRACTICE WITH BOT</h2>
            
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.6rem', marginBottom: '10px' }}>DIFFICULTY:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['easy', 'medium', 'hard'].map(d => (
                  <button 
                    key={d} 
                    style={{ 
                      flex: 1, 
                      fontSize: '0.5rem', 
                      padding: '8px 5px',
                      backgroundColor: botConfig.difficulty === d ? '#e67e22' : '#2c3e50'
                    }}
                    onClick={() => setBotConfig({ ...botConfig, difficulty: d })}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.6rem', marginBottom: '10px' }}>YOUR SYMBOL:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['X', 'O', 'Random'].map(s => (
                  <button 
                    key={s} 
                    style={{ 
                      flex: 1, 
                      fontSize: '0.5rem', 
                      padding: '8px 5px',
                      backgroundColor: botConfig.symbol === s ? '#e67e22' : '#2c3e50'
                    }}
                    onClick={() => setBotConfig({ ...botConfig, symbol: s })}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ flex: 1, backgroundColor: '#95a5a6', fontSize: '0.6rem' }} 
                onClick={() => setShowBotModal(false)}
              >
                CANCEL
              </button>
              <button 
                style={{ flex: 1, backgroundColor: '#2ecc71', fontSize: '0.6rem' }} 
                onClick={createBotRoom}
              >
                START
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && user && (
        <Profile 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onUpdate={updateLocalUser}
          onViewReplay={(id) => {
            setReplayMatchId(id);
            setShowProfile(false);
          }}
          onLogout={handleLogout}
        />
      )}

      {replayMatchId && (
        <Replay 
          matchId={replayMatchId} 
          onClose={() => setReplayMatchId(null)} 
        />
      )}

      <footer>
        <p>Built with Gemini CLI</p>
      </footer>
    </div>
  )
}

export default App
