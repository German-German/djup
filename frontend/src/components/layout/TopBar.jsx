import { useLocation } from 'react-router-dom';
import { Bell, Search, User, Monitor, Info } from 'lucide-react';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Market Intelligence';
    case '/yields': return 'Yield Analytics';
    case '/risk-radar': return 'Risk Monitoring';
    case '/dealflow': return 'Capital Deployment';
    case '/managers': return 'Manager Ranking';
    case '/macro': return 'Macro Overlay';
    case '/sentiment': return 'NLP Insights';
    case '/about': return 'About Platform';
    default: return 'Terminal';
  }
};

const TopBar = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="h-12 bg-[var(--djup-bg-panel)] border-b border-[var(--djup-border)] flex items-center justify-between px-4 shrink-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-[16px] font-bold text-[var(--djup-text)] font-['Inter'] leading-none">{title}</h1>
        <div className="h-4 w-[1px] bg-[var(--djup-border-strong)]" />
        <div className="flex items-center bg-[var(--djup-bg-panel-elevated)] border border-[var(--djup-border)] px-2 py-0.5 rounded">
          <span className="text-[10px] font-mono text-[var(--djup-text-muted)] tracking-wider">US_PRIVATE_CREDIT_V4.2</span>
        </div>
        
        {/* Search Input */}
        <div className="hidden lg:flex items-center gap-2 bg-[var(--djup-bg-main)] border border-[var(--djup-border)] px-2.5 py-1 rounded w-[280px] focus-within:border-[var(--djup-primary)] transition-colors">
          <input 
            type="text" 
            placeholder="Search Markets..." 
            className="bg-transparent border-none outline-none text-[12px] text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] w-full font-mono"
          />
          <Search className="w-3 h-3 text-[var(--djup-text-muted)]" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Icon Buttons */}
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-[var(--djup-text-muted)] hover:text-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] border border-transparent hover:border-[var(--djup-border)] rounded transition-all">
            <Bell size={16} />
          </button>
          <button className="p-1.5 text-[var(--djup-text-muted)] hover:text-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] border border-transparent hover:border-[var(--djup-border)] rounded transition-all">
            <Monitor size={16} />
          </button>
          <button className="p-1.5 text-[var(--djup-text-muted)] hover:text-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] border border-transparent hover:border-[var(--djup-border)] rounded transition-all">
            <Info size={16} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[var(--djup-border-strong)] mx-1" />

        {/* Account Badge */}
        <button className="flex items-center gap-2 px-2.5 py-1 bg-[var(--djup-bg-panel-elevated)] border border-[var(--djup-border)] hover:border-[var(--djup-primary)] rounded transition-colors group">
          <div className="w-2 h-2 rounded-full bg-[var(--djup-primary)]" />
          <span className="text-[11px] font-mono text-[var(--djup-text)] group-hover:text-[var(--djup-primary)] transition-colors">Institutional Account</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
