import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, Search, Monitor, Info } from 'lucide-react';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/':
    case '/overview': return 'Market Overview';
    case '/yields': return 'Yields & Spreads';
    case '/risk-radar': return 'Risk Radar';
    case '/dealflow': return 'Deal Intelligence';
    case '/managers': return 'Manager Matrix';
    case '/macro': return 'Macro Overlay';
    case '/sentiment': return 'NLP Sentiment';
    case '/about': return 'About';
    default: return 'Terminal';
  }
};

const TopBar = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ts = now.toISOString().slice(0, 19).replace('T', ' ') + 'Z';

  return (
    <header className="h-11 bg-[var(--djup-bg-main)] border-b border-[var(--djup-border-strong)] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-5">
        <h1 className="text-[13px] font-semibold text-[var(--djup-text)] font-['Inter'] tracking-tight leading-none">
          {title}
        </h1>
        <span className="djup-section-label">US · Private Credit · v4.2</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-[var(--djup-border-strong)] w-[240px]">
          <Search className="w-3 h-3 text-[var(--djup-text-faint)]" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent border-none outline-none text-[11px] text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] w-full font-mono"
          />
        </div>

        <span className="djup-section-label hidden md:inline">{ts}</span>

        <div className="flex items-center gap-3 text-[var(--djup-text-faint)]">
          <button className="hover:text-[var(--djup-primary)] transition-colors">
            <Bell size={14} strokeWidth={1.5} />
          </button>
          <button className="hover:text-[var(--djup-primary)] transition-colors">
            <Monitor size={14} strokeWidth={1.5} />
          </button>
          <button className="hover:text-[var(--djup-primary)] transition-colors">
            <Info size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 border border-[var(--djup-border-strong)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)]" />
          <span className="text-[11px] font-mono text-[var(--djup-text)]">Institutional</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
