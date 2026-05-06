import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function History() {
  const [trades, setTrades] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSymbol, setFilterSymbol] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const isMobile = window.innerWidth <= 768;

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    let data = [...trades];
    if (filterType !== 'all') data = data.filter(t => t.type === filterType);
    if (filterSymbol) data = data.filter(t => t.symbol.toLowerCase().includes(filterSymbol.toLowerCase()));
    setFiltered(data);
  }, [trades, filterType, filterSymbol]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/trades/${user.id}`);
      setTrades(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Symbol', 'Quantity', 'Price', 'Total'];
    const rows = filtered.map(t => [
      new Date(t.created_at).toLocaleString(), t.type.toUpperCase(),
      t.symbol, parseFloat(t.quantity).toFixed(6),
      parseFloat(t.price).toFixed(4), parseFloat(t.total).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, paddingBottom: isMobile ? '80px' : '24px' }}>

        <div style={styles.header}>
          <h1 style={{ ...styles.title, fontSize: isMobile ? '20px' : '24px' }}>Trade History</h1>
          <button style={styles.exportBtn} onClick={exportCSV}>⬇ CSV</button>
        </div>

        {/* Stats */}
        <div style={{ ...styles.statsRow, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
          <div style={styles.statCard}><div style={styles.statVal}>{trades.length}</div><div style={styles.statLabel}>Total</div></div>
          <div style={styles.statCard}><div style={{ ...styles.statVal, color: '#0ecb81' }}>{trades.filter(t => t.type === 'buy').length}</div><div style={styles.statLabel}>Buys</div></div>
          <div style={styles.statCard}><div style={{ ...styles.statVal, color: '#f6465d' }}>{trades.filter(t => t.type === 'sell').length}</div><div style={styles.statLabel}>Sells</div></div>
          <div style={{ ...styles.statCard, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
            <div style={{ ...styles.statVal, color: '#f0b90b', fontSize: isMobile ? '16px' : '22px' }}>${totalVolume.toFixed(0)}</div>
            <div style={styles.statLabel}>Volume</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.filterTabs}>
            {['all', 'buy', 'sell'].map(t => (
              <button key={t} style={{ ...styles.filterTab, background: filterType === t ? '#f0b90b' : '#2b3139', color: filterType === t ? '#1e2329' : '#848e9c' }} onClick={() => setFilterType(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <input style={styles.searchInput} placeholder="Search coin..." value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)} />
        </div>

        {/* Trades */}
        {loading ? (
          <div style={styles.loading}>Loading history...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No trades found. Start trading!</div>
        ) : isMobile ? (
          // Mobile card list
          <div style={styles.mobileList}>
            {filtered.map((trade, i) => (
              <div key={i} style={styles.tradeCard}>
                <div style={styles.tradeCardTop}>
                  <div style={styles.tradeCardLeft}>
                    <span style={{
                      background: trade.type === 'buy' ? '#0d2818' : '#2d1318',
                      color: trade.type === 'buy' ? '#0ecb81' : '#f6465d',
                      padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                    }}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span style={{ color: '#eaecef', fontWeight: '600', fontSize: '15px' }}>{trade.symbol}</span>
                  </div>
                  <div style={{ color: '#f0b90b', fontWeight: '700', fontSize: '15px' }}>
                    ${parseFloat(trade.total).toFixed(2)}
                  </div>
                </div>
                <div style={styles.tradeCardBottom}>
                  <span style={{ color: '#474d57', fontSize: '12px' }}>
                    {new Date(trade.created_at).toLocaleDateString()} {new Date(trade.created_at).toLocaleTimeString()}
                  </span>
                  <span style={{ color: '#848e9c', fontSize: '12px' }}>
                    {parseFloat(trade.quantity).toFixed(6)} @ ${parseFloat(trade.price).toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop table
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Coin</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Total (USDT)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade, i) => (
                  <tr key={i} style={styles.tr}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e2329'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={styles.td}>
                      <div style={{ color: '#eaecef' }}>{new Date(trade.created_at).toLocaleDateString()}</div>
                      <div style={{ color: '#474d57', fontSize: '11px' }}>{new Date(trade.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ background: trade.type === 'buy' ? '#0d2818' : '#2d1318', color: trade.type === 'buy' ? '#0ecb81' : '#f6465d', padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}><span style={{ fontWeight: '600', color: '#eaecef' }}>{trade.symbol}</span></td>
                    <td style={{ ...styles.td, color: '#eaecef' }}>{parseFloat(trade.quantity).toFixed(6)}</td>
                    <td style={{ ...styles.td, color: '#eaecef' }}>${parseFloat(trade.price).toFixed(4)}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#f0b90b' }}>${parseFloat(trade.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '16px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  title: { fontWeight: '600', color: '#eaecef', margin: 0 },
  exportBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  statsRow: { display: 'grid', gap: '10px', marginBottom: '14px' },
  statCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  statVal: { fontSize: '22px', fontWeight: '700', color: '#eaecef', marginBottom: '4px' },
  statLabel: { fontSize: '12px', color: '#848e9c' },
  filters: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', gap: '6px' },
  filterTab: { padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  searchInput: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '6px', color: '#eaecef', padding: '8px 14px', fontSize: '13px', outline: 'none' },
  loading: { textAlign: 'center', padding: '60px', color: '#848e9c' },
  empty: { textAlign: 'center', padding: '60px', color: '#848e9c', background: '#1e2329', borderRadius: '12px' },
  mobileList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tradeCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '10px', padding: '14px' },
  tradeCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  tradeCardLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  tradeCardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableWrap: { background: '#1e2329', borderRadius: '12px', border: '1px solid #2b3139', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#161a1e' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#848e9c', fontWeight: '500', borderBottom: '1px solid #2b3139' },
  tr: { borderBottom: '1px solid #161a1e', cursor: 'default' },
  td: { padding: '14px 16px', fontSize: '13px' },
};