import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  Globe, 
  Brain, 
  Info,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore.js';

const Sidebar = () => {
  const { selectedQuarter, setQuarter } = useDashboardStore();

  const navLinks = [
    { name: 'Market Overview', path: '/', icon: LayoutDashboard },
    { name: 'Yields & Spreads', path: '/yields', icon: TrendingUp },
    { name: 'Risk Radar', path: '/risk-radar', icon: AlertTriangle },
    { name: 'Deal Intelligence', path: '/dealflow', icon: Activity },
    { name: 'Manager Matrix', path: '/managers', icon: BarChart2 },
    { name: 'Macro Overlay', path: '/macro', icon: Globe },
    { name: 'NLP Sentiment', path: '/sentiment', icon: Brain },
    { name: 'About Platform', path: '/about', icon: Info },
  ];

  return (
    <div className="w-[250px] h-full bg-[var(--djup-bg-sidebar)] border-r border-[var(--djup-border)] flex flex-col flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-20 flex flex-col justify-center px-6 border-b border-[var(--djup-border)]">
        <NavLink to="/" className="flex flex-col group no-underline">
          <span className="font-['Inter'] font-bold text-2xl text-[var(--djup-text)] leading-tight tracking-tight">Djup</span>
          <span className="text-[10px] text-[var(--djup-primary)] font-mono font-bold tracking-widest uppercase mt-0.5">Pro Terminal</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-[13px] font-mono transition-all no-underline ` +
                (isActive
                  ? 'bg-[var(--djup-bg-panel-elevated)] text-[var(--djup-primary)] border-l-2 border-[var(--djup-primary)]'
                  : 'text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] border-l-2 border-transparent')
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span className="flex-1 truncate">{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[var(--djup-border)] space-y-3 bg-[var(--djup-bg-sidebar)]">
        
        {/* Connectivity Status */}
        <div className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] font-mono text-[var(--djup-text-muted)]">Connectivity: <span className="text-[var(--djup-text)]">Stable</span></span>
          <div className="w-2 h-2 rounded-full bg-[var(--djup-primary)] shadow-[0_0_8px_var(--djup-primary)]" />
        </div>

        {/* Action Links */}
        <div className="space-y-1 mt-2">
          <button className="w-full flex items-center px-2 py-1.5 text-[12px] font-mono text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
            Account Status
          </button>
          <button className="w-full flex items-center px-2 py-1.5 text-[12px] font-mono text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] transition-colors">
            <Settings className="w-3.5 h-3.5 mr-2" />
            Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
