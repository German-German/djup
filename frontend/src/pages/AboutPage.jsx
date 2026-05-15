import { LayoutDashboard, TrendingUp, AlertTriangle, Activity, Brain, Users } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      title: "Executive Overview",
      icon: LayoutDashboard,
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10",
      description: "A high-level dashboard summarizing the private credit universe. It aggregates weighted yields, market non-accrual rates, and net deployment figures, providing a quick pulse on the health of the lending ecosystem."
    },
    {
      title: "Yield Monitor",
      icon: TrendingUp,
      color: "text-[#10B981]",
      bg: "bg-[#10B981]/10",
      description: "Deep dive into historical yield spreads across different loan tranches (First Lien, Unitranche, Second Lien). Includes an AI-powered projection tool utilizing Prophet to forecast future yield movements."
    },
    {
      title: "Stress Radar",
      icon: AlertTriangle,
      color: "text-[#EF4444]",
      bg: "bg-[#EF4444]/10",
      description: "Risk assessment central. Highlights non-performing loans, fair value markdowns, and NAV convergence metrics to identify potential defaults before they cascade across the portfolio."
    },
    {
      title: "Deal Flow & Origination",
      icon: Activity,
      color: "text-[#32D7FF]",
      bg: "bg-[#32D7FF]/10",
      description: "Tracks deployment momentum, capturing gross originations versus repayments. Analyzes which industries are attracting capital and monitors average loan hold sizes."
    },
    {
      title: "NLP Sentiment Insights",
      icon: Brain,
      color: "text-[#8B5CF6]",
      bg: "bg-[#8B5CF6]/10",
      description: "Processes earnings call transcripts using the FinBERT AI model. It scores management sentiment as positive, neutral, or negative, and extracts frequency counts for critical keywords like 'spread compression' or 'covenant lite'."
    },
    {
      title: "Manager Matrix",
      icon: Users,
      color: "text-[#A0A0A0]",
      bg: "bg-[#333333]/50",
      description: "A comprehensive database of all Business Development Companies (BDCs) tracked by the platform. View SEC filings, basic fundamentals, and AUM size for the top managers."
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10 max-w-5xl mx-auto">
      <div className="border-b border-[#333333] pb-6 mb-2">
        <h1 className="text-3xl font-bold text-[#F0F0F0] mb-3">About Djup Platform</h1>
        <p className="text-[#A0A0A0] text-lg max-w-3xl leading-relaxed">
          Djup is a premier intelligence terminal built specifically for private credit professionals. 
          By aggregating filings, tracking macro indicators, and running machine-learning models, it 
          surfaces actionable insights across the BDC universe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feat, idx) => (
          <div key={idx} className="premium-card p-6 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${feat.bg}`}>
                <feat.icon className={`w-6 h-6 ${feat.color}`} />
              </div>
              <h2 className="text-xl font-bold text-[#F0F0F0]">{feat.title}</h2>
            </div>
            <p className="text-[#A0A0A0] text-sm leading-relaxed flex-1">
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
