import { ArrowRight, Activity, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-fade-in px-6">
      <div className="max-w-3xl text-left w-full">
        <div className="flex items-center gap-3 mb-10">
          <Badge label="Active Terminal" variant="live" />
          <span className="djup-section-label">Djup Platform · v1.4.0</span>
        </div>

        <h1 className="text-[40px] md:text-[56px] leading-[1.05] font-semibold tracking-tight text-[var(--djup-text)] font-['Inter'] mb-6 max-w-2xl">
          Institutional intelligence
          <br />
          <span className="text-[var(--djup-primary)]">for private credit.</span>
        </h1>

        <p className="text-[13px] font-mono text-[var(--djup-text-muted)] max-w-xl leading-relaxed mb-10">
          Live yields, structural stress signals, manager dispersion, macro overlays,
          and earnings-call NLP — distilled from SEC filings, FRED, Yahoo Finance,
          and CoinGecko into a single hard-edged workspace.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/overview')}
            className="group inline-flex items-center gap-2 px-6 py-3 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] border border-[var(--djup-primary)] transition-colors"
            style={{ borderRadius: 0 }}
          >
            Launch terminal
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/about')}
            className="px-6 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--djup-text-muted)] border border-[var(--djup-border-strong)] hover:text-[var(--djup-text)] hover:border-[var(--djup-text-muted)] transition-colors"
            style={{ borderRadius: 0 }}
          >
            About
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-16 border-t border-[var(--djup-border-strong)]">
          {[
            { icon: Activity, label: 'Yield Analytics', body: 'Historical spreads, manager dispersion, and forecasted tranche yields.' },
            { icon: Brain, label: 'NLP Insights', body: 'FinBERT-processed earnings transcripts quantifying executive tone.' },
            { icon: Shield, label: 'Risk Radar', body: 'Non-accrual trends, fair-value distributions, NAV discount alerts.' },
          ].map(({ icon: Icon, label, body }, i) => (
            <div
              key={i}
              className={`p-6 border-b border-[var(--djup-border-strong)] ${
                i < 2 ? 'md:border-r border-[var(--djup-border-strong)]' : ''
              }`}
            >
              <Icon className="w-4 h-4 text-[var(--djup-primary)] mb-4" strokeWidth={1.5} />
              <h3 className="text-[12px] font-semibold text-[var(--djup-text)] mb-2 font-mono uppercase tracking-[0.12em]">
                {label}
              </h3>
              <p className="text-[11px] text-[var(--djup-text-muted)] font-mono leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
