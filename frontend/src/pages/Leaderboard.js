import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/leaderboard');
      setBoard(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏆 Class Leaderboard</h1>
          <div style={styles.liveBadge}>● Updates every 15s</div>
        </div>
        <p style={styles.subtitle}>
          Rankings based on total portfolio value
        </p>

        {loading ? (
          <div style={styles.loading}>Loading leaderboard...</div>
        ) : board.length === 0 ? (
          <div style={styles.empty}>
            No students registered yet. Share the site link with your class!
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Rank</span>
              <span>Student</span>
              <span>Portfolio Value</span>
              <span>P&L ($)</span>
              <span>P&L (%)</span>
            </div>
            {board.map((student, index) => {
              const isCurrentUser = student.email === user?.email;
              const pnl = parseFloat(student.pnl);
              return (
                <div
                  key={index}
                  style={{
                    ...styles.tableRow,
                    background: isCurrentUser ? '#1a2a1a' : 'transparent',
                    border: isCurrentUser ? '1px solid #f7931a' : '1px solid transparent',
                    borderRadius: isCurrentUser ? '8px' : '0',
                  }}
                >
                  <span style={styles.rank}>
                    {index < 3 ? medals[index] : `#${index + 1}`}
                  </span>
                  <span style={styles.studentName}>
                    {student.name}
                    {isCurrentUser && (
                      <span style={styles.youBadge}> YOU</span>
                    )}
                  </span>
                  <span style={styles.value}>
                    ${parseFloat(student.totalValue).toLocaleString()}
                  </span>
                  <span style={{ color: pnl >= 0 ? '#4caf50' : '#f44336', fontWeight: '500' }}>
                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                  </span>
                  <span style={{ color: pnl >= 0 ? '#4caf50' : '#f44336', fontWeight: '500' }}>
                    {pnl >= 0 ? '+' : ''}{student.pnlPercent}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d0d1a',
    fontFamily: "'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  },
  title: {
    color: '#fff',
    fontSize: '26px',
    fontWeight: '600',
    margin: 0,
  },
  liveBadge: {
    background: '#1a3a1a',
    color: '#4caf50',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '40px',
  },
  loading: {
    color: '#f7931a',
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    background: '#1a1a2e',
    borderRadius: '12px',
  },
  table: {
    background: '#1a1a2e',
    border: '1px solid #0f3460',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '0.5fr 2fr 1.5fr 1fr 1fr',
    padding: '16px 24px',
    background: '#16213e',
    color: '#888',
    fontSize: '13px',
    fontWeight: '500',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '0.5fr 2fr 1.5fr 1fr 1fr',
    padding: '16px 24px',
    borderTop: '1px solid #16213e',
    alignItems: 'center',
    margin: '4px 8px',
  },
  rank: {
    color: '#888',
    fontSize: '16px',
  },
  studentName: {
    color: '#fff',
    fontWeight: '500',
    fontSize: '15px',
  },
  youBadge: {
    background: '#f7931a',
    color: '#000',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '6px',
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '15px',
  },
};