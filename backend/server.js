const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.connect((err, client, release) => {
  if (err) { console.error('DATABASE CONNECTION FAILED:', err.message); }
  else { console.log('Database connected successfully!'); release(); }
});

const db = { query: (text, params) => pool.query(text, params) };
let allCoinsCache = [];
let lastCoinFetch = 0;

const FALLBACK_PRICES = [
  { symbol: 'BTC', price: '67000.00', change: '1.20' },
  { symbol: 'ETH', price: '3500.00', change: '0.80' },
  { symbol: 'BNB', price: '580.00', change: '0.50' },
  { symbol: 'SOL', price: '170.00', change: '2.10' },
  { symbol: 'ADA', price: '0.45', change: '-0.30' },
  { symbol: 'DOGE', price: '0.12', change: '1.50' },
  { symbol: 'XRP', price: '0.52', change: '0.90' },
  { symbol: 'MATIC', price: '0.85', change: '-0.20' },
];

const axiosInstance = axios.create({ timeout: 8000 });

// ─── ADMIN MIDDLEWARE ─────────────────────────────────────────────────────────
const adminAuth = (req, res, next) => {
  if (req.headers['x-admin-key'] !== 'cryptoclass-admin-2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ─── PRICES TOP ──────────────────────────────────────────────────────────────
app.get('/api/prices/top', async (req, res) => {
  try {
    const symbols = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','ADAUSDT','DOGEUSDT','XRPUSDT','MATICUSDT'];
    const requests = symbols.map(s =>
      axiosInstance.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`)
    );
    const responses = await Promise.all(requests);
    const prices = responses.map(r => ({
      symbol: r.data.symbol.replace('USDT',''),
      price: parseFloat(r.data.lastPrice).toFixed(2),
      change: parseFloat(r.data.priceChangePercent).toFixed(2),
    }));
    res.json(prices);
  } catch (err) {
    console.log('Binance unreachable, using fallback prices');
    res.json(FALLBACK_PRICES);
  }
});

// ─── ALL MARKETS ──────────────────────────────────────────────────────────────
app.get('/api/markets', async (req, res) => {
  try {
    const now = Date.now();
    if (allCoinsCache.length > 0 && now - lastCoinFetch < 30000) {
      return res.json(allCoinsCache);
    }
    const response = await axiosInstance.get('https://api.binance.com/api/v3/ticker/24hr');
    const coins = response.data
      .filter(c => c.symbol.endsWith('USDT') && parseFloat(c.lastPrice) > 0)
      .map(c => ({
        symbol: c.symbol.replace('USDT', ''),
        fullSymbol: c.symbol,
        price: parseFloat(c.lastPrice).toFixed(6),
        change: parseFloat(c.priceChangePercent).toFixed(2),
        high: parseFloat(c.highPrice).toFixed(6),
        low: parseFloat(c.lowPrice).toFixed(6),
        volume: parseFloat(c.quoteVolume).toFixed(0),
        trades: c.count,
      }))
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
    allCoinsCache = coins;
    lastCoinFetch = now;
    res.json(coins);
  } catch (err) {
    console.log('Markets fallback');
    res.json(FALLBACK_PRICES.map(p => ({
      ...p,
      fullSymbol: p.symbol + 'USDT',
      high: p.price,
      low: p.price,
      volume: '1000000',
      trades: 1000,
    })));
  }
});

// ─── PRICES ───────────────────────────────────────────────────────────────────
app.get('/api/prices', async (req, res) => {
  try {
    const symbols = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','ADAUSDT','DOGEUSDT','XRPUSDT','MATICUSDT'];
    const requests = symbols.map(s =>
      axiosInstance.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`)
    );
    const responses = await Promise.all(requests);
    const prices = responses.map(r => ({
      symbol: r.data.symbol.replace('USDT',''),
      price: parseFloat(r.data.lastPrice).toFixed(2),
      change: parseFloat(r.data.priceChangePercent).toFixed(2),
      high: parseFloat(r.data.highPrice).toFixed(2),
      low: parseFloat(r.data.lowPrice).toFixed(2),
      volume: parseFloat(r.data.volume).toFixed(0)
    }));
    res.json(prices);
  } catch (err) {
    res.json(FALLBACK_PRICES.map(p => ({ ...p, high: p.price, low: p.price, volume: '1000000' })));
  }
});

// ─── CANDLES ──────────────────────────────────────────────────────────────────
app.get('/api/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || '1h';
    const limit = req.query.limit || 200;
    const response = await axiosInstance.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
    );
    const candles = response.data.map(c => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
    res.json(candles);
  } catch (err) {
    res.json([]);
  }
});

