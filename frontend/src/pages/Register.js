import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [prices, setPrices] = useState([]);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

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

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const tickerItems = [...prices, ...prices, ...prices];

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#0b0e11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: '20px', padding: '48px 36px', textAlign: 'center', maxWidth: '380px', width: '90%' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#eaecef', margin: '0 0 8px 0' }}>Account Created!</h2>
        <p style={{ color: '#848e9c', marginBottom: '20px' }}>Welcome, <strong style={{ color: '#f0b90b' }}>{name}</strong>!</p>
        <div style={{ background: '#0d2818', border: '1px solid #0ecb81', color: '#0ecb81', padding: '12px 20px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
          💰 $10,000 USDT added to your wallet!
        </div>
        <p style={{ color: '#474d57', fontSize: '13px' }}>Redirecting to login...</p>
        <div style={{ height: '4px', background: '#2b3139', borderRadius: '2px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#f0b90b', animation: 'fillBar 3s linear forwards', borderRadius: '2px' }} />
        </div>
      </div>
      <style>{`@keyframes fillBar { from{width:0%} to{width:100%} }`}</style>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.gridBg} />

      {/* Ticker */}
      <div style={styles.tickerWrap}>
        <div style={styles.tickerTrack}>
          {tickerItems.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#eaecef', fontSize: '12px', fontWeight: '600' }}>{p.symbol}</span>
              <span style={{ color: '#848e9c', fontSize: '12px' }}>${parseFloat(p.price).toLocaleString()}</span>
              <span style={{ color: parseFloat(p.change) >= 0 ? '#0ecb81' : '#f6465d', fontSize: '11px', fontWeight: '600' }}>
                {parseFloat(p.change) >= 0 ? '▲' : '▼'}{Math.abs(p.change)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      <div style={styles.mainWrap}>

        {/* Left panel — desktop only */}
        <div style={{ ...styles.leftPanel, display: isMobile ? 'none' : 'flex' }}>
          <Link to="/login" style={styles.backLink}>← Back to Sign In</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px', color: '#f0b90b' }}>₿</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#f0b90b' }}>CryptoClass</span>
          </div>
          <h1 style={styles.tagline}>Start Your Trading Journey</h1>
          <p style={{ color: '#848e9c', fontSize: '15px', lineHeight: '1.7' }}>
            Join your class and practice crypto trading with real market data and zero financial risk.
          </p>
          <div style={styles.stepsBox}>
            {[
              { n: '1', t: 'Create your account', s: 'Free, no credit card needed' },
              { n: '2', t: 'Get $10,000 virtual USDT', s: 'Instantly in your demo wallet' },
              { n: '3', t: 'Trade 500+ cryptocurrencies', s: 'Live prices from Binance' },
              { n: '4', t: 'Compete with classmates', s: 'Live leaderboard rankings' },
            ].map((s, i) => (
              <div key={i} style={styles.stepItem}>
                <div style={styles.stepNum}>{s.n}</div>
                <div>
                  <div style={{ color: '#eaecef', fontSize: '14px', fontWeight: '600' }}>{s.t}</div>
                  <div style={{ color: '#474d57', fontSize: '12px', marginTop: '2px' }}>{s.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={styles.cardWrap}>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '26px', color: '#f0b90b' }}>₿</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#f0b90b' }}>CryptoClass</span>
            </div>
          )}

          {isMobile && (
            <Link to="/login" style={{ color: '#848e9c', textDecoration: 'none', fontSize: '13px', marginBottom: '4px' }}>
              ← Back to Sign In
            </Link>
          )}

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Create Account</h2>
            <p style={styles.cardSub}>Start with $10,000 virtual funds</p>

            {/* Progress dots */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f0b90b' }} />
              <div style={{ flex: 1, height: '2px', background: name && email ? '#f0b90b' : '#2b3139', transition: 'background 0.3s' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: name && email ? '#f0b90b' : '#2b3139', transition: 'background 0.3s' }} />
              <div style={{ flex: 1, height: '2px', background: password && confirm === password ? '#f0b90b' : '#2b3139', transition: 'background 0.3s' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: password && confirm === password ? '#f0b90b' : '#2b3139', transition: 'background 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span style={{ color: '#f0b90b', fontSize: '10px' }}>Details</span>
              <span style={{ color: name && email ? '#f0b90b' : '#474d57', fontSize: '10px' }}>Account</span>
              <span style={{ color: password && confirm === password ? '#f0b90b' : '#474d57', fontSize: '10px' }}>Done</span>
            </div>

            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>👤</span>
                <input style={styles.input} type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉</span>
                <input style={styles.input} type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔒</span>
                <input style={styles.input} type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                <button style={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁'}</button>
              </div>
              {password && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
                  <div style={{ flex: 1, height: '3px', background: '#2b3139', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '2px', transition: 'all 0.3s', width: password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%', background: password.length < 6 ? '#f6465d' : password.length < 10 ? '#f0b90b' : '#0ecb81' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#848e9c' }}>{password.length < 6 ? 'Weak' : password.length < 10 ? 'Good' : 'Strong'}</span>
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={{ ...styles.inputWrap, borderColor: confirm && confirm !== password ? '#f6465d' : confirm && confirm === password ? '#0ecb81' : '#2b3139' }}>
                <span style={styles.inputIcon}>🔒</span>
                <input style={styles.input} type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                {confirm && <span style={{ padding: '0 10px', fontSize: '14px' }}>{confirm === password ? '✅' : '❌'}</span>}
              </div>
            </div>

            <button style={{ ...styles.registerBtn, opacity: loading ? 0.7 : 1 }} onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating account...' : '🚀 Create Account & Get $10,000'}
            </button>

            <div style={{ color: '#474d57', fontSize: '11px', textAlign: 'center', lineHeight: '1.5', marginBottom: '12px' }}>
              Demo platform for educational purposes only. No real money involved.
            </div>

            <div style={{ color: '#848e9c', fontSize: '13px', textAlign: 'center' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#f0b90b', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  gridBg: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(rgba(240,185,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(240,185,11,0.03) 1px, transparent 1px)`, backgroundSize: '50px 50px', zIndex: 0 },
  tickerWrap: { background: '#161a1e', borderBottom: '1px solid #2b3139', overflow: 'hidden', height: '34px', display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative', flexShrink: 0 },
  tickerTrack: { display: 'inline-flex', gap: '32px', whiteSpace: 'nowrap', animation: 'tickerScroll 25s linear infinite', paddingLeft: '100%' },
  mainWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', zIndex: 1, position: 'relative', gap: '60px', maxWidth: '1100px', margin: '0 auto', width: '100%' },
  leftPanel: { flex: 1, flexDirection: 'column', gap: '18px', minWidth: 0 },
  backLink: { color: '#848e9c', textDecoration: 'none', fontSize: '14px' },
  tagline: { fontSize: '34px', fontWeight: '800', color: '#eaecef', lineHeight: '1.2', margin: 0, background: 'linear-gradient(135deg, #eaecef 60%, #f0b90b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  stepsBox: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' },
  stepItem: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  stepNum: { width: '24px', height: '24px', borderRadius: '50%', background: '#f0b90b', color: '#1e2329', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
  cardWrap: { width: '100%', maxWidth: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  card: { background: 'rgba(30,35,41,0.97)', border: '1px solid #2b3139', borderRadius: '20px', padding: '28px', width: '100%', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  cardTitle: { fontSize: '22px', fontWeight: '700', color: '#eaecef', margin: '0 0 4px 0' },
  cardSub: { color: '#848e9c', fontSize: '13px', marginBottom: '16px' },
  errorBox: { background: '#2d1318', border: '1px solid #f6465d', color: '#f6465d', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' },
  inputGroup: { marginBottom: '12px' },
  label: { display: 'block', color: '#848e9c', fontSize: '12px', fontWeight: '500', marginBottom: '5px' },
  inputWrap: { display: 'flex', alignItems: 'center', background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '10px', overflow: 'hidden' },
  inputIcon: { padding: '0 10px', fontSize: '14px', color: '#474d57' },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#eaecef', fontSize: '14px', padding: '12px 0' },
  showPassBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 10px', fontSize: '14px' },
  registerBtn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f0b90b, #f8d12f)', border: 'none', borderRadius: '10px', color: '#1e2329', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '6px', marginBottom: '12px' },
};