import React, { useEffect, useState } from 'react';
import './Leaderboard.css';
import { API_BASE_URL } from '../config';

interface Player {
  username: string;
  elo_rating: number;
  total_wins: number;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(err => console.error('Error fetching leaderboard:', err));
  }, []);

  return (
    <div className="leaderboard pixel-border">
      <h3>TOP PLAYERS</h3>
      <table>
        <thead>
          <tr>
            <th>RANK</th>
            <th>USER</th>
            <th>ELO</th>
            <th>WINS</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(players) && players.slice(0, 5).map((p, index) => (
            <tr key={index}>
              <td>#{index + 1}</td>
              <td>{p.username}</td>
              <td className="elo">{p.elo_rating}</td>
              <td>{p.total_wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
