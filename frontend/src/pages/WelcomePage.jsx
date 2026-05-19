import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Brain, ChevronDown, Sparkles, BarChart3 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import AuthPanel from '../components/auth/AuthPanel';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  { icon: Activity, label: 'Yield Analytics', body: 'Historical spreads, manager dispersion, and forecasted tranche yields.' },
  { icon: Brain, label: 'NLP Insights', body: 'FinBERT-processed earnings transcripts quantifying executive tone.' },
  { icon: Shield, label: 'Risk Radar', body: 'Non-accrual trends, fair-value distributions, NAV discount alerts.' },
  { icon: BarChart3, label: 'Manager Matrix', body: 'Risk-adjusted manager rankings with deep-dive panels per BDC.' },
];

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If already signed in, the welcome screen still loads but offers a "continue" CTA.
  useEffect(() => {
    // No auto-redirect — user may want to read the welcome content even when signed in.
  }, []);

  const scrollToAuth = () => {
    document.getElementById('auth-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--djup-bg-outer)] text-[var(--djup-text)]">
      {/* Minimal top brand */}
      <div className="px-10 py-7 flex items-center justify-between border-b border-[var(--djup-border-strong)]">
        <div className="flex items-baseline gap-3">
          <span className="text-[22px] font-semibold tracking-tight">Djup</span>
          <span className="djup-section-label text-[var(--djup-primary)]">Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          {user ? (
            <button
              onClick={() => navigate('/overview')}
              className="px-4 py-1.5 text-[12.5px] text-[var(--djup-text)] border border-[var(--djup-border-strong)] hover:border-[var(--djup-primary)] transition-colors"
              style={{ borderRadius: 'var(--r-sm)' }}
            >
              Continue to terminal
            </button>
          ) : (
            <button
              onClick={scrollToAuth}
              className="px-4 py-1.5 text-[12.5px] text-[var(--djup-text)] border border-[var(--djup-border-strong)] hover:border-[var(--djup-primary)] transition-colors"
              style={{ borderRadius: 'var(--r-sm)' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="px-10 pt-20 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Badge label="Institutional · v1.4.0" variant="default" />
          <span className="djup-section-label">Private credit intelligence</span>
        </div>

        <h1 className="text-[52px] md:text-[72px] leading-[1.04] font-semibold tracking-tight mb-8 max-w-4xl">
          Institutional intelligence,
          <br />
          <span className="text-[var(--djup-primary)]">distilled from filings.</span>
        </h1>

        <p className="text-[17px] text-[var(--djup-text-muted)] max-w-2xl leading-relaxed mb-10">
          Live yields, structural stress signals, manager dispersion, macro overlays, and an
          AI analyst that reads every page with you. SEC filings, FRED, Yahoo Finance, CoinGecko,
          and a multi-provider newswire — one focused workspace.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={user ? () => navigate('/overview') : scrollToAuth}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors"
            style={{ borderRadius: 'var(--r-sm)' }}
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            {user ? 'Open terminal' : 'Create free account'}
          </button>
          <button
            onClick={() => navigate('/about')}
            className="px-7 py-3.5 text-[14px] text-[var(--djup-text-muted)] border border-[var(--djup-border-strong)] hover:text-[var(--djup-text)] hover:border-[var(--djup-grey)] transition-colors"
            style={{ borderRadius: 'var(--r-sm)' }}
          >
            About the platform
          </button>
        </div>

        <button
          onClick={scrollToAuth}
          className="mt-16 inline-flex items-center gap-2 text-[12px] text-[var(--djup-text-faint)] hover:text-[var(--djup-text)] transition-colors"
        >
          <span className="djup-section-label">Continue below</span>
          <ChevronDown size={14} className="animate-bounce" />
        </button>
      </section>

      {/* Feature grid */}
      <section className="px-10 py-16 border-t border-[var(--djup-border-strong)] max-w-6xl mx-auto">
        <div className="djup-section-label mb-6">Workspace</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--djup-border-strong)] border border-[var(--djup-border-strong)]" style={{ borderRadius: 'var(--r-md)' }}>
          {FEATURES.map(({ icon: Icon, label, body }) => (
            <div key={label} className="bg-[var(--djup-bg-panel)] p-7">
              <div className="w-10 h-10 mb-5 flex items-center justify-center bg-[var(--djup-primary-soft)] border border-[var(--djup-primary-line)] text-[var(--djup-primary)]" style={{ borderRadius: 'var(--r-sm)' }}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="text-[15px] font-semibold mb-2 tracking-tight">{label}</h3>
              <p className="text-[12.5px] text-[var(--djup-text-muted)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth anchor */}
      <section id="auth-anchor" className="px-10 py-20 border-t border-[var(--djup-border-strong)] bg-[var(--djup-bg-main)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="djup-section-label mb-4">{user ? 'Signed in' : 'Get started'}</div>
            <h2 className="text-[36px] font-semibold tracking-tight leading-[1.1] mb-4 max-w-md">
              {user ? `Welcome back, ${user.email?.split('@')[0]}.` : 'Sign in to access the terminal.'}
            </h2>
            <p className="text-[14px] text-[var(--djup-text-muted)] leading-relaxed max-w-md mb-6">
              {user
                ? 'Your session is active. Continue into the dashboard to see live universe metrics, AI commentary, and the newswire.'
                : 'New accounts get full read access to the dashboard, AI commentary, and the live newswire. Your profile and activity are stored securely in Supabase.'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/overview')}
                className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors"
                style={{ borderRadius: 'var(--r-sm)' }}
              >
                Open terminal
              </button>
            )}
          </div>

          {!user && !loading && (
            <div className="flex justify-end">
              <AuthPanel />
            </div>
          )}
        </div>
      </section>

      <footer className="px-10 py-8 border-t border-[var(--djup-border-strong)] text-[11.5px] text-[var(--djup-text-faint)] flex items-center justify-between">
        <span>Djup Terminal · Built for institutional private credit</span>
        <span>v1.4.0</span>
      </footer>
    </div>
  );
};

export default WelcomePage;
