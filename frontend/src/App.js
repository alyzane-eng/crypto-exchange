import Admin from './pages/Admin';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Trade from './pages/Trade';
import Leaderboard from './pages/Leaderboard';
import Wallet from './pages/Wallet';
import History from './pages/History';
import Forum from './pages/Forum';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/markets" element={user ? <Markets /> : <Navigate to="/login" />} />
        <Route path="/trade/:symbol" element={user ? <Trade /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
        <Route path="/forum" element={user ? <Forum /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;