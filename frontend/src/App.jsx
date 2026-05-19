import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RouteTracker from './components/auth/RouteTracker';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/OverviewPage';
import YieldMonitorPage from './pages/YieldMonitorPage';
import RiskRadarPage from './pages/RiskRadarPage';
import DealFlowPage from './pages/DealFlowPage';
import ManagerMatrixPage from './pages/ManagerMatrixPage';
import MacroOverlayPage from './pages/MacroOverlayPage';
import SentimentPage from './pages/SentimentPage';
import WelcomePage from './pages/WelcomePage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        <RouteTracker />
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/overview" element={<ProtectedShell><OverviewPage /></ProtectedShell>} />
          <Route path="/yields" element={<ProtectedShell><YieldMonitorPage /></ProtectedShell>} />
          <Route path="/risk-radar" element={<ProtectedShell><RiskRadarPage /></ProtectedShell>} />
          <Route path="/dealflow" element={<ProtectedShell><DealFlowPage /></ProtectedShell>} />
          <Route path="/managers" element={<ProtectedShell><ManagerMatrixPage /></ProtectedShell>} />
          <Route path="/macro" element={<ProtectedShell><MacroOverlayPage /></ProtectedShell>} />
          <Route path="/sentiment" element={<ProtectedShell><SentimentPage /></ProtectedShell>} />
          <Route path="/profile" element={<ProtectedShell><ProfilePage /></ProtectedShell>} />
          <Route path="/about" element={<ProtectedShell><AboutPage /></ProtectedShell>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
