import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/OverviewPage';
import YieldMonitorPage from './pages/YieldMonitorPage';
import StressRadarPage from './pages/StressRadarPage';
import DealFlowPage from './pages/DealFlowPage';
import ManagerMatrixPage from './pages/ManagerMatrixPage';
import MacroOverlayPage from './pages/MacroOverlayPage';
import SentimentPage from './pages/SentimentPage';
import WelcomePage from './pages/WelcomePage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/yields" element={<YieldMonitorPage />} />
          <Route path="/stress" element={<StressRadarPage />} />
          <Route path="/dealflow" element={<DealFlowPage />} />
          <Route path="/managers" element={<ManagerMatrixPage />} />
          <Route path="/macro" element={<MacroOverlayPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
