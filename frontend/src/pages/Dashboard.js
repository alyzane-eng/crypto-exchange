import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [portRes, mktRes] = await Promise.all([
        axios.get(`https://crypto-exchange-production-12cd.up.railway.app/api/portfolio/${user.id}`),
        axios.get('https://crypto-exchange-production-12cd.up.railway.app/api/markets'),
      ]);
      setPortfolio(portRes.data);
      const priceMap = {};
      mktRes.data.forEach(c => { priceMap[c.symbol] = parseFloat(c.price); });
      setPrices(priceMap);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getCryptoValue = () => {
    if (!portfolio?.holdings) return 0;
    return portfolio.holdings.reduce((sum, h) => {
      return sum + (parseFloat(h.quantity) * (prices[h.symbol] || 0));
    }, 0);
  };

  const usdtBalance = parseFloat(portfolio?.wallet?.usdt_balance || 0);
  const cryptoValue = getCryptoValue();
  const totalValue = usdtBalance + cryptoValue;
  const pnl = totalValue - 10000;
  const pnlPct = ((pnl / 10000) * 100).toFixed(2);
  const isUp = pnl >= 0;

  if (loading) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.loading}>Loading portfolio...</div>
    </div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, paddingBottom: isMobile ? '80px' : '24px' }}>

        {/* Welcome */}
        <div style={styles.welcome}>
          <div>
            <h1 style={{ ...styles.welcomeTitle, fontSize: isMobile ? '20px' : '26px' }}>
              Welcome back, {user?.name} 👋
            </h1>
            <p style={styles.welcomeSub}>Your portfolio overview</p>
          </div>
          {!isMobile && (
            <button style={styles.tradeNowBtn} onClick={() => navigate('/markets')}>
              Trade Now →
            </button>
          )}
        </div>

        {/* Main stat card */}
        <div style={styles.mainStatCard}>
          <div style={styles.mainStatLabel}>Total Portfolio Value</div>
          <div style={{ ...styles.mainStatValue, fontSize: isMobile ? '32px' : '40px' }}>
            ${totalValue.toFixed(2)}
          </div>
          <div style={{
            ...styles.mainStatPnl,
            color: isUp ? '#0ecb81' : '#f6465d',
            background: isUp ? '#0d2818' : '#2d1318',
          }}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{pnl.toFixed(2)} ({pnlPct}%) All time
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ ...styles.statsGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💵</div>
            <div style={styles.statLabel}>Cash (USDT)</div>
            <div style={styles.statValue}>${usdtBalance.toFixed(2)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🪙</div>
            <div style={styles.statLabel}>Crypto Value</div>
            <div style={styles.statValue}>${cryptoValue.toFixed(2)}</div>
          </div>
          <div style={{ ...styles.statCard, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statLabel}>Starting Balance</div>
            <div style={styles.statValue}>$10,000.00</div>
          </div>
        </div>

        {/* Holdings */}
        <div style={styles.holdingsCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>My Holdings</h2>
            <button style={styles.viewAllBtn} onClick={() => navigate('/wallet')}>
              View All →
            </button>
          </div>

          {!portfolio?.holdings?.length ? (
            <div style={styles.empty}>
              <p style={{ color: '#848e9c', marginBottom: '12px' }}>No crypto yet</p>
              <button style={styles.goBtn} onClick={() => navigate('/markets')}>
                Go to Markets
              </button>
            </div>
          ) : (
            <div style={styles.holdingsList}>
              {portfolio.holdings.slice(0, 5).map(h => {
                const cp = prices[h.symbol] || 0;
                const value = parseFloat(h.quantity) * cp;
                const holdingPnl = value - (parseFloat(h.quantity) * parseFloat(h.avg_buy_price));
                return (
                  <div
                    key={h.id}
                    style={styles.holdingRow}
                    onClick={() => navigate(`/trade/${h.symbol}`)}
                  >
                    <div style={styles.holdingLeft}>
                      <div style={styles.holdingIcon}>{h.symbol.charAt(0)}</div>
                      <div>
                        <div style={styles.holdingSymbol}>{h.symbol}</div>
                        <div style={styles.holdingQty}>
                          {parseFloat(h.quantity).toFixed(isMobile ? 4 : 6)}
                        </div>
                      </div>
                    </div>
                    <div style={styles.holdingRight}>
                      <div style={styles.holdingValue}>${value.toFixed(2)}</div>
                      <div style={{ fontSize: '12px', color: holdingPnl >= 0 ? '#0ecb81' : '#f6465d' }}>
                        {holdingPnl >= 0 ? '+' : ''}${holdingPnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={styles.actionsGrid}>
          {[
            { icon: '🌐', label: 'Markets', sub: '500+ coins', path: '/markets', color: '#0ecb81' },
            { icon: '💼', label: 'Wallet', sub: 'All assets', path: '/wallet', color: '#f0b90b' },
            { icon: '📋', label: 'History', sub: 'All trades', path: '/history', color: '#848e9c' },
            { icon: '💬', label: 'Forum', sub: 'Community', path: '/forum', color: '#a78bfa' },
            { icon: '🏆', label: 'Leaderboard', sub: 'Rankings', path: '/leaderboard', color: '#f6465d' },
          ].map(a => (
            <div
              key={a.path}
              style={styles.actionCard}
              onClick={() => navigate(a.path)}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{a.icon}</div>
              <div style={{ color: '#eaecef', fontSize: '13px', fontWeight: '600' }}>{a.label}</div>
              <div style={{ color: '#474d57', fontSize: '11px' }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  loading: { textAlign: 'center', padding: '80px', color: '#848e9c', fontSize: '16px' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '16px' },
  welcome: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  welcomeTitle: { fontWeight: '700', color: '#eaecef', margin: 0 },
  welcomeSub: { color: '#848e9c', fontSize: '13px', marginTop: '2px' },
  tradeNowBtn: { background: '#f0b90b', border: 'none', borderRadius: '8px', color: '#1e2329', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  mainStatCard: {
    background: 'linear-gradient(135deg, #1e2329, #2b3139)',
    border: '1px solid #2b3139',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  mainStatLabel: { fontSize: '13px', color: '#848e9c', marginBottom: '8px' },
  mainStatValue: { fontWeight: '700', color: '#eaecef', marginBottom: '12px' },
  mainStatPnl: { display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  statsGrid: { display: 'grid', gap: '10px', marginBottom: '12px' },
  statCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  statIcon: { fontSize: '20px', marginBottom: '6px' },
  statLabel: { fontSize: '12px', color: '#848e9c', marginBottom: '4px' },
  statValue: { fontSize: '16px', fontWeight: '700', color: '#eaecef' },
  holdingsCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #2b3139' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#eaecef', margin: 0 },
  viewAllBtn: { background: 'transparent', border: 'none', color: '#f0b90b', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '32px' },
  goBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  holdingsList: { padding: '4px 0' },
  holdingRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #161a1e' },
  holdingLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  holdingIcon: { width: '36px', height: '36px', borderRadius: '50%', background: '#2b3139', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#f0b90b' },
  holdingSymbol: { fontWeight: '600', fontSize: '14px', color: '#eaecef' },
  holdingQty: { fontSize: '11px', color: '#474d57', marginTop: '2px' },
  holdingRight: { textAlign: 'right' },
  holdingValue: { fontWeight: '600', fontSize: '14px', color: '#eaecef' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  actionCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' },
};