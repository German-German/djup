import { ArrowRight, Activity, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';

const FEATURES = [
  { icon: Activity, label: 'Yield Analytics', body: 'Historical spreads, manager dispersion, and forecasted tranche yields.' },
  { icon: Brain, label: 'NLP Insights', body: 'FinBERT-processed earnings transcripts quantifying executive tone.' },
  { icon: Shield, label: 'Risk Radar', body: 'Non-accrual trends, fair-value distributions, NAV discount alerts.' },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-fade-in px-6">
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-3 mb-10">
          <Badge label="Active Terminal" variant="live" />
          <span className="djup-section-label">Djup · v1.4.0</span>
        </div>

        <h1 className="text-[44px] md:text-[60px] leading-[1.06] font-semibold tracking-tight text-[var(--djup-text)] mb-7 max-w-2xl">
          Institutional intelligence
          <br />
          <span className="text-[var(--djup-primary)]">for private credit.</span>
        </h1>

        <p className="text-[16px] text-[var(--djup-text-muted)] max-w-xl leading-relaxed mb-10">
          Live yields, structural stress signals, manager dispersion, macro overlays,
          and earnings-call NLP — distilled from SEC filings, FRED, Yahoo Finance,
          and CoinGecko into a single, focused workspace.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/overview')}
            className="group inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors"
            style={{ borderRadius: 'var(--r-sm)' }}
          >
            Launch terminal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/about')}
            className="px-6 py-3 text-[13px] text-[var(--djup-text-muted)] border border-[var(--djup-border-strong)] hover:text-[var(--djup-text)] hover:border-[var(--djup-grey)] transition-colors"
            style={{ borderRadius: 'var(--r-sm)' }}
          >
            About platform
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-16 bg-[var(--djup-border-strong)] border border-[var(--djup-border-strong)]" style={{ borderRadius: 'var(--r-md)' }}>
          {FEATURES.map(({ icon: Icon, label, body }, i) => (
            <div
              key={i}
              className="bg-[var(--djup-bg-panel)] p-6"
              style={{
                borderTopLeftRadius: i === 0 ? 'var(--r-md)' : 0,
                borderBottomLeftRadius: i === 0 ? 'var(--r-md)' : 0,
                borderTopRightRadius: i === FEATURES.length - 1 ? 'var(--r-md)' : 0,
                borderBottomRightRadius: i === FEATURES.length - 1 ? 'var(--r-md)' : 0,
              }}
            >
              <div className="w-9 h-9 mb-4 flex items-center justify-center bg-[var(--djup-primary-soft)] text-[var(--djup-primary)]" style={{ borderRadius: 'var(--r-sm)' }}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="text-[14px] font-semibold text-[var(--djup-text)] mb-1.5 tracking-tight">
                {label}
              </h3>
              <p className="text-[12.5px] text-[var(--djup-text-muted)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
