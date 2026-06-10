import React, { useEffect, useState } from 'react';
import './Replay.css';
import { API_BASE_URL } from '../config';

interface Move {
  player: string;
  symbol: string;
  row: number;
  col: number;
  time: string;
}

interface ReplayProps {
  matchId: number;
  onClose: () => void;
}

const Replay: React.FC<ReplayProps> = ({ matchId, onClose }) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(15).fill(null).map(() => Array(15).fill(null))
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.moves_history) {
          setMoves(JSON.parse(data.moves_history));
        }
      })
      .catch(err => console.error('Error fetching match detail:', err));
  }, [matchId]);

  const updateBoard = (index: number) => {
    const newBoard = Array(15).fill(null).map(() => Array(15).fill(null));
    for (let i = 0; i <= index; i++) {
      const move = moves[i];
      newBoard[move.row][move.col] = move.symbol;
    }
    setBoard(newBoard);
    setCurrentIndex(index);
  };

  const nextMove = () => {
    if (currentIndex < moves.length - 1) {
      updateBoard(currentIndex + 1);
    }
  };

  const prevMove = () => {
    if (currentIndex >= 0) {
      updateBoard(currentIndex - 1);
    }
  };

  return (
    <div className="replay-overlay">
      <div className="replay-container pixel-border">
        <div className="replay-header">
          <h3>REPLAY - MATCH #{matchId}</h3>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        <div className="replay-controls">
          <button onClick={prevMove} disabled={currentIndex < 0}>BACK</button>
          <span>STEP: {currentIndex + 1} / {moves.length}</span>
          <button onClick={nextMove} disabled={currentIndex >= moves.length - 1}>NEXT</button>
        </div>

        <div className="board pixel-border">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell, colIndex) => (
                <div key={colIndex} className="board-cell">
                  {cell === 'X' && <span className="symbol-x">X</span>}
                  {cell === 'O' && <span className="symbol-o">O</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Replay;
