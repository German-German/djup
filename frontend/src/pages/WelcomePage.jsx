import { ArrowRight, Activity, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-fade-in px-4">
      <div className="max-w-4xl text-center space-y-6">
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2">
            <Badge label="Active Terminal" variant="live" />
            <div className="px-3 py-1 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] text-[var(--djup-text)] text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm">
              DJUP PLATFORM v1.4.0-PRO
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--djup-text)] font-['Inter'] max-w-3xl mx-auto">
            Institutional Intelligence for Private Credit.
          </h1>
          
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Harness the power of AI-driven NLP sentiment analysis, real-time yield monitoring, and predictive modeling to dominate the middle-market lending landscape.
          </p>
        </div>

        <div className="pt-6 pb-10 flex justify-center">
          <button 
            onClick={() => navigate('/overview')}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-[12px] font-mono font-bold uppercase tracking-wider text-[var(--djup-bg-main)] bg-[var(--djup-primary)] border border-[var(--djup-primary)] hover:bg-[var(--djup-primary-soft)] hover:text-[var(--djup-primary)] rounded-sm transition-all focus:outline-none shadow-lg shadow-amber-500/5 active:scale-[0.98]"
          >
            <span>Launch Pro Terminal</span>
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-10 border-t border-[var(--djup-border)]">
          <div className="p-5 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded-sm hover:border-[var(--djup-primary)] transition-all">
            <Activity className="w-6 h-6 text-[var(--djup-primary)] mb-4" />
            <h3 className="text-[14px] font-bold text-[var(--djup-text)] mb-2 font-mono uppercase tracking-wider">Yield Analytics</h3>
            <p className="text-[11px] text-[var(--djup-text-muted)] font-mono leading-relaxed">Track historical spreads, forecast trends, and analyze manager dispersion.</p>
          </div>
          <div className="p-5 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded-sm hover:border-[var(--djup-purple)] transition-all">
            <Brain className="w-6 h-6 text-[var(--djup-purple)] mb-4" />
            <h3 className="text-[14px] font-bold text-[var(--djup-text)] mb-2 font-mono uppercase tracking-wider">NLP Insights</h3>
            <p className="text-[11px] text-[var(--djup-text-muted)] font-mono leading-relaxed">Process earnings transcripts with FinBERT to quantify market sentiment.</p>
          </div>
          <div className="p-5 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded-sm hover:border-[var(--djup-green)] transition-all">
            <Shield className="w-6 h-6 text-[var(--djup-green)] mb-4" />
            <h3 className="text-[14px] font-bold text-[var(--djup-text)] mb-2 font-mono uppercase tracking-wider">Risk Radar</h3>
            <p className="text-[11px] text-[var(--djup-text-muted)] font-mono leading-relaxed">Monitor non-accruals, fair value distributions, and stress indicators.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;
