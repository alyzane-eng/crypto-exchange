import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [prices, setPrices] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTicker = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/prices/top');
      setPrices(res.data.slice(0, 8));
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/markets', label: 'Markets', icon: '🌐' },
    { path: '/wallet', label: 'Wallet', icon: '💼' },
    { path: '/history', label: 'History', icon: '📋' },
    { path: '/forum', label: 'Forum', icon: '💬' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <>
      {/* Ticker tape — hidden on mobile */}
      {!isMobile && (
        <div style={styles.ticker}>
          <div style={styles.tickerInner}>
            {[...prices, ...prices].map((p, i) => (
              <span key={i} style={styles.tickerItem}>
                <span style={styles.tickerSymbol}>{p.symbol}</span>
                <span style={styles.tickerPrice}>${parseFloat(p.price).toLocaleString()}</span>
                <span style={{ color: parseFloat(p.change) >= 0 ? '#0ecb81' : '#f6465d', fontSize: '12px', fontWeight: '500' }}>
                  {parseFloat(p.change) >= 0 ? '▲' : '▼'}{Math.abs(p.change)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          {/* Hamburger menu — mobile only */}
          {isMobile && (
            <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}

          <div style={styles.logo} onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
            <span style={styles.logoIcon}>₿</span>
            {!isMobile && <span style={styles.logoText}>CryptoClass</span>}
          </div>

          {/* Desktop nav links */}
          {!isMobile && (
            <div style={styles.navLinks}>
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...styles.navLink,
                    color: isActive(link.path) ? '#f0b90b' : '#eaecef',
                    borderBottom: isActive(link.path) ? '2px solid #f0b90b' : '2px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={styles.navRight}>
          {isMobile && (
            <div style={styles.logoMobile} onClick={() => navigate('/dashboard')}>
              <span style={styles.logoIcon}>₿</span>
              <span style={styles.logoText}>CryptoClass</span>
            </div>
          )}
          {!isMobile && (
            <>
              <div style={styles.userBadge}>
                <div style={styles.userAvatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={styles.userName}>{user?.name}</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </>
          )}
          {isMobile && (
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {isMobile && menuOpen && (
        <>
          <div style={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
          <div style={styles.mobileMenu}>
            <div style={styles.mobileMenuHeader}>
              <div style={styles.mobileUserInfo}>
                <div style={styles.mobileAvatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#eaecef', fontWeight: '600', fontSize: '15px' }}>{user?.name}</div>
                  <div style={{ color: '#474d57', fontSize: '12px' }}>{user?.email}</div>
                </div>
              </div>
            </div>

            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  ...styles.mobileNavLink,
                  background: isActive(link.path) ? '#f0b90b15' : 'transparent',
                  color: isActive(link.path) ? '#f0b90b' : '#eaecef',
                  borderLeft: isActive(link.path) ? '3px solid #f0b90b' : '3px solid transparent',
                }}
                onClick={() => setMenuOpen(false)}
              >
                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            <button style={styles.mobileLogout} onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </>
      )}

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <div style={styles.bottomNav}>
          {[
            { path: '/dashboard', icon: '📊', label: 'Home' },
            { path: '/markets', icon: '🌐', label: 'Markets' },
            { path: '/trade/BTC', icon: '₿', label: 'Trade', special: true },
            { path: '/wallet', icon: '💼', label: 'Wallet' },
            { path: '/leaderboard', icon: '🏆', label: 'Rank' },
          ].map(item => (
            <button
              key={item.path}
              style={{
                ...styles.bottomNavItem,
                ...(item.special ? styles.bottomNavSpecial : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={{
                fontSize: item.special ? '22px' : '20px',
                color: isActive(item.path) ? '#f0b90b' : item.special ? '#1e2329' : '#848e9c',
              }}>
                {item.icon}
              </span>
              {!item.special && (
                <span style={{
                  fontSize: '10px',
                  color: isActive(item.path) ? '#f0b90b' : '#848e9c',
                  marginTop: '2px',
                }}>
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const styles = {
  ticker: {
    background: '#161a1e',
    borderBottom: '1px solid #2b3139',
    padding: '6px 0',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  tickerInner: {
    display: 'inline-flex',
    gap: '32px',
    padding: '0 16px',
    animation: 'tickerScroll 30s linear infinite',
  },
  tickerItem: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  tickerSymbol: { color: '#eaecef', fontSize: '12px', fontWeight: '600' },
  tickerPrice: { color: '#848e9c', fontSize: '12px' },
  nav: {
    background: '#1e2329',
    borderBottom: '1px solid #2b3139',
    padding: '0 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'Segoe UI', sans-serif",
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  hamburger: {
    background: 'transparent',
    border: 'none',
    color: '#eaecef',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoIcon: { fontSize: '22px', color: '#f0b90b' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#f0b90b' },
  logoMobile: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  navLinks: { display: 'flex', gap: '4px' },
  navLink: {
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '0 12px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f0b90b',
    color: '#1e2329',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  userName: { color: '#eaecef', fontSize: '14px', fontWeight: '500' },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #f0b90b',
    color: '#f0b90b',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  menuOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 200,
  },
  mobileMenu: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '280px',
    height: '100vh',
    background: '#1e2329',
    borderRight: '1px solid #2b3139',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  mobileMenuHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #2b3139',
    background: '#161a1e',
  },
  mobileUserInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  mobileAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#f0b90b',
    color: '#1e2329',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
  },
  mobileNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 20px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.15s',
    borderBottom: '1px solid #2b313915',
  },
  mobileLogout: {
    margin: '16px',
    padding: '12px',
    background: '#2d1318',
    border: '1px solid #f6465d33',
    borderRadius: '8px',
    color: '#f6465d',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#1e2329',
    borderTop: '1px solid #2b3139',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
    zIndex: 100,
    height: '60px',
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 12px',
    gap: '2px',
  },
  bottomNavSpecial: {
    background: '#f0b90b',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    padding: '0',
  },
};