import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Wallet() {
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
    return portfolio.holdings.reduce((sum, h) => sum + (parseFloat(h.quantity) * (prices[h.symbol] || 0)), 0);
  };

  const usdtBalance = parseFloat(portfolio?.wallet?.usdt_balance || 0);
  const cryptoValue = getCryptoValue();
  const totalValue = usdtBalance + cryptoValue;
  const pnl = totalValue - 10000;
  const pnlPct = ((pnl / 10000) * 100).toFixed(2);

  if (loading) return (
    <div style={styles.page}><Navbar /><div style={styles.loading}>Loading wallet...</div></div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, paddingBottom: isMobile ? '80px' : '24px' }}>
        <h1 style={{ ...styles.title, fontSize: isMobile ? '20px' : '24px' }}>My Wallet</h1>

        {/* Total value card */}
        <div style={styles.totalCard}>
          <div style={styles.totalLabel}>Total Portfolio Value</div>
          <div style={{ ...styles.totalValue, fontSize: isMobile ? '36px' : '48px' }}>
            ${totalValue.toFixed(2)}
          </div>
          <div style={{ color: pnl >= 0 ? '#0ecb81' : '#f6465d', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPct}%)
          </div>
          <div style={{ ...styles.totalStats, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '48px' }}>
            <div style={styles.totalStat}>
              <span style={styles.totalStatLabel}>Starting</span>
              <span style={styles.totalStatVal}>$10,000.00</span>
            </div>
            <div style={styles.totalStat}>
              <span style={styles.totalStatLabel}>Cash (USDT)</span>
              <span style={styles.totalStatVal}>${usdtBalance.toFixed(2)}</span>
            </div>
            <div style={styles.totalStat}>
              <span style={styles.totalStatLabel}>Crypto</span>
              <span style={styles.totalStatVal}>${cryptoValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Assets */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Assets</h2>
          </div>

          {/* USDT row */}
          <div style={styles.assetRow} onClick={() => navigate('/markets')}>
            <div style={styles.assetLeft}>
              <div style={{ ...styles.assetIcon, background: '#1a3a2a', color: '#0ecb81' }}>$</div>
              <div>
                <div style={styles.assetSymbol}>USDT</div>
                <div style={styles.assetName}>Tether USD</div>
              </div>
            </div>
            <div style={styles.assetRight}>
              <div style={styles.assetValue}>${usdtBalance.toFixed(2)}</div>
              <div style={{ color: '#848e9c', fontSize: '12px' }}>$1.00 / coin</div>
            </div>
          </div>

          {/* Holdings */}
          {portfolio?.holdings?.map(h => {
            const cp = prices[h.symbol] || 0;
            const value = parseFloat(h.quantity) * cp;
            const cost = parseFloat(h.quantity) * parseFloat(h.avg_buy_price);
            const holdingPnl = value - cost;
            return (
              <div key={h.id} style={styles.assetRow} onClick={() => navigate(`/trade/${h.symbol}`)}>
                <div style={styles.assetLeft}>
                  <div style={styles.assetIcon}>{h.symbol.charAt(0)}</div>
                  <div>
                    <div style={styles.assetSymbol}>{h.symbol}</div>
                    <div style={styles.assetName}>{parseFloat(h.quantity).toFixed(6)}</div>
                  </div>
                </div>
                <div style={styles.assetRight}>
                  <div style={styles.assetValue}>${value.toFixed(2)}</div>
                  <div style={{ color: holdingPnl >= 0 ? '#0ecb81' : '#f6465d', fontSize: '12px' }}>
                    {holdingPnl >= 0 ? '+' : ''}${holdingPnl.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}

          {!portfolio?.holdings?.length && (
            <div style={styles.empty}>
              <p style={{ color: '#848e9c', marginBottom: '12px' }}>No crypto holdings yet</p>
              <button style={styles.goBtn} onClick={() => navigate('/markets')}>Go to Markets →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  loading: { textAlign: 'center', padding: '80px', color: '#848e9c' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '16px' },
  title: { fontWeight: '600', color: '#eaecef', marginBottom: '16px' },
  totalCard: { background: 'linear-gradient(135deg, #1e2329, #2b3139)', border: '1px solid #2b3139', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center' },
  totalLabel: { fontSize: '13px', color: '#848e9c', marginBottom: '8px' },
  totalValue: { fontWeight: '700', color: '#eaecef', marginBottom: '8px' },
  totalStats: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  totalStat: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', padding: '8px 16px' },
  totalStatLabel: { fontSize: '12px', color: '#848e9c' },
  totalStatVal: { fontSize: '15px', fontWeight: '600', color: '#eaecef' },
  section: { background: '#1e2329', borderRadius: '12px', border: '1px solid #2b3139', overflow: 'hidden' },
  sectionHeader: { padding: '14px 16px', borderBottom: '1px solid #2b3139' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#eaecef', margin: 0 },
  assetRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #2b313920', cursor: 'pointer' },
  assetLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  assetIcon: { width: '40px', height: '40px', borderRadius: '50%', background: '#2b3139', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#f0b90b', flexShrink: 0 },
  assetSymbol: { fontWeight: '600', fontSize: '15px', color: '#eaecef' },
  assetName: { fontSize: '12px', color: '#474d57', marginTop: '2px' },
  assetRight: { textAlign: 'right' },
  assetValue: { fontWeight: '600', fontSize: '15px', color: '#eaecef' },
  empty: { textAlign: 'center', padding: '32px' },
  goBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
};