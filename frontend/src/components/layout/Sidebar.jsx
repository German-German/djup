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

const NAV = [
  { name: 'Market Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Yields & Spreads', path: '/yields', icon: TrendingUp },
  { name: 'Risk Radar', path: '/risk-radar', icon: AlertTriangle },
  { name: 'Deal Intelligence', path: '/dealflow', icon: Activity },
  { name: 'Manager Matrix', path: '/managers', icon: BarChart2 },
  { name: 'Macro Overlay', path: '/macro', icon: Globe },
  { name: 'NLP Sentiment', path: '/sentiment', icon: Brain },
  { name: 'About Platform', path: '/about', icon: Info },
];

const Sidebar = () => {
  return (
    <aside className="w-[280px] h-full bg-[var(--djup-bg-sidebar)] border-r border-[var(--djup-border-strong)] flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-[68px] flex items-center px-7 border-b border-[var(--djup-border-strong)]">
        <NavLink to="/" className="flex items-baseline gap-2.5 no-underline">
          <span className="font-semibold text-[22px] text-[var(--djup-text)] leading-none tracking-tight">
            Djup
          </span>
          <span className="djup-section-label text-[var(--djup-primary)]">Terminal</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-7 px-4 overflow-y-auto">
        <div className="djup-section-label px-3 mb-4">Workspace</div>
        <div className="flex flex-col gap-1">
          {NAV.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 px-3.5 py-3 text-[13.5px] no-underline transition-colors duration-100 ` +
                  (isActive
                    ? 'bg-[var(--djup-bg-panel-elevated)] text-[var(--djup-text)] font-medium'
                    : 'text-[var(--djup-text-muted)] hover:bg-[var(--djup-bg-panel)] hover:text-[var(--djup-text)]')
                }
                style={{ borderRadius: 'var(--r-sm)' }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="absolute top-1/2 -translate-y-1/2 w-[2px] h-5 transition-opacity"
                      style={{
                        backgroundColor: 'var(--djup-primary)',
                        opacity: isActive ? 1 : 0,
                        left: '-16px',
                      }}
                    />
                    <Icon className="w-[16px] h-[16px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="flex-1 truncate">{link.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--djup-border-strong)] px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="djup-section-label">Stream</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--djup-text)]">Connected</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)]" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-2.5 px-2 py-1.5 text-[12px] text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] transition-colors" style={{ borderRadius: 'var(--r-sm)' }}>
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            Account
          </button>
          <button className="flex items-center gap-2.5 px-2 py-1.5 text-[12px] text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] transition-colors" style={{ borderRadius: 'var(--r-sm)' }}>
            <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
