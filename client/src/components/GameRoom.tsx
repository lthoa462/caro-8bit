import React, { useState, useEffect, useRef } from 'react';
import './GameRoom.css';
import { Socket } from 'socket.io-client';
import { AVATAR_MAP } from './Profile';
import * as SoundManager from '../audio/soundManager';

interface GameRoomProps {
  room: any;
  user: any;
  socket: Socket | null;
  onLeave: () => void;
  onMove: (row: number, col: number) => void;
  onRestart: () => void;
}

const EMOTES = ['😊', '😂', '😭', '😠', '😎', '😱', 'GG', 'WP'];

const GameRoom: React.FC<GameRoomProps> = ({ room, user, socket, onLeave, onMove, onRestart }) => {
  const [chatMsg, setChatMsg] = useState('');
  const [activeEmotes, setActiveEmotes] = useState<any>({});
  const [currentTimer, setCurrentTimer] = useState(room.timer || 30);
  const [showEmoteSelector, setShowEmoteSelector] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const _opponent = room.players.find((p: any) => p.id !== user.id);
  const me = room.players.find((p: any) => p.id === user.id);
  const playerX = room.players.find((p: any) => p.symbol === 'X');
  const playerO = room.players.find((p: any) => p.symbol === 'O');
  const isMyTurn = room.currentTurn === me?.symbol && room.status === 'playing';
  const isBotTurn = room.isBotRoom && !isMyTurn && room.status === 'playing';

  useEffect(() => {
    setCurrentTimer(room.timer);
  }, [room.timer, room.currentTurn]);

  useEffect(() => {
    if (socket) {
      socket.on('new_emote', ({ userId, emoteId }) => {
        setActiveEmotes((prev: any) => ({ ...prev, [userId]: emoteId }));
        setTimeout(() => {
          setActiveEmotes((prev: any) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }, 2000);
      });

      socket.on('timer_update', ({ timer }) => {
        setCurrentTimer(timer);
        if (timer <= 5 && timer > 0) {
          SoundManager.playTickSound();
        }
      });

      return () => {
        socket.off('new_emote');
        socket.off('timer_update');
      };
    }
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

  const isWinningCell = (row: number, col: number) => {
    if (!room.winningLine) return false;
    return room.winningLine.some((cell: number[]) => cell[0] === row && cell[1] === col);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMsg.trim() && socket) {
      socket.emit('send_chat', { roomId: room.id, message: chatMsg });
      setChatMsg('');
    }
  };

  const handleSendEmote = (emote: string) => {
    if (socket) {
      socket.emit('send_emote', { roomId: room.id, emoteId: emote });
    }
  };

  const timerPercentage = (currentTimer / 30) * 100;

  return (
    <div className={`game-room-container ${room.theme_id || 'classic'}`}>
      <div className={`game-room pixel-border ${room.status === 'finished' && room.winner !== user.id ? 'shake' : ''}`}>
        <div className="room-info">
          <p>ROOM ID: <span className="highlight">{room.id}</span></p>
          <button className="leave-btn" onClick={onLeave}>LEAVE</button>
        </div>

        <div className="timer-wrapper">
          {!isBotTurn ? (
            <>
              <div 
                className={`timer-bar ${currentTimer <= 10 ? 'low' : ''}`} 
                style={{ width: `${timerPercentage}%` }} 
              />
              <span className="timer-text">{currentTimer}s</span>
            </>
          ) : (
            <span className="timer-text bot-thinking" style={{ width: '100%', textAlign: 'center' }}>BOT IS THINKING...</span>
          )}
        </div>

        <div className="players-info">

          {/* Player X */}
          <div className={`player ${room.currentTurn === 'X' ? 'active' : ''} pixel-border`}>
            {playerX ? (
              <div className="player-inner">
                <div className="player-avatar-section">
                  <div className="avatar-box pixel-border">
                    <span className="avatar-emoji">{AVATAR_MAP[playerX.avatar_id] || '👤'}</span>
                    {activeEmotes[playerX.id] && <div className="emote-bubble">{activeEmotes[playerX.id]}</div>}
                  </div>
                  {playerX.id === user.id && (
                    <button type="button" className="mobile-emote-toggle pixel-border" onClick={() => setShowEmoteSelector(!showEmoteSelector)}>😊</button>
                  )}
                  {playerX.id === user.id && showEmoteSelector && (
                    <div className="mobile-emote-popup pixel-border">
                      {EMOTES.map(e => (
                        <button key={e} type="button" onClick={() => { handleSendEmote(e); setShowEmoteSelector(false); }}>{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="player-details">
                  {playerX.id === user.id && <span className="you-tag">YOU</span>}
                  <span className="player-name" title={playerX.username}>{playerX.username}</span>
                  <span className="player-elo">{playerX.elo_rating} ELO</span>
                </div>
              </div>
            ) : (
              <div className="player-inner waiting"><span className="waiting-text">WAITING...</span></div>
            )}
          </div>

          <div className="vs">VS</div>

          {/* Player O */}
          <div className={`player ${room.currentTurn === 'O' ? 'active' : ''} pixel-border`}>
            {playerO ? (
              <div className="player-inner">
                <div className="player-avatar-section">
                  <div className="avatar-box pixel-border">
                    <span className="avatar-emoji">{AVATAR_MAP[playerO.avatar_id] || '👤'}</span>
                    {activeEmotes[playerO.id] && <div className="emote-bubble">{activeEmotes[playerO.id]}</div>}
                  </div>
                  {playerO.id === user.id && (
                    <button type="button" className="mobile-emote-toggle pixel-border" onClick={() => setShowEmoteSelector(!showEmoteSelector)}>😊</button>
                  )}
                  {playerO.id === user.id && showEmoteSelector && (
                    <div className="mobile-emote-popup pixel-border">
                      {EMOTES.map(e => (
                        <button key={e} type="button" onClick={() => { handleSendEmote(e); setShowEmoteSelector(false); }}>{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="player-details">
                  {playerO.id === user.id && <span className="you-tag">YOU</span>}
                  <span className="player-name" title={playerO.username}>{playerO.username}</span>
                  <span className="player-elo">{playerO.elo_rating} ELO</span>
                </div>
              </div>
            ) : (
              <div className="player-inner waiting"><span className="waiting-text">WAITING...</span></div>
            )}
          </div>

        </div>

        <div className="game-status">
          {room.status === 'playing' && (
            <p className={isMyTurn ? 'my-turn' : ''}>
              {isMyTurn ? "YOUR TURN!" : "OPPONENT'S TURN..."}
            </p>
          )}
          {room.status === 'finished' && (
            <div className="game-over">
              <p className="win-msg">
                {room.winner === user.id ? "YOU WIN!" : "YOU LOSE!"}
                {room.reason === 'timeout' && <span className="timeout-reason"> (TIMEOUT)</span>}
              </p>
              <button className="restart-btn" onClick={onRestart}>PLAY AGAIN</button>
            </div>
          )}
        </div>

        <div className="board pixel-border">
          {room.board.map((row: any[], rowIndex: number) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell: string | null, colIndex: number) => (
                <div 
                  key={colIndex} 
                  className={`board-cell 
                    ${!cell && isMyTurn ? 'clickable' : ''} 
                    ${isWinningCell(rowIndex, colIndex) ? 'winner-cell' : ''}
                  `}
                  onClick={() => !cell && isMyTurn && onMove(rowIndex, colIndex)}
                >
                  {cell === 'X' && <span className="symbol-x">X</span>}
                  {cell === 'O' && <span className="symbol-o">O</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="social-panel">
        <div className="emote-panel pixel-border">
          {EMOTES.map(e => (
            <button key={e} onClick={() => handleSendEmote(e)}>{e}</button>
          ))}
        </div>

        <div className="chat-panel pixel-border">
          <div className="chat-messages">
            {room.chat?.map((msg: any, i: number) => (
              <div key={i} className="chat-msg">
                <span className="chat-user">{msg.username}:</span> {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input" onSubmit={handleSendChat}>
            <input 
              type="text" 
              placeholder="SAY SOMETHING..." 
              value={chatMsg} 
              onChange={(e) => setChatMsg(e.target.value)} 
            />
            <button type="submit">SEND</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
