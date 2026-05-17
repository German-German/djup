import { LayoutDashboard, TrendingUp, AlertTriangle, Activity, Brain, Users } from 'lucide-react';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';

const AboutPage = () => {
  const features = [
    {
      title: "Executive Overview",
      icon: LayoutDashboard,
      color: "var(--djup-primary)",
      description: "A high-level dashboard summarizing the private credit universe. It aggregates weighted yields, market non-accrual rates, and net deployment figures, providing a quick pulse on the health of the lending ecosystem."
    },
    {
      title: "Yield Monitor",
      icon: TrendingUp,
      color: "var(--djup-green)",
      description: "Deep dive into historical yield spreads across different loan tranches (First Lien, Unitranche, Second Lien). Includes an AI-powered projection tool utilizing Prophet to forecast future yield movements."
    },
    {
      title: "Stress Radar",
      icon: AlertTriangle,
      color: "var(--djup-red)",
      description: "Risk assessment central. Highlights non-performing loans, fair value markdowns, and NAV convergence metrics to identify potential defaults before they cascade across the portfolio."
    },
    {
      title: "Deal Flow & Origination",
      icon: Activity,
      color: "var(--djup-cyan)",
      description: "Tracks deployment momentum, capturing gross originations versus repayments. Analyzes which industries are attracting capital and monitors average loan hold sizes."
    },
    {
      title: "NLP Sentiment Insights",
      icon: Brain,
      color: "var(--djup-purple)",
      description: "Processes earnings call transcripts using the FinBERT AI model. It scores management sentiment as positive, neutral, or negative, and extracts frequency counts for critical keywords like 'spread compression' or 'covenant lite'."
    },
    {
      title: "Manager Matrix",
      icon: Users,
      color: "var(--djup-text-muted)",
      description: "A comprehensive database of all Business Development Companies (BDCs) tracked by the platform. View SEC filings, basic fundamentals, and AUM size for the top managers."
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 max-w-5xl">
      {/* Page Header */}
      <div className="flex justify-between items-start border-b border-[var(--djup-border)] pb-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-2">About Djup Platform</h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-3xl leading-relaxed">
            Djup is a premier intelligence terminal built specifically for private credit professionals. 
            By aggregating SEC filings, tracking macro indicators, and executing predictive machine-learning models, it 
            surfaces institutional-grade insights across the BDC ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="System Active" variant="live" />
          <div className="px-3 py-1 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] text-[var(--djup-text)] text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm">
            v1.4.0-PRO
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feat, idx) => (
          <TerminalPanel key={idx} className="h-[180px] flex flex-col justify-between" title={feat.title}>
            <div className="absolute top-2 right-4">
              <feat.icon size={16} style={{ color: feat.color }} />
            </div>
            <p className="font-mono text-[10px] text-[var(--djup-text-faint)] leading-relaxed mt-4">
              {feat.description}
            </p>
          </TerminalPanel>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
