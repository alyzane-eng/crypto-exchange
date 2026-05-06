import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const COINS = ['BTC','ETH','BNB','SOL','ADA','DOGE','XRP','MATIC','AVAX','DOT'];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [prices, setPrices] = useState([]);
  const [particles, setParticles] = useState([]);
  const animRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const p = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      speed: Math.random() * 0.02 + 0.005,
      opacity: Math.random() * 0.12 + 0.04,
      coin: COINS[Math.floor(Math.random() * COINS.length)],
      dir: Math.random() > 0.5 ? 1 : -1,
    }));
    setParticles(p);
  }, []);

  useEffect(() => {
    let frame;
    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: ((p.y - p.speed) + 100) % 100,
        x: ((p.x + Math.sin(Date.now() / 4000 + p.id) * 0.015 * p.dir) + 100) % 100,
      })));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/prices/top');
      setPrices(res.data);
    } catch (err) {}
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('wallet', JSON.stringify(res.data.wallet));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const tickerItems = [...prices, ...prices, ...prices];

  return (
    <div style={styles.page}>
      {/* Floating particles */}
      <div style={styles.particleLayer}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            color: '#f0b90b',
            fontWeight: '700',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            {p.coin === 'BTC' ? '₿' : p.coin === 'ETH' ? 'Ξ' : p.coin[0]}
          </div>
        ))}
      </div>

      {/* Grid background */}
      <div style={styles.gridBg} />

      {/* Top ticker */}
      <div style={styles.tickerWrap}>
        <div style={styles.tickerTrack}>
          {tickerItems.map((p, i) => (
            <span key={i} style={styles.tickerItem}>
              <span style={{ color: '#eaecef', fontSize: '12px', fontWeight: '600' }}>{p.symbol}</span>
              <span style={{ color: '#848e9c', fontSize: '12px', marginLeft: '4px' }}>${parseFloat(p.price).toLocaleString()}</span>
              <span style={{ color: parseFloat(p.change) >= 0 ? '#0ecb81' : '#f6465d', fontSize: '11px', marginLeft: '4px', fontWeight: '600' }}>
                {parseFloat(p.change) >= 0 ? '▲' : '▼'}{Math.abs(p.change)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainWrap}>

        {/* Logo + tagline — shown above card on mobile, on left on desktop */}
        <div style={{ ...styles.brandSection, display: isMobile ? 'none' : 'flex' }}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>₿</span>
            <span style={styles.logoText}>CryptoClass</span>
          </div>
          <h1 style={styles.tagline}>Learn Crypto Trading</h1>
          <p style={styles.taglineSub}>
            Practice with $10,000 virtual funds.<br />
            Live prices. Real experience. Zero risk.
          </p>
          <div style={styles.featureGrid}>
            {['📈 Live Binance prices', '🪙 500+ cryptocurrencies', '🏆 Class leaderboard', '💼 $10,000 starting balance'].map((f, i) => (
              <div key={i} style={styles.featureItem}>{f}</div>
            ))}
          </div>
          <div style={styles.miniPrices}>
            {prices.slice(0, 3).map((p, i) => (
              <div key={i} style={styles.miniPrice}>
                <div style={{ color: '#f0b90b', fontSize: '12px', fontWeight: '700' }}>{p.symbol}</div>
                <div style={{ color: '#eaecef', fontSize: '13px', fontWeight: '700' }}>${parseFloat(p.price).toLocaleString()}</div>
                <div style={{ color: parseFloat(p.change) >= 0 ? '#0ecb81' : '#f6465d', fontSize: '11px' }}>
                  {parseFloat(p.change) >= 0 ? '+' : ''}{p.change}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div style={styles.cardWrap}>
          {/* Mobile logo */}
          {isMobile && (
            <div style={styles.mobileLogo}>
              <span style={styles.logoIcon}>₿</span>
              <span style={styles.logoText}>CryptoClass</span>
            </div>
          )}

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Sign In</h2>
            <p style={styles.cardSub}>Welcome back! Enter your details.</p>

            {error && (
              <div style={styles.errorBox}>⚠ {error}</div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  style={styles.input}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button style={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            <div style={styles.divider}>
              <div style={styles.divLine} />
              <span style={styles.divText}>New to CryptoClass?</span>
              <div style={styles.divLine} />
            </div>

            <Link to="/register" style={styles.registerLink}>
              Create a free account
            </Link>

            <div style={styles.demoNote}>
              🎓 Educational platform — no real money involved
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div style={styles.bottomTicker}>
        <div style={styles.tickerTrack2}>
          {tickerItems.map((p, i) => (
            <span key={i} style={styles.tickerItem}>
              <span style={{ color: '#eaecef', fontSize: '12px', fontWeight: '600' }}>{p.symbol}/USDT</span>
              <span style={{ color: parseFloat(p.change) >= 0 ? '#0ecb81' : '#f6465d', fontSize: '12px', marginLeft: '6px' }}>
                ${parseFloat(p.price).toLocaleString()}
              </span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerScroll2 {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b0e11',
    fontFamily: "'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  particleLayer: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  gridBg: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `linear-gradient(rgba(240,185,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(240,185,11,0.03) 1px, transparent 1px)`,
    backgroundSize: '50px 50px',
    zIndex: 0,
  },
  tickerWrap: {
    background: '#161a1e',
    borderBottom: '1px solid #2b3139',
    overflow: 'hidden',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
    flexShrink: 0,
  },
  tickerTrack: {
    display: 'inline-flex',
    gap: '32px',
    whiteSpace: 'nowrap',
    animation: 'tickerScroll 25s linear infinite',
    paddingLeft: '100%',
  },
  tickerItem: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  mainWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    zIndex: 1,
    position: 'relative',
    gap: '60px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  brandSection: {
    flex: 1,
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '30px', color: '#f0b90b' },
  logoText: { fontSize: '26px', fontWeight: '800', color: '#f0b90b' },
  tagline: {
    fontSize: '38px',
    fontWeight: '800',
    color: '#eaecef',
    lineHeight: '1.2',
    margin: 0,
    background: 'linear-gradient(135deg, #eaecef 60%, #f0b90b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  taglineSub: { color: '#848e9c', fontSize: '16px', lineHeight: '1.7', margin: 0 },
  featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  featureItem: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '8px', padding: '10px 14px', color: '#848e9c', fontSize: '13px' },
  miniPrices: { display: 'flex', gap: '10px' },
  miniPrice: { flex: 1, background: '#1e2329', border: '1px solid #2b3139', borderRadius: '10px', padding: '12px', textAlign: 'center' },
  cardWrap: {
    width: '100%',
    maxWidth: '420px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  mobileLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  card: {
    background: 'rgba(30,35,41,0.97)',
    border: '1px solid #2b3139',
    borderRadius: '20px',
    padding: '32px 28px',
    width: '100%',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  cardTitle: { fontSize: '24px', fontWeight: '700', color: '#eaecef', margin: '0 0 4px 0' },
  cardSub: { color: '#848e9c', fontSize: '14px', marginBottom: '24px' },
  errorBox: {
    background: '#2d1318',
    border: '1px solid #f6465d',
    color: '#f6465d',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '14px',
    fontSize: '13px',
  },
  inputGroup: { marginBottom: '14px' },
  label: { display: 'block', color: '#848e9c', fontSize: '12px', fontWeight: '500', marginBottom: '6px' },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    background: '#0b0e11',
    border: '1px solid #2b3139',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  inputIcon: { padding: '0 12px', fontSize: '15px', color: '#474d57' },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#eaecef',
    fontSize: '15px',
    padding: '13px 0',
  },
  showPassBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 12px', fontSize: '15px' },
  loginBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #f0b90b, #f8d12f)',
    border: 'none',
    borderRadius: '10px',
    color: '#1e2329',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    marginTop: '6px',
    marginBottom: '20px',
    transition: 'opacity 0.2s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  divLine: { flex: 1, height: '1px', background: '#2b3139' },
  divText: { color: '#474d57', fontSize: '12px', whiteSpace: 'nowrap' },
  registerLink: {
    display: 'block',
    width: '100%',
    padding: '13px',
    background: 'transparent',
    border: '1px solid #2b3139',
    borderRadius: '10px',
    color: '#eaecef',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    marginBottom: '16px',
  },
  demoNote: {
    textAlign: 'center',
    color: '#474d57',
    fontSize: '12px',
    padding: '8px',
    background: '#161a1e',
    borderRadius: '8px',
  },
  bottomTicker: {
    background: '#161a1e',
    borderTop: '1px solid #2b3139',
    overflow: 'hidden',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
    flexShrink: 0,
  },
  tickerTrack2: {
    display: 'inline-flex',
    gap: '32px',
    whiteSpace: 'nowrap',
    animation: 'tickerScroll2 35s linear infinite',
    paddingLeft: '100%',
  },
};