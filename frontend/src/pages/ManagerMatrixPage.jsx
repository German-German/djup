import { useState } from 'react';
import ChartPanel from '../components/ui/ChartPanel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import useApi from '../hooks/useApi';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { X, ExternalLink } from 'lucide-react';

const ManagerMatrixPage = () => {
  const { data: matrix, loading: matrixLoading } = useApi('/managers/matrix');
  const [selectedTicker, setSelectedTicker] = useState(null);

  const getRiskColor = (tier) => {
    switch(tier) {
      case 'Conservative': return '#10B981';
      case 'Balanced': return '#F59E0B';
      case 'Aggressive': return '#EF4444';
      default: return '#32D7FF';
    }
  };

  const columns = [
    { header: 'Ticker', accessorKey: 'ticker', cell: info => <span className="font-semibold text-[#F59E0B] cursor-pointer hover:underline" onClick={() => setSelectedTicker(info.getValue())}>{info.getValue()}</span> },
    { header: 'BDC Name', accessorKey: 'bdc_name' },
    { header: 'Portfolio Size', accessorKey: 'portfolio_size_bn', cell: info => `$${info.getValue().toFixed(1)}B` },
    { header: 'Avg Yield', accessorKey: 'weighted_avg_yield', cell: info => `${(info.getValue() * 100).toFixed(1)}%` },
    { header: 'Non-Accrual %', accessorKey: 'non_accrual_rate_pct', cell: info => `${info.getValue().toFixed(1)}%` },
    { header: '1st Lien %', accessorKey: 'first_lien_pct', cell: info => `${(info.getValue() * 100).toFixed(0)}%` },
    { header: 'NAV Prem/Dis', accessorKey: 'nav_premium_discount_pct', cell: info => `${info.getValue().toFixed(1)}%` },
    { header: 'D/E Ratio', accessorKey: 'debt_to_equity', cell: info => `${info.getValue().toFixed(2)}x` },
    { header: 'Risk Tier', accessorKey: 'risk_tier', cell: info => {
        const val = info.getValue();
        const vBadge = val === 'Conservative' ? 'second-lien' : val === 'Aggressive' ? 'non-accrual' : 'status';
        return <Badge label={val} variant={vBadge} />;
    }},
    { header: 'Yield/Risk Score', accessorKey: 'yield_risk_ratio', cell: info => <span className="font-['JetBrains_Mono'] text-[#F59E0B] font-bold bg-[#F59E0B15] px-2 py-1 rounded">{info.getValue().toFixed(2)}</span> }
  ];

  const avgYield = matrix ? matrix.reduce((acc, curr) => acc + curr.weighted_avg_yield * 100, 0) / matrix.length : 0;
  const avgNA = matrix ? matrix.reduce((acc, curr) => acc + curr.non_accrual_rate_pct, 0) / matrix.length : 0;

  const scatterData = matrix ? matrix.map(m => ({
    ticker: m.ticker,
    risk: m.non_accrual_rate_pct,
    yield: m.weighted_avg_yield * 100,
    size: m.portfolio_size_bn * 10,
    tier: m.risk_tier
  })) : [];

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col h-full bg-[#121212] border border-[#333333] rounded-[12px] overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-[#333333] bg-[#1E1E1E] flex justify-between items-center">
          <h3 className="font-['Outfit'] text-[14px] font-semibold text-[#F0F0F0] uppercase tracking-wider">Manager Comparison Matrix</h3>
        </div>
        <div className="flex-1 p-0 overflow-x-auto">
          {matrixLoading ? <LoadingSpinner /> : (
            <DataTable 
              data={matrix || []} 
              columns={columns} 
              loading={matrixLoading}
            />
          )}
        </div>
      </div>

      <ChartPanel title="Risk vs. Return Scatter Plot" subtitle="Non-Accrual % vs Weighted Avg Yield" height={500}>
        {matrixLoading ? <LoadingSpinner /> : (
          <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 text-[#10B981] font-['Outfit'] text-xs uppercase tracking-wider opacity-40 font-bold">Conservative</div>
            <div className="absolute top-4 right-4 text-[#F59E0B] font-['Outfit'] text-xs uppercase tracking-wider opacity-40 font-bold">Sweet Spot</div>
            <div className="absolute bottom-4 left-4 text-[#A0A0A0] font-['Outfit'] text-xs uppercase tracking-wider opacity-40 font-bold">Low Yield</div>
            <div className="absolute bottom-4 right-4 text-[#EF4444] font-['Outfit'] text-xs uppercase tracking-wider opacity-40 font-bold">Risk Chaser</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} vertical={false} />
                <XAxis type="number" dataKey="risk" name="Non-Accrual Rate" stroke="#A0A0A0" tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="yield" name="Yield" stroke="#A0A0A0" tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1E1E1E] border border-[#333333] rounded-lg p-3 font-['JetBrains_Mono'] text-[12px] shadow-2xl z-50">
                        <p className="text-[#F59E0B] font-bold border-b border-[#333333] pb-1 mb-2 uppercase">{data.ticker}</p>
                        <p className="text-[#F0F0F0]">Yield: {data.yield.toFixed(1)}%</p>
                        <p className="text-[#F0F0F0]">Non-Accrual: {data.risk.toFixed(1)}%</p>
                        <p className="text-[#F0F0F0]">Tier: <span style={{color: getRiskColor(data.tier)}}>{data.tier}</span></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine x={avgNA} stroke="#555555" strokeDasharray="3 3" />
                <ReferenceLine y={avgYield} stroke="#555555" strokeDasharray="3 3" />
                <Scatter name="BDCs" data={scatterData} fill="#F59E0B">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.tier)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>

      {selectedTicker && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTicker(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <BDCDeepDivePanel ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

const BDCDeepDivePanel = ({ ticker, onClose }) => {
  const { data, loading } = useApi(`/managers/deep-dive/${ticker}`);

  return (
    <div className="w-[480px] h-full bg-[#121212] border-l border-[#333333] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-[#333333] flex justify-between items-center bg-[#1E1E1E]">
        <h2 className="text-xl font-['Outfit'] text-[#F0F0F0] font-bold">
          {ticker} <span className="text-[#A0A0A0] text-sm font-normal ml-2 tracking-wide uppercase">Deep Dive</span>
        </h2>
        <button onClick={onClose} className="p-2 text-[#A0A0A0] hover:text-[#F0F0F0] rounded-lg hover:bg-[#333333] transition-all"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {loading ? <LoadingSpinner /> : data ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#333333] shadow-inner">
                 <div className="text-[11px] text-[#A0A0A0] uppercase font-bold tracking-widest">Portfolio Size</div>
                 <div className="text-2xl text-[#F0F0F0] font-['JetBrains_Mono'] mt-1 font-bold">${data.summary?.portfolio_size_bn?.toFixed(1)}B</div>
               </div>
               <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#333333] shadow-inner">
                 <div className="text-[11px] text-[#A0A0A0] uppercase font-bold tracking-widest">Risk Tier</div>
                 <div className="mt-3"><Badge label={data.summary?.risk_tier || 'N/A'} variant={data.summary?.risk_tier === 'Conservative' ? 'second-lien' : data.summary?.risk_tier === 'Aggressive' ? 'non-accrual' : 'status'} /></div>
               </div>
            </div>

            <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl overflow-hidden shadow-sm">
               <div className="bg-[#2D2D2D]/50 px-4 py-3 border-b border-[#333333] text-[11px] font-['Outfit'] font-bold text-[#A0A0A0] uppercase tracking-widest">Top 5 Portfolio Positions</div>
               <div className="divide-y divide-[#333333]">
                  {data.top_10_positions?.slice(0,5).map((pos, i) => (
                    <div key={i} className="p-4 text-sm flex justify-between items-center hover:bg-[#2D2D2D] transition-colors">
                       <span className="text-[#F0F0F0] font-medium truncate mr-4" title={pos.borrower_name}>{pos.borrower_name}</span>
                       <span className="font-['JetBrains_Mono'] text-[#F59E0B] font-bold text-base">${pos.fair_value_mm?.toFixed(1)}M</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <a href={`https://www.sec.gov/edgar/search/#/q=${ticker}&force=true`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-[#F59E0B] hover:bg-[#FCD34D] text-[#121212] font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]">
              <ExternalLink size={18} /> View SEC EDGAR Filings
            </a>
          </div>
        ) : <div className="text-center text-[#A0A0A0] mt-20 italic">Analytical data point unavailable.</div>}
      </div>
    </div>
  );
};

export default ManagerMatrixPage;
