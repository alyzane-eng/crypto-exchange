import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Markets() {
  const [coins, setCoins] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortDir, setSortDir] = useState('desc');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { applyFilters(); }, [coins, search, sortBy, sortDir, tab]);

  const fetchMarkets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/markets');
      setCoins(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const applyFilters = useCallback(() => {
    let data = [...coins];
    if (tab === 'gainers') data = data.filter(c => parseFloat(c.change) > 0).sort((a,b) => parseFloat(b.change) - parseFloat(a.change));
    else if (tab === 'losers') data = data.filter(c => parseFloat(c.change) < 0).sort((a,b) => parseFloat(a.change) - parseFloat(b.change));
    if (search) data = data.filter(c => c.symbol.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'all') {
      data.sort((a, b) => {
        const aVal = parseFloat(a[sortBy]) || 0;
        const bVal = parseFloat(b[sortBy]) || 0;
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    setFiltered(data);
  }, [coins, search, sortBy, sortDir, tab]);

  const formatPrice = (p) => {
    const n = parseFloat(p);
    if (n >= 1000) return n.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (n >= 1) return n.toFixed(4);
    if (n >= 0.01) return n.toFixed(6);
    return n.toFixed(8);
  };

  const formatVolume = (v) => {
    const n = parseFloat(v);
    if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n/1e3).toFixed(2) + 'K';
    return '$' + n.toFixed(2);
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, paddingBottom: isMobile ? '80px' : '24px' }}>

        <div style={styles.header}>
          <h1 style={{ ...styles.title, fontSize: isMobile ? '20px' : '24px' }}>Markets</h1>
          <div style={styles.liveTag}>● LIVE</div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['all', 'gainers', 'losers'].map(t => (
            <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'all' ? 'All' : t === 'gainers' ? '🚀 Gainers' : '📉 Losers'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={styles.searchBar}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search coin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>}
          <span style={styles.countBadge}>{filtered.length}</span>
        </div>

        {/* Table — desktop */}
        {loading ? (
          <div style={styles.loading}>Loading markets from Binance...</div>
        ) : isMobile ? (
          // Mobile card list
          <div style={styles.mobileList}>
            {filtered.slice(0, 100).map((coin, index) => {
              const change = parseFloat(coin.change);
              const isUp = change >= 0;
              return (
                <div
                  key={coin.symbol}
                  style={styles.mobileCard}
                  onClick={() => navigate(`/trade/${coin.symbol}`)}
                >
                  <div style={styles.mobileCardLeft}>
                    <div style={styles.coinAvatar}>{coin.symbol.charAt(0)}</div>
                    <div>
                      <div style={styles.coinSymbol}>{coin.symbol}</div>
                      <div style={styles.coinPair}>{formatVolume(coin.volume)}</div>
                    </div>
                  </div>
                  <div style={styles.mobileCardRight}>
                    <div style={styles.priceText}>${formatPrice(coin.price)}</div>
                    <div style={{
                      ...styles.changeBadge,
                      background: isUp ? '#0d2818' : '#2d1318',
                      color: isUp ? '#0ecb81' : '#f6465d',
                    }}>
                      {isUp ? '+' : ''}{coin.change}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop table
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Coin</th>
                  <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => { setSortBy('price'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}>
                    Price {sortBy === 'price' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => { setSortBy('change'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}>
                    24h Change {sortBy === 'change' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => { setSortBy('volume'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}>
                    Volume {sortBy === 'volume' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((coin, index) => {
                  const change = parseFloat(coin.change);
                  const isUp = change >= 0;
                  return (
                    <tr key={coin.symbol} style={styles.tr}
                      onMouseEnter={e => e.currentTarget.style.background = '#1e2329'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={styles.td}><span style={{ color: '#474d57' }}>{index + 1}</span></td>
                      <td style={styles.td}>
                        <div style={styles.coinCell}>
                          <div style={styles.coinAvatar}>{coin.symbol.charAt(0)}</div>
                          <div>
                            <div style={styles.coinSymbol}>{coin.symbol}</div>
                            <div style={styles.coinPair}>{coin.symbol}/USDT</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.priceText}>${formatPrice(coin.price)}</span></td>
                      <td style={styles.td}>
                        <span style={{ ...styles.changeBadge, background: isUp ? '#0d2818' : '#2d1318', color: isUp ? '#0ecb81' : '#f6465d' }}>
                          {isUp ? '+' : ''}{coin.change}%
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#848e9c' }}>{formatVolume(coin.volume)}</td>
                      <td style={styles.td}>
                        <button style={styles.tradeBtn} onClick={() => navigate(`/trade/${coin.symbol}`)}>Trade</button>
                      </td>
                    </tr>
                  );
                })}
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
  container: { maxWidth: '1400px', margin: '0 auto', padding: '16px' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  title: { color: '#eaecef', fontWeight: '600', margin: 0 },
  liveTag: { background: '#0d2818', color: '#0ecb81', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #2b3139' },
  tab: { background: 'transparent', border: 'none', color: '#848e9c', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', borderBottom: '2px solid transparent', marginBottom: '-1px' },
  tabActive: { color: '#f0b90b', borderBottom: '2px solid #f0b90b' },
  searchBar: { display: 'flex', alignItems: 'center', background: '#1e2329', border: '1px solid #2b3139', borderRadius: '8px', padding: '0 14px', marginBottom: '12px', gap: '8px' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#eaecef', fontSize: '14px', padding: '11px 0' },
  clearBtn: { background: 'transparent', border: 'none', color: '#848e9c', cursor: 'pointer', fontSize: '14px' },
  countBadge: { background: '#2b3139', color: '#848e9c', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '60px', color: '#848e9c' },
  mobileList: { display: 'flex', flexDirection: 'column', gap: '1px' },
  mobileCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px', background: '#1e2329', borderBottom: '1px solid #2b3139', cursor: 'pointer' },
  mobileCardLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  mobileCardRight: { textAlign: 'right' },
  coinAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#2b3139', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#f0b90b', flexShrink: 0 },
  coinCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  coinSymbol: { fontWeight: '600', fontSize: '14px', color: '#eaecef' },
  coinPair: { fontSize: '11px', color: '#474d57', marginTop: '2px' },
  priceText: { fontWeight: '600', color: '#eaecef', fontSize: '14px' },
  changeBadge: { padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', display: 'inline-block', marginTop: '4px' },
  tableWrap: { background: '#1e2329', borderRadius: '12px', border: '1px solid #2b3139', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#161a1e' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#848e9c', fontWeight: '500', borderBottom: '1px solid #2b3139', userSelect: 'none' },
  tr: { borderBottom: '1px solid #1e2329', cursor: 'pointer', transition: 'background 0.1s' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#eaecef' },
  tradeBtn: { background: '#f0b90b', border: 'none', borderRadius: '4px', color: '#1e2329', padding: '6px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
};