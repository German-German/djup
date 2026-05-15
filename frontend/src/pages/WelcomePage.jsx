import { ArrowRight, Activity, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4">
      <div className="max-w-3xl text-center space-y-8">
        
        <div className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1E1E1E] border border-[#333333] text-[#F59E0B] text-xs font-bold tracking-wider mb-4">
            DJUP PLATFORM V2.0
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#F0F0F0]">
            Institutional Intelligence for Private Credit.
          </h1>
          <p className="text-lg md:text-xl text-[#A0A0A0] max-w-2xl mx-auto leading-relaxed">
            Harness the power of AI-driven sentiment analysis, real-time yield monitoring, and predictive modeling to dominate the middle-market lending landscape.
          </p>
        </div>

        <div className="pt-8 pb-12 flex justify-center">
          <button 
            onClick={() => navigate('/overview')}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-[#121212] bg-[#F59E0B] rounded-full overflow-hidden transition-all hover:bg-[#FCD34D] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 focus:ring-offset-[#121212]"
          >
            <span>Launch Terminal</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12 border-t border-[#333333]">
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#333333] transition-colors hover:border-[#555555]">
            <Activity className="w-8 h-8 text-[#F59E0B] mb-4" />
            <h3 className="text-lg font-bold text-[#F0F0F0] mb-2">Yield Analytics</h3>
            <p className="text-sm text-[#707070]">Track historical spreads, forecast trends, and analyze manager dispersion.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#333333] transition-colors hover:border-[#555555]">
            <Brain className="w-8 h-8 text-[#8B5CF6] mb-4" />
            <h3 className="text-lg font-bold text-[#F0F0F0] mb-2">NLP Insights</h3>
            <p className="text-sm text-[#707070]">Process earnings transcripts with FinBERT to quantify market sentiment.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#333333] transition-colors hover:border-[#555555]">
            <Shield className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="text-lg font-bold text-[#F0F0F0] mb-2">Risk Radar</h3>
            <p className="text-sm text-[#707070]">Monitor non-accruals, fair value distributions, and stress indicators.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;
