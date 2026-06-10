
export const getRankTier = (elo: number) => {
  if (elo >= 1800) return { name: 'MASTER', color: '#9b59b6', icon: '👑' };
  if (elo >= 1600) return { name: 'DIAMOND', color: '#3498db', icon: '💎' };
  if (elo >= 1400) return { name: 'PLATINUM', color: '#1abc9c', icon: '✨' };
  if (elo >= 1200) return { name: 'GOLD', color: '#f1c40f', icon: '🏆' };
  if (elo >= 1000) return { name: 'SILVER', color: '#bdc3c7', icon: '🛡️' };
  return { name: 'BRONZE', color: '#e67e22', icon: '🪵' };
};
