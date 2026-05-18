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
} from 'lucide-react';

const Sidebar = () => {
  const navLinks = [
    { name: 'Market Overview', path: '/overview', icon: LayoutDashboard, code: '01' },
    { name: 'Yields & Spreads', path: '/yields', icon: TrendingUp, code: '02' },
    { name: 'Risk Radar', path: '/risk-radar', icon: AlertTriangle, code: '03' },
    { name: 'Deal Intelligence', path: '/dealflow', icon: Activity, code: '04' },
    { name: 'Manager Matrix', path: '/managers', icon: BarChart2, code: '05' },
    { name: 'Macro Overlay', path: '/macro', icon: Globe, code: '06' },
    { name: 'NLP Sentiment', path: '/sentiment', icon: Brain, code: '07' },
    { name: 'About Platform', path: '/about', icon: Info, code: '08' },
  ];

  return (
    <aside className="w-[232px] h-full bg-[var(--djup-bg-sidebar)] border-r border-[var(--djup-border-strong)] flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--djup-border-strong)]">
        <NavLink to="/" className="flex items-center gap-3 no-underline">
          <span className="font-['Inter'] font-semibold text-[20px] text-[var(--djup-text)] leading-none tracking-tight">
            Djup
          </span>
          <span className="djup-section-label text-[var(--djup-primary)]">Terminal</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 pl-5 pr-4 py-2 font-mono text-[12px] tracking-wide no-underline transition-colors duration-75 ` +
                (isActive
                  ? 'bg-[var(--djup-bg-panel-elevated)] text-[var(--djup-primary)]'
                  : 'text-[var(--djup-text-muted)] hover:bg-[var(--djup-bg-panel)] hover:text-[var(--djup-text)]')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-[2px] ${isActive ? 'bg-[var(--djup-primary)]' : 'bg-transparent'}`}
                  />
                  <span className="text-[var(--djup-text-faint)] font-mono text-[10px] w-5">{link.code}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 truncate">{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--djup-border-strong)] px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="djup-section-label">Stream</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--djup-text)]">Connected</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)]" />
          </div>
        </div>
        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-2 px-0 py-1 font-mono text-[11px] text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] transition-colors">
            <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
            Account
          </button>
          <button className="w-full flex items-center gap-2 px-0 py-1 font-mono text-[11px] text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] transition-colors">
            <Settings className="w-3 h-3" strokeWidth={1.5} />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
