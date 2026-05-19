import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, Search, Monitor, Info, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TITLES = {
  '/': 'Market Overview',
  '/overview': 'Market Overview',
  '/yields': 'Yields & Spreads',
  '/risk-radar': 'Risk Radar',
  '/dealflow': 'Deal Intelligence',
  '/managers': 'Manager Matrix',
  '/macro': 'Macro Overlay',
  '/sentiment': 'NLP Sentiment',
  '/about': 'About',
};

const initialsFrom = (name = '', email = '') => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }
  return (email[0] || 'U').toUpperCase();
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const title = TITLES[location.pathname] || (location.pathname === '/profile' ? 'Profile' : 'Terminal');
  const [now, setNow] = useState(new Date());
  const initials = initialsFrom(profile?.full_name || '', user?.email || '');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ts = now.toISOString().slice(11, 19) + ' UTC';

  return (
    <header className="h-[60px] bg-[var(--djup-bg-main)] border-b border-[var(--djup-border-strong)] flex items-center justify-between px-8 shrink-0 gap-6">
      {/* Left: title + breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-[15px] font-semibold text-[var(--djup-text)] tracking-tight leading-none whitespace-nowrap">
          {title}
        </h1>
        <span className="w-px h-4 bg-[var(--djup-border-strong)]" />
        <span className="text-[12px] text-[var(--djup-text-faint)] whitespace-nowrap">
          US · Private Credit
        </span>
      </div>

      {/* Center: search */}
      <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 border border-[var(--djup-border-strong)] hover:border-[var(--djup-grey)] transition-colors w-[320px] bg-[var(--djup-bg-panel)]" style={{ borderRadius: 'var(--r-sm)' }}>
        <Search className="w-3.5 h-3.5 text-[var(--djup-text-faint)] shrink-0" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search managers, borrowers, sectors…"
          className="bg-transparent border-none outline-none text-[12.5px] text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] w-full"
        />
        <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--djup-text-faint)] border border-[var(--djup-border-strong)]" style={{ borderRadius: 'var(--r-xs)' }}>
          ⌘K
        </kbd>
      </div>

      {/* Right: clock + actions + account */}
      <div className="flex items-center gap-5 shrink-0">
        <span className="font-mono text-[11.5px] text-[var(--djup-text-faint)] tabular-nums whitespace-nowrap hidden md:inline">
          {ts}
        </span>

        <div className="flex items-center gap-1 text-[var(--djup-text-faint)]">
          <button className="p-2 hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] transition-colors" style={{ borderRadius: 'var(--r-sm)' }}>
            <Bell size={15} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] transition-colors" style={{ borderRadius: 'var(--r-sm)' }}>
            <Monitor size={15} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:text-[var(--djup-text)] hover:bg-[var(--djup-bg-panel)] transition-colors" style={{ borderRadius: 'var(--r-sm)' }}>
            <Info size={15} strokeWidth={1.5} />
          </button>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 border border-[var(--djup-border-strong)] hover:border-[var(--djup-grey)] bg-[var(--djup-bg-panel)] transition-colors whitespace-nowrap"
          style={{ borderRadius: 'var(--r-sm)' }}
          title="Open profile"
        >
          <div className="w-6 h-6 rounded-full bg-[var(--djup-primary-soft)] border border-[var(--djup-primary-line)] flex items-center justify-center text-[10px] font-semibold text-[var(--djup-primary)]">
            {initials || <User size={11} strokeWidth={1.75} />}
          </div>
          <span className="text-[12.5px] text-[var(--djup-text)] hidden sm:inline">
            {profile?.full_name || user?.email?.split('@')[0] || 'Account'}
          </span>
          <ChevronDown size={12} className="text-[var(--djup-text-faint)]" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