// ─── SINGLE PRICE ─────────────────────────────────────────────────────────────
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const response = await axiosInstance.get(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${req.params.symbol}USDT`
    );
    const d = response.data;
    res.json({
      symbol: req.params.symbol,
      price: parseFloat(d.lastPrice),
      change: parseFloat(d.priceChangePercent).toFixed(2),
      high: parseFloat(d.highPrice),
      low: parseFloat(d.lowPrice),
      volume: parseFloat(d.quoteVolume).toFixed(0),
      open: parseFloat(d.openPrice),
    });
  } catch (err) {
    const fallback = FALLBACK_PRICES.find(p => p.symbol === req.params.symbol) || FALLBACK_PRICES[0];
    res.json({ symbol: req.params.symbol, price: parseFloat(fallback.price), change: fallback.change, high: parseFloat(fallback.price), low: parseFloat(fallback.price), volume: '1000000', open: parseFloat(fallback.price) });
  }
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, name, password } = req.body;
    console.log('Register attempt:', email);
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already registered' });
    }
    const userResult = await client.query(
      'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING *',
      [email, name, password]
    );
    const user = userResult.rows[0];
    await client.query('INSERT INTO wallets (user_id, usdt_balance) VALUES ($1, $2)', [user.id, 10000]);
    await client.query('COMMIT');
    console.log('Registered:', user.name);
    res.json({ success: true, user });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const userResult = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email' });
    }
    const user = userResult.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    let walletResult = await client.query('SELECT * FROM wallets WHERE user_id=$1', [user.id]);
    let wallet;
    if (walletResult.rows.length === 0) {
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, usdt_balance) VALUES ($1, $2) RETURNING *',
        [user.id, 10000]
      );
      wallet = newWallet.rows[0];
    } else {
      wallet = walletResult.rows[0];
    }
    console.log('Login OK:', user.name);
    res.json({ success: true, user: { ...user, is_admin: user.is_admin }, wallet });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const walletResult = await db.query('SELECT * FROM wallets WHERE user_id=$1', [userId]);
    const holdingsResult = await db.query('SELECT * FROM holdings WHERE user_id=$1', [userId]);
    let wallet = walletResult.rows[0];
    if (!wallet) {
      const newWallet = await db.query(
        'INSERT INTO wallets (user_id, usdt_balance) VALUES ($1, $2) RETURNING *',
        [userId, 10000]
      );
      wallet = newWallet.rows[0];
    }
    res.json({ wallet, holdings: holdingsResult.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── BUY ──────────────────────────────────────────────────────────────────────
app.post('/api/trade/buy', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, symbol, quantity } = req.body;
    let price;
    try {
      const priceRes = await axiosInstance.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
      price = parseFloat(priceRes.data.price);
    } catch {
      const fallback = FALLBACK_PRICES.find(p => p.symbol === symbol) || FALLBACK_PRICES[0];
      price = parseFloat(fallback.price);
    }
    const total = price * parseFloat(quantity);
    await client.query('BEGIN');
    const walletResult = await client.query('SELECT * FROM wallets WHERE user_id=$1', [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet || parseFloat(wallet.usdt_balance) < total) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    await client.query('UPDATE wallets SET usdt_balance=usdt_balance-$1 WHERE user_id=$2', [total, userId]);
    const existingResult = await client.query('SELECT * FROM holdings WHERE user_id=$1 AND symbol=$2', [userId, symbol]);
    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      const newQty = parseFloat(existing.quantity) + parseFloat(quantity);
      const newAvg = ((parseFloat(existing.avg_buy_price) * parseFloat(existing.quantity)) + (price * parseFloat(quantity))) / newQty;
      await client.query('UPDATE holdings SET quantity=$1, avg_buy_price=$2 WHERE id=$3', [newQty, newAvg, existing.id]);
    } else {
      await client.query('INSERT INTO holdings (user_id, symbol, quantity, avg_buy_price) VALUES ($1,$2,$3,$4)', [userId, symbol, quantity, price]);
    }
    await client.query('INSERT INTO trades (user_id, symbol, type, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)', [userId, symbol, 'buy', quantity, price, total]);
    await client.query('COMMIT');
    res.json({ success: true, message: `Bought ${quantity} ${symbol} at $${price.toFixed(4)}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── SELL ─────────────────────────────────────────────────────────────────────
app.post('/api/trade/sell', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, symbol, quantity } = req.body;
    const holdingResult = await client.query('SELECT * FROM holdings WHERE user_id=$1 AND symbol=$2', [userId, symbol]);
    const holding = holdingResult.rows[0];
    if (!holding || parseFloat(holding.quantity) < parseFloat(quantity)) {
      return res.status(400).json({ error: 'Insufficient holdings' });
    }
    let price;
    try {
      const priceRes = await axiosInstance.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
      price = parseFloat(priceRes.data.price);
    } catch {
      const fallback = FALLBACK_PRICES.find(p => p.symbol === symbol) || FALLBACK_PRICES[0];
      price = parseFloat(fallback.price);
    }
    const total = price * parseFloat(quantity);
    await client.query('BEGIN');
    await client.query('UPDATE wallets SET usdt_balance=usdt_balance+$1 WHERE user_id=$2', [total, userId]);
    const newQty = parseFloat(holding.quantity) - parseFloat(quantity);
    if (newQty <= 0.000001) {
      await client.query('DELETE FROM holdings WHERE id=$1', [holding.id]);
    } else {
      await client.query('UPDATE holdings SET quantity=$1 WHERE id=$2', [newQty, holding.id]);
    }
    await client.query('INSERT INTO trades (user_id, symbol, type, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)', [userId, symbol, 'sell', quantity, price, total]);
    await client.query('COMMIT');
    res.json({ success: true, message: `Sold ${quantity} ${symbol} at $${price.toFixed(4)}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  try {
    const usersResult = await db.query('SELECT id, name, email FROM users');
    const walletsResult = await db.query('SELECT * FROM wallets');
    const holdingsResult = await db.query('SELECT * FROM holdings');
    const symbols = [...new Set(holdingsResult.rows.map(h => h.symbol))];
    const prices = {};
    for (const sym of symbols) {
      try {
        const r = await axiosInstance.get(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
        prices[sym] = parseFloat(r.data.price);
      } catch {
        const fallback = FALLBACK_PRICES.find(p => p.symbol === sym);
        prices[sym] = fallback ? parseFloat(fallback.price) : 0;
      }
    }
    const leaderboard = usersResult.rows.map(user => {
      const wallet = walletsResult.rows.find(w => w.user_id === user.id);
      const userHoldings = holdingsResult.rows.filter(h => h.user_id === user.id);
      const cryptoValue = userHoldings.reduce((sum, h) => sum + (parseFloat(h.quantity) * (prices[h.symbol] || 0)), 0);
      const totalValue = parseFloat(wallet?.usdt_balance || 0) + cryptoValue;
      const pnl = totalValue - 10000;
      return { name: user.name, email: user.email, totalValue: totalValue.toFixed(2), pnl: pnl.toFixed(2), pnlPercent: ((pnl / 10000) * 100).toFixed(2) };
    });
    leaderboard.sort((a, b) => b.totalValue - a.totalValue);
    res.json(leaderboard);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── TRADE HISTORY ────────────────────────────────────────────────────────────
app.get('/api/trades/:userId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM trades WHERE user_id=$1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN — GET ALL STUDENTS ─────────────────────────────────────────────────
app.get('/api/admin/students', adminAuth, async (req, res) => {
  try {
    const usersResult = await db.query('SELECT id, name, email FROM users');
    const walletsResult = await db.query('SELECT * FROM wallets');
    const holdingsResult = await db.query('SELECT * FROM holdings');
    const symbols = [...new Set(holdingsResult.rows.map(h => h.symbol))];
    const prices = {};
    for (const sym of symbols) {
      try {
        const r = await axiosInstance.get(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
        prices[sym] = parseFloat(r.data.price);
      } catch {
        const fallback = FALLBACK_PRICES.find(p => p.symbol === sym);
        prices[sym] = fallback ? parseFloat(fallback.price) : 0;
      }
    }
    const students = usersResult.rows.map(user => {
      const wallet = walletsResult.rows.find(w => w.user_id === user.id);
      const userHoldings = holdingsResult.rows.filter(h => h.user_id === user.id);
      const cryptoValue = userHoldings.reduce((sum, h) => sum + (parseFloat(h.quantity) * (prices[h.symbol] || 0)), 0);
      const usdtBalance = parseFloat(wallet?.usdt_balance || 0);
      const totalValue = usdtBalance + cryptoValue;
      const pnl = totalValue - 10000;
      return { id: user.id, name: user.name, email: user.email, usdt_balance: usdtBalance.toFixed(2), crypto_value: cryptoValue.toFixed(2), total_value: totalValue.toFixed(2), pnl: pnl.toFixed(2), pnl_percent: ((pnl / 10000) * 100).toFixed(2) };
    });
    students.sort((a, b) => parseFloat(b.total_value) - parseFloat(a.total_value));
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN — ADD/REMOVE FUNDS ─────────────────────────────────────────────────
app.post('/api/admin/funds', adminAuth, async (req, res) => {
  try {
    const { userId, amount, action } = req.body;
    const walletResult = await db.query('SELECT * FROM wallets WHERE user_id=$1', [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    let newBalance;
    if (action === 'add') {
      newBalance = parseFloat(wallet.usdt_balance) + parseFloat(amount);
    } else {
      newBalance = parseFloat(wallet.usdt_balance) - parseFloat(amount);
      if (newBalance < 0) return res.status(400).json({ error: 'Cannot remove more than balance' });
    }
    await db.query('UPDATE wallets SET usdt_balance=$1 WHERE user_id=$2', [newBalance, userId]);
    res.json({ success: true, newBalance: newBalance.toFixed(2) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN — RESET STUDENT ────────────────────────────────────────────────────
app.post('/api/admin/reset', adminAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.body;
    await client.query('BEGIN');
    await client.query('DELETE FROM trades WHERE user_id=$1', [userId]);
    await client.query('DELETE FROM holdings WHERE user_id=$1', [userId]);
    await client.query('UPDATE wallets SET usdt_balance=10000 WHERE user_id=$1', [userId]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── FORUM ────────────────────────────────────────────────────────────────────
app.get('/api/forum/posts', async (req, res) => {
  try {
    const category = req.query.category;
    let query = 'SELECT * FROM posts ORDER BY created_at DESC';
    let params = [];
    if (category && category !== 'all') {
      query = 'SELECT * FROM posts WHERE category=$1 ORDER BY created_at DESC';
      params = [category];
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/forum/posts', async (req, res) => {
  try {
    const { userId, userName, category, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const result = await db.query(
      'INSERT INTO posts (user_id, user_name, category, title, content) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, userName, category, title, content]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/forum/posts/:id/like', async (req, res) => {
  try {
    const result = await db.query('UPDATE posts SET likes=likes+1 WHERE id=$1 RETURNING *', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/forum/posts/:id/comments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM comments WHERE post_id=$1 ORDER BY created_at ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/forum/posts/:id/comments', async (req, res) => {
  try {
    const { userId, userName, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const result = await db.query(
      'INSERT INTO comments (post_id, user_id, user_name, content) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, userId, userName, content]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) { res.status(500).json({ status: 'error', database: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));