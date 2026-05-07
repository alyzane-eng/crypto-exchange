import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Admin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundAction, setFundAction] = useState('add');
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [studentTrades, setStudentTrades] = useState([]);
  const [showTrades, setShowTrades] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
if (!user?.is_admin) {
  navigate('/dashboard');
  return;
}
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('https://crypto-exchange-production-12cd.up.railway.app/api/admin/students', {
        headers: { 'x-admin-key': 'cryptoclass-admin-2024' }
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFunds = async (studentId) => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    try {
      await axios.post('https://crypto-exchange-production-12cd.up.railway.app/api/admin/funds', {
        userId: studentId,
        amount: parseFloat(fundAmount),
        action: fundAction,
      }, { headers: { 'x-admin-key': 'cryptoclass-admin-2024' } });
      setMessage({ type: 'success', text: `Funds ${fundAction === 'add' ? 'added' : 'removed'} successfully!` });
      setFundAmount('');
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed' });
    }
  };

  const handleReset = async (studentId, name) => {
    if (!window.confirm(`Reset ${name}'s account to $10,000? All trades will be deleted.`)) return;
    try {
      await axios.post('https://crypto-exchange-production-12cd.up.railway.app/api/admin/reset', {
        userId: studentId,
      }, { headers: { 'x-admin-key': 'cryptoclass-admin-2024' } });
      setMessage({ type: 'success', text: `${name}'s account has been reset to $10,000` });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: 'Reset failed' });
    }
  };

  const handleViewTrades = async (student) => {
    try {
      const res = await axios.get(`https://crypto-exchange-production-12cd.up.railway.app/api/trades/${student.id}`);
      setStudentTrades(res.data);
      setSelected(student);
      setShowTrades(true);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Cash Balance', 'Crypto Value', 'Total Value', 'P&L', 'P&L%'];
    const rows = students.map(s => [
      s.name, s.email,
      parseFloat(s.usdt_balance || 0).toFixed(2),
      parseFloat(s.crypto_value || 0).toFixed(2),
      parseFloat(s.total_value || 0).toFixed(2),
      parseFloat(s.pnl || 0).toFixed(2),
      parseFloat(s.pnl_percent || 0).toFixed(2) + '%',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = students.length;
  const avgPortfolio = students.length
    ? (students.reduce((sum, s) => sum + parseFloat(s.total_value || 0), 0) / students.length).toFixed(2)
    : '0';
  const topStudent = students.reduce((top, s) =>
    parseFloat(s.total_value || 0) > parseFloat(top?.total_value || 0) ? s : top, null);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Teacher Admin Panel</h1>
            <p style={styles.subtitle}>Manage student accounts and monitor performance</p>
          </div>
          <button style={styles.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            ...styles.msgBox,
            background: message.type === 'success' ? '#0d2818' : '#2d1318',
            border: `1px solid ${message.type === 'success' ? '#0ecb81' : '#f6465d'}`,
            color: message.type === 'success' ? '#0ecb81' : '#f6465d',
          }}>
            {message.text}
            <button style={styles.msgClose} onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statVal, color: '#f0b90b' }}>${avgPortfolio}</div>
            <div style={styles.statLabel}>Avg Portfolio Value</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statVal, color: '#0ecb81' }}>
              {topStudent?.name || '—'}
            </div>
            <div style={styles.statLabel}>Top Performer</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statVal, color: '#848e9c' }}>$10,000</div>
            <div style={styles.statLabel}>Starting Balance</div>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={styles.countBadge}>{filtered.length} students</span>
        </div>

        {/* Student Cards */}
        {loading ? (
          <div style={styles.loading}>Loading students...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No students registered yet.</div>
        ) : (
          <div style={styles.studentGrid}>
            {filtered.map(student => {
              const pnl = parseFloat(student.pnl || 0);
              const isUp = pnl >= 0;
              return (
                <div key={student.id} style={styles.studentCard}>

                  {/* Student header */}
                  <div style={styles.cardHead}>
                    <div style={styles.avatar}>
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.studentInfo}>
                      <div style={styles.studentName}>{student.name}</div>
                      <div style={styles.studentEmail}>{student.email}</div>
                    </div>
                    <div style={{
                      ...styles.pnlBadge,
                      background: isUp ? '#0d2818' : '#2d1318',
                      color: isUp ? '#0ecb81' : '#f6465d',
                    }}>
                      {isUp ? '+' : ''}{parseFloat(student.pnl_percent || 0).toFixed(2)}%
                    </div>
                  </div>

                  {/* Portfolio stats */}
                  <div style={styles.portfolioStats}>
                    <div style={styles.pStat}>
                      <span style={styles.pStatLabel}>Total Value</span>
                      <span style={styles.pStatVal}>
                        ${parseFloat(student.total_value || 0).toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.pStat}>
                      <span style={styles.pStatLabel}>Cash (USDT)</span>
                      <span style={styles.pStatVal}>
                        ${parseFloat(student.usdt_balance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.pStat}>
                      <span style={styles.pStatLabel}>P&L</span>
                      <span style={{ ...styles.pStatVal, color: isUp ? '#0ecb81' : '#f6465d' }}>
                        {isUp ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Fund management */}
                  <div style={styles.fundRow}>
                    <select
                      style={styles.fundSelect}
                      value={fundAction}
                      onChange={e => setFundAction(e.target.value)}
                    >
                      <option value="add">Add Funds</option>
                      <option value="remove">Remove Funds</option>
                    </select>
                    <input
                      style={styles.fundInput}
                      type="number"
                      placeholder="Amount (USDT)"
                      value={selected?.id === student.id ? fundAmount : ''}
                      onChange={e => {
                        setSelected(student);
                        setFundAmount(e.target.value);
                      }}
                    />
                    <button
                      style={styles.fundBtn}
                      onClick={() => handleFunds(student.id)}
                    >
                      Apply
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={styles.actionRow}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => handleViewTrades(student)}
                    >
                      View Trades
                    </button>
                    <button
                      style={styles.resetBtn}
                      onClick={() => handleReset(student.id, student.name)}
                    >
                      Reset Account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trade History Modal */}
        {showTrades && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {selected?.name}'s Trade History
                </h2>
                <button style={styles.modalClose} onClick={() => setShowTrades(false)}>✕</button>
              </div>
              {studentTrades.length === 0 ? (
                <div style={styles.empty}>No trades yet.</div>
              ) : (
                <div style={styles.tradeTable}>
                  <div style={styles.tradeHeader}>
                    <span>Date</span>
                    <span>Type</span>
                    <span>Coin</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {studentTrades.map((t, i) => (
                    <div key={i} style={styles.tradeRow}>
                      <span style={{ color: '#474d57', fontSize: '11px' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                      <span style={{
                        color: t.type === 'buy' ? '#0ecb81' : '#f6465d',
                        fontWeight: '700', fontSize: '11px'
                      }}>
                        {t.type.toUpperCase()}
                      </span>
                      <span style={{ color: '#eaecef', fontWeight: '600' }}>{t.symbol}</span>
                      <span style={{ color: '#848e9c' }}>{parseFloat(t.quantity).toFixed(4)}</span>
                      <span style={{ color: '#848e9c' }}>${parseFloat(t.price).toFixed(4)}</span>
                      <span style={{ color: '#f0b90b', fontWeight: '600' }}>
                        ${parseFloat(t.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#eaecef', margin: 0 },
  subtitle: { color: '#848e9c', fontSize: '14px', marginTop: '4px' },
  exportBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  msgBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  msgClose: { background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  statCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  statVal: { fontSize: '22px', fontWeight: '700', color: '#eaecef', marginBottom: '4px' },
  statLabel: { fontSize: '12px', color: '#848e9c' },
  searchRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, background: '#1e2329', border: '1px solid #2b3139', borderRadius: '8px', color: '#eaecef', padding: '10px 16px', fontSize: '14px', outline: 'none' },
  countBadge: { background: '#2b3139', color: '#848e9c', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', whiteSpace: 'nowrap' },
  loading: { textAlign: 'center', padding: '60px', color: '#848e9c' },
  empty: { textAlign: 'center', padding: '40px', color: '#848e9c', background: '#1e2329', borderRadius: '12px' },
  studentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' },
  studentCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#f0b90b', color: '#1e2329', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: '15px', fontWeight: '600', color: '#eaecef' },
  studentEmail: { fontSize: '12px', color: '#474d57', marginTop: '2px' },
  pnlBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' },
  portfolioStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#161a1e', borderRadius: '8px', padding: '12px' },
  pStat: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pStatLabel: { fontSize: '10px', color: '#474d57' },
  pStatVal: { fontSize: '13px', fontWeight: '600', color: '#eaecef' },
  fundRow: { display: 'flex', gap: '6px' },
  fundSelect: { background: '#2b3139', border: '1px solid #2b3139', borderRadius: '6px', color: '#eaecef', padding: '7px 8px', fontSize: '12px', outline: 'none', cursor: 'pointer' },
  fundInput: { flex: 1, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '6px', color: '#eaecef', padding: '7px 10px', fontSize: '13px', outline: 'none' },
  fundBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  actionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  viewBtn: { background: 'transparent', border: '1px solid #2b3139', borderRadius: '6px', color: '#848e9c', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  resetBtn: { background: '#2d1318', border: '1px solid #f6465d33', borderRadius: '6px', color: '#f6465d', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: '#eaecef', margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: '#848e9c', fontSize: '20px', cursor: 'pointer' },
  tradeTable: { display: 'flex', flexDirection: 'column', gap: '2px' },
  tradeHeader: { display: 'grid', gridTemplateColumns: '1fr 0.5fr 1fr 1fr 1fr 1fr', padding: '8px 12px', background: '#161a1e', borderRadius: '6px', fontSize: '11px', color: '#474d57', marginBottom: '4px' },
  tradeRow: { display: 'grid', gridTemplateColumns: '1fr 0.5fr 1fr 1fr 1fr 1fr', padding: '10px 12px', background: '#161a1e', borderRadius: '6px', fontSize: '12px', alignItems: 'center' },
};