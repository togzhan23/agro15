import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import Visualization from './pages/Visualization';
import RiskMonitor from './pages/RiskMonitor';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/prediction"    element={<Prediction />} />
          <Route path="/risk"          element={<RiskMonitor />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="*"              element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
