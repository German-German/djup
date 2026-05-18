import { LayoutDashboard, TrendingUp, AlertTriangle, Activity, Brain, Users } from 'lucide-react';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';

const FEATURES = [
  {
    title: 'Market Overview',
    icon: LayoutDashboard,
    description:
      'Universe metrics, live ticker tape, macro snapshot, AI commentary, and the integrated newswire.',
  },
  {
    title: 'Yields & Spreads',
    icon: TrendingUp,
    description:
      'Tranche-level spread analytics, manager dispersion, and Prophet-projected forward yields.',
  },
  {
    title: 'Risk Radar',
    icon: AlertTriangle,
    description:
      'Non-accrual trends, fair-value distributions, NAV discount alerts, and stressed-borrower watchlist.',
  },
  {
    title: 'Deal Intelligence',
    icon: Activity,
    description:
      'Origination vs repayment cadence, sector deployment, and hold-size evolution across cycles.',
  },
  {
    title: 'NLP Sentiment',
    icon: Brain,
    description:
      'FinBERT-scored earnings transcripts and keyword frequency tracking across the BDC universe.',
  },
  {
    title: 'Manager Matrix',
    icon: Users,
    description:
      'Risk-adjusted manager rankings with portfolio scale, yield-to-risk ratio, and deep-dive panel.',
  },
];

const DATA_SOURCES = [
  { label: 'Equities & ETFs', value: 'Yahoo Finance v8' },
  { label: 'Crypto', value: 'CoinGecko' },
  { label: 'FX', value: 'Frankfurter / ECB' },
  { label: 'Macro', value: 'FRED / St. Louis Fed' },
  { label: 'Filings', value: 'SEC EDGAR' },
  { label: 'Newswire', value: 'NewsAPI → GNews → Guardian' },
];

const AboutPage = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 max-w-5xl">
      <div className="flex justify-between items-start border-b border-[var(--djup-border-strong)] pb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-2">
            About the platform
          </h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Djup is an institutional terminal for private credit professionals. It aggregates SEC
            filings, FRED macro feeds, Yahoo Finance quotes, CoinGecko crypto, FX rates, and a
            multi-provider newswire — and runs predictive ML over the corpus.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="System Active" variant="live" />
          <span className="djup-section-label">v1.4.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--djup-border-strong)]">
        {FEATURES.map((feat, idx) => (
          <div key={idx} className="bg-[var(--djup-bg-panel)] p-5 flex gap-4">
            <feat.icon className="w-4 h-4 text-[var(--djup-primary)] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h3 className="text-[13px] font-semibold text-[var(--djup-text)] mb-1.5 font-['Inter'] tracking-tight">
                {feat.title}
              </h3>
              <p className="text-[11px] font-mono text-[var(--djup-text-muted)] leading-relaxed">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <TerminalPanel title="Data sources" source="live integrations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--djup-border-strong)] -m-4 mt-2">
          {DATA_SOURCES.map((s) => (
            <div key={s.label} className="bg-[var(--djup-bg-panel)] px-4 py-3">
              <div className="djup-section-label mb-1">{s.label}</div>
              <div className="text-[12px] font-mono text-[var(--djup-text)]">{s.value}</div>
            </div>
          ))}
        </div>
      </TerminalPanel>
    </div>
  );
};

export default AboutPage;
