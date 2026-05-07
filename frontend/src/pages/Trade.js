import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import Navbar from '../components/Navbar';

export default function Trade() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);
  const wsRef = useRef(null);

  const [coinData, setCoinData] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [holding, setHolding] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [inputMode, setInputMode] = useState('coin'); // 'coin' or 'usdt'
  const [orderType, setOrderType] = useState('buy');
  const [chartInterval, setChartInterval] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });
  const [indicator, setIndicator] = useState('none');
  const [trades, setTrades] = useState([]);

  const intervals = [
    { label: '1m', val: '1m' },
    { label: '5m', val: '5m' },
    { label: '15m', val: '15m' },
    { label: '1H', val: '1h' },
    { label: '4H', val: '4h' },
    { label: '1D', val: '1d' },
    { label: '1W', val: '1w' },
  ];

  // ─── Init Chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.remove();

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 420,
      layout: { background: { color: '#0b0e11' }, textColor: '#848e9c' },
      grid: { vertLines: { color: '#1a1f26' }, horzLines: { color: '#1a1f26' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2b3139' },
      timeScale: { borderColor: '#2b3139', timeVisible: true, secondsVisible: false },
    });

    candleSeries.current = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    volumeSeries.current = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartInstance.current = chart;

    const handleResize = () => {
      if (chartRef.current && chartInstance.current) {
        chartInstance.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  // ─── Load Candles ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCandles();
  }, [symbol, chartInterval]);

  // ─── Live WebSocket for candles ──────────────────────────────────────────
  useEffect(() => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_${chartInterval}`
    );

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const k = data.k;
      if (candleSeries.current) {
        candleSeries.current.update({
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });
      }
      if (volumeSeries.current) {
        volumeSeries.current.update({
          time: Math.floor(k.t / 1000),
          value: parseFloat(k.v),
          color: parseFloat(k.c) >= parseFloat(k.o) ? '#0ecb8133' : '#f6465d33',
        });
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [symbol, chartInterval]);

  // ─── Fetch price + order book ────────────────────────────────────────────
  useEffect(() => {
    fetchCoinData();
    fetchPortfolio();
    fetchOrderBook();
    fetchRecentTrades();
    const interval = setInterval(() => {
      fetchCoinData();
      fetchOrderBook();
      fetchRecentTrades();
    }, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchCandles = async () => {
    try {
      const res = await axios.get(
        `https://crypto-exchange-production-12cd.up.railway.app/api/candles/${symbol}?interval=${chartInterval}&limit=200`
      );
      if (candleSeries.current) candleSeries.current.setData(res.data);
      if (volumeSeries.current) {
        volumeSeries.current.setData(
          res.data.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? '#0ecb8133' : '#f6465d33',
          }))
        );
      }
    } catch (err) { console.error(err); }
  };

  const fetchCoinData = async () => {
    try {
      const res = await axios.get(`https://crypto-exchange-production-12cd.up.railway.app/api/price/${symbol}`);
      setCoinData(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrderBook = async () => {
    try {
      const res = await axios.get(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=8`
      );
      setOrderBook({
        asks: res.data.asks.map(a => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]) })),
        bids: res.data.bids.map(b => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]) })),
      });
    } catch (err) { console.error(err); }
  };

  const fetchRecentTrades = async () => {
    try {
      const res = await axios.get(
        `https://api.binance.com/api/v3/trades?symbol=${symbol}USDT&limit=10`
      );
      setTrades(res.data.map(t => ({
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        isBuyerMaker: t.isBuyerMaker,
        time: new Date(t.time).toLocaleTimeString(),
      })));
    } catch (err) { console.error(err); }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`https://crypto-exchange-production-12cd.up.railway.app/api/portfolio/${user.id}`);
      setWallet(res.data.wallet);
      setHolding(res.data.holdings.find(h => h.symbol === symbol) || null);
    } catch (err) { console.error(err); }
  };

  // ─── Trade Handler ───────────────────────────────────────────────────────
  const handleTrade = async () => {
    let qty = parseFloat(quantity);
    if (inputMode === 'usdt') {
      const price = parseFloat(coinData?.price || 0);
      if (price <= 0) { setMessage({ type: 'error', text: 'Price not available' }); return; }
      qty = parseFloat(usdtAmount) / price;
    }
    if (!qty || qty <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`https://crypto-exchange-production-12cd.up.railway.app/api/trade/${orderType}`, {
        userId: user.id, symbol, quantity: qty,
      });
      setMessage({ type: 'success', text: res.data.message });
      setQuantity('');
      setUsdtAmount('');
      await fetchPortfolio();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Trade failed' });
    }
    setLoading(false);
  };

  const handlePctClick = (pct) => {
    const p = pct / 100;
    const price = parseFloat(coinData?.price || 0);
    if (orderType === 'buy') {
      const bal = parseFloat(wallet?.usdt_balance || 0);
      if (inputMode === 'usdt') setUsdtAmount((bal * p).toFixed(2));
      else setQuantity(((bal * p) / price).toFixed(6));
    } else {
      const holdQty = parseFloat(holding?.quantity || 0);
      if (inputMode === 'coin') setQuantity((holdQty * p).toFixed(6));
      else setUsdtAmount((holdQty * p * price).toFixed(2));
    }
  };

  const formatPrice = (p) => {
    const n = parseFloat(p);
    if (!n) return '0';
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    if (n >= 0.01) return n.toFixed(6);
    return n.toFixed(8);
  };

  const totalCost = inputMode === 'usdt'
    ? parseFloat(usdtAmount || 0)
    : (parseFloat(quantity || 0) * parseFloat(coinData?.price || 0));

  const coinQty = inputMode === 'usdt'
    ? (parseFloat(usdtAmount || 0) / parseFloat(coinData?.price || 1)).toFixed(6)
    : quantity;

  const isUp = parseFloat(coinData?.change || 0) >= 0;

  return (
    <div style={styles.page}>
      <Navbar />

      {/* Coin info bar */}
      <div style={styles.coinBar}>
        <div style={styles.coinBarLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/markets')}>← Markets</button>
          <div style={styles.coinAvatar}>{symbol.charAt(0)}</div>
          <div>
            <div style={styles.coinPairText}>{symbol}/USDT</div>
            <div style={styles.coinSubText}>Perpetual</div>
          </div>
          <div style={{ color: isUp ? '#0ecb81' : '#f6465d', fontSize: '24px', fontWeight: '700', marginLeft: '12px' }}>
            ${formatPrice(coinData?.price)}
          </div>
          <div style={{ background: isUp ? '#0d2818' : '#2d1318', color: isUp ? '#0ecb81' : '#f6465d', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}>
            {isUp ? '+' : ''}{coinData?.change}%
          </div>
        </div>
        <div style={styles.coinStats}>
          {[
            { label: '24h High', val: '$' + formatPrice(coinData?.high), color: '#0ecb81' },
            { label: '24h Low', val: '$' + formatPrice(coinData?.low), color: '#f6465d' },
            { label: '24h Volume', val: '$' + parseFloat(coinData?.volume || 0).toLocaleString(), color: '#eaecef' },
            { label: 'Open', val: '$' + formatPrice(coinData?.open), color: '#eaecef' },
          ].map((s, i) => (
            <div key={i} style={styles.statItem}>
              <span style={styles.statLabel}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: '600', fontSize: '13px' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainLayout}>

        {/* LEFT — Chart + Order Book + Recent Trades */}
        <div style={styles.leftPanel}>

          {/* Interval + Indicator bar */}
          <div style={styles.chartToolbar}>
            <div style={styles.intervalGroup}>
              {intervals.map(iv => (
                <button
                  key={iv.val}
                  style={{
                    ...styles.ivBtn,
                    background: chartInterval === iv.val ? '#f0b90b' : 'transparent',
                    color: chartInterval === iv.val ? '#1e2329' : '#848e9c',
                  }}
                  onClick={() => setChartInterval(iv.val)}
                >
                  {iv.label}
                </button>
              ))}
            </div>
            <div style={styles.indicatorGroup}>
              <span style={styles.indLabel}>Indicators:</span>
              {['none', 'MA', 'EMA', 'BOLL', 'VOL'].map(ind => (
                <button
                  key={ind}
                  style={{
                    ...styles.indBtn,
                    background: indicator === ind ? '#2b3139' : 'transparent',
                    color: indicator === ind ? '#f0b90b' : '#848e9c',
                  }}
                  onClick={() => setIndicator(ind)}
                >
                  {ind === 'none' ? 'Default' : ind}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div style={styles.chartBox}>
            <div ref={chartRef} style={{ width: '100%', height: '420px' }} />
          </div>

          {/* Order Book + Recent Trades */}
          <div style={styles.bottomPanels}>

            {/* Order Book */}
            <div style={styles.orderBookPanel}>
              <div style={styles.panelTitle}>Order Book</div>
              <div style={styles.obHeader}>
                <span>Price (USDT)</span>
                <span>Amount ({symbol})</span>
                <span>Total (USDT)</span>
              </div>
              {/* Asks — reversed so highest ask is at top */}
              {[...orderBook.asks].reverse().map((ask, i) => (
                <div key={i} style={styles.askRow}>
                  <div style={styles.obBar} />
                  <span style={{ color: '#f6465d', fontWeight: '500' }}>{formatPrice(ask.price)}</span>
                  <span style={{ color: '#848e9c' }}>{ask.qty.toFixed(4)}</span>
                  <span style={{ color: '#848e9c' }}>{(ask.price * ask.qty).toFixed(2)}</span>
                </div>
              ))}

              {/* Spread */}
              <div style={styles.spreadRow}>
                <span style={{ color: isUp ? '#0ecb81' : '#f6465d', fontWeight: '700', fontSize: '15px' }}>
                  ${formatPrice(coinData?.price)}
                </span>
                <span style={{ color: '#848e9c', fontSize: '11px', marginLeft: '8px' }}>
                  {isUp ? '▲' : '▼'} {coinData?.change}%
                </span>
              </div>

              {/* Bids */}
              {orderBook.bids.map((bid, i) => (
                <div key={i} style={styles.bidRow}>
                  <div style={styles.obBarBid} />
                  <span style={{ color: '#0ecb81', fontWeight: '500' }}>{formatPrice(bid.price)}</span>
                  <span style={{ color: '#848e9c' }}>{bid.qty.toFixed(4)}</span>
                  <span style={{ color: '#848e9c' }}>{(bid.price * bid.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Recent Trades */}
            <div style={styles.recentTradesPanel}>
              <div style={styles.panelTitle}>Recent Trades</div>
              <div style={styles.obHeader}>
                <span>Price (USDT)</span>
                <span>Amount</span>
                <span>Time</span>
              </div>
              {trades.map((t, i) => (
                <div key={i} style={styles.tradeRow}>
                  <span style={{ color: t.isBuyerMaker ? '#f6465d' : '#0ecb81', fontWeight: '500' }}>
                    {formatPrice(t.price)}
                  </span>
                  <span style={{ color: '#848e9c' }}>{t.qty.toFixed(4)}</span>
                  <span style={{ color: '#474d57' }}>{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Order Panel */}
        <div style={styles.rightPanel}>

          {/* Balance */}
          <div style={styles.balanceBox}>
            <div style={styles.balRow}>
              <span style={styles.balLabel}>USDT Balance</span>
              <span style={styles.balVal}>${parseFloat(wallet?.usdt_balance || 0).toFixed(2)}</span>
            </div>
            {holding && (
              <div style={styles.balRow}>
                <span style={styles.balLabel}>{symbol} Balance</span>
                <span style={styles.balVal}>{parseFloat(holding.quantity).toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Buy / Sell tabs */}
          <div style={styles.buySellRow}>
            <button
              style={{ ...styles.buySellBtn, background: orderType === 'buy' ? '#0ecb81' : 'transparent', color: orderType === 'buy' ? '#fff' : '#848e9c', border: orderType === 'buy' ? 'none' : '1px solid #2b3139' }}
              onClick={() => setOrderType('buy')}
            >Buy</button>
            <button
              style={{ ...styles.buySellBtn, background: orderType === 'sell' ? '#f6465d' : 'transparent', color: orderType === 'sell' ? '#fff' : '#848e9c', border: orderType === 'sell' ? 'none' : '1px solid #2b3139' }}
              onClick={() => setOrderType('sell')}
            >Sell</button>
          </div>

          {/* Order type label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.mktLabel}>Market Order</span>
            <span style={styles.demoLabel}>⚡ Demo</span>
          </div>

          {/* Message */}
          {message && (
            <div style={{ padding: '10px 12px', borderRadius: '6px', fontSize: '13px', background: message.type === 'success' ? '#0d2818' : '#2d1318', border: `1px solid ${message.type === 'success' ? '#0ecb81' : '#f6465d'}`, color: message.type === 'success' ? '#0ecb81' : '#f6465d' }}>
              {message.text}
            </div>
          )}

          {/* Input mode toggle */}
          <div style={styles.inputModeRow}>
            <button
              style={{ ...styles.modeBtn, background: inputMode === 'coin' ? '#2b3139' : 'transparent', color: inputMode === 'coin' ? '#eaecef' : '#848e9c' }}
              onClick={() => setInputMode('coin')}
            >
              By {symbol}
            </button>
            <button
              style={{ ...styles.modeBtn, background: inputMode === 'usdt' ? '#2b3139' : 'transparent', color: inputMode === 'usdt' ? '#eaecef' : '#848e9c' }}
              onClick={() => setInputMode('usdt')}
            >
              By USDT
            </button>
          </div>

          {/* Amount Input */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>
              {inputMode === 'coin' ? `Amount (${symbol})` : 'Amount (USDT)'}
            </label>
            <div style={styles.inputWrap}>
              {inputMode === 'coin' ? (
                <>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="0.00"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min="0"
                    step="0.0001"
                  />
                  <span style={styles.inputSuffix}>{symbol}</span>
                </>
              ) : (
                <>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="0.00"
                    value={usdtAmount}
                    onChange={e => setUsdtAmount(e.target.value)}
                    min="0"
                    step="1"
                  />
                  <span style={styles.inputSuffix}>USDT</span>
                </>
              )}
            </div>
          </div>

          {/* Percentage buttons */}
          <div style={styles.pctRow}>
            {[25, 50, 75, 100].map(p => (
              <button key={p} style={styles.pctBtn} onClick={() => handlePctClick(p)}>
                {p}%
              </button>
            ))}
          </div>

          {/* Order Summary */}
          {(quantity || usdtAmount) && (
            <div style={styles.summaryBox}>
              <div style={styles.sumRow}>
                <span style={{ color: '#848e9c' }}>Price</span>
                <span>${formatPrice(coinData?.price)}</span>
              </div>
              <div style={styles.sumRow}>
                <span style={{ color: '#848e9c' }}>Qty ({symbol})</span>
                <span>{coinQty}</span>
              </div>
              <div style={{ ...styles.sumRow, borderTop: '1px solid #2b3139', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#eaecef', fontWeight: '600' }}>Total (USDT)</span>
                <span style={{ color: '#f0b90b', fontWeight: '700' }}>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            style={{ ...styles.submitBtn, background: orderType === 'buy' ? '#0ecb81' : '#f6465d', opacity: loading ? 0.7 : 1 }}
            onClick={handleTrade}
            disabled={loading}
          >
            {loading ? 'Processing...' : `${orderType === 'buy' ? '▲ Buy' : '▼ Sell'} ${symbol}`}
          </button>

          <div style={styles.disclaimer}>
            ⚠ Demo platform — virtual funds only. For educational purposes.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  coinBar: { background: '#1e2329', borderBottom: '1px solid #2b3139', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  coinBarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  backBtn: { background: 'transparent', border: '1px solid #2b3139', color: '#848e9c', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  coinAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#2b3139', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#f0b90b' },
  coinPairText: { fontSize: '15px', fontWeight: '700', color: '#eaecef' },
  coinSubText: { fontSize: '10px', color: '#474d57' },
  coinStats: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  statItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel: { fontSize: '10px', color: '#474d57' },
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 110px)' },
  leftPanel: { borderRight: '1px solid #2b3139', display: 'flex', flexDirection: 'column' },
  chartToolbar: { background: '#1e2329', borderBottom: '1px solid #2b3139', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  intervalGroup: { display: 'flex', gap: '2px' },
  ivBtn: { padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  indicatorGroup: { display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #2b3139', paddingLeft: '12px' },
  indLabel: { fontSize: '11px', color: '#474d57', marginRight: '4px' },
  indBtn: { padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600' },
  chartBox: { background: '#0b0e11', flex: 1 },
  bottomPanels: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #2b3139' },
  orderBookPanel: { borderRight: '1px solid #2b3139', padding: '12px' },
  recentTradesPanel: { padding: '12px' },
  panelTitle: { fontSize: '13px', fontWeight: '600', color: '#eaecef', marginBottom: '10px' },
  obHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '10px', color: '#474d57', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #2b3139' },
  askRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '12px', padding: '3px 0', position: 'relative' },
  bidRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '12px', padding: '3px 0', position: 'relative' },
  obBar: { position: 'absolute', right: 0, top: 0, height: '100%', background: '#f6465d15', width: '40%', zIndex: 0 },
  obBarBid: { position: 'absolute', right: 0, top: 0, height: '100%', background: '#0ecb8115', width: '40%', zIndex: 0 },
  spreadRow: { display: 'flex', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #2b3139', borderBottom: '1px solid #2b3139', margin: '4px 0' },
  tradeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '12px', padding: '3px 0' },
  rightPanel: { padding: '16px', background: '#1e2329', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' },
  balanceBox: { background: '#0b0e11', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2b3139' },
  balRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  balLabel: { fontSize: '11px', color: '#848e9c' },
  balVal: { fontSize: '12px', fontWeight: '600', color: '#eaecef' },
  buySellRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  buySellBtn: { padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  mktLabel: { background: '#2b3139', color: '#eaecef', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' },
  demoLabel: { background: '#1a1f2e', color: '#f0b90b', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', border: '1px solid #f0b90b33' },
  inputModeRow: { display: 'flex', background: '#0b0e11', borderRadius: '6px', padding: '3px', border: '1px solid #2b3139' },
  modeBtn: { flex: 1, padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '11px', color: '#848e9c' },
  inputWrap: { display: 'flex', alignItems: 'center', background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '6px', overflow: 'hidden' },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#eaecef', fontSize: '14px', padding: '10px 12px' },
  inputSuffix: { color: '#f0b90b', fontSize: '12px', fontWeight: '700', padding: '0 12px' },
  pctRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' },
  pctBtn: { background: '#2b3139', border: 'none', borderRadius: '4px', color: '#848e9c', padding: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  summaryBox: { background: '#0b0e11', borderRadius: '6px', padding: '12px', border: '1px solid #2b3139', display: 'flex', flexDirection: 'column', gap: '8px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#eaecef' },
  submitBtn: { width: '100%', padding: '13px', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px' },
  disclaimer: { fontSize: '10px', color: '#474d57', textAlign: 'center', lineHeight: '1.5' },
};