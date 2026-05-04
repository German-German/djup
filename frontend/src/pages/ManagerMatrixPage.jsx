import React, { useState } from 'react';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
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
      case 'Aggressive': return '#F43F5E';
      default: return '#00C8E0';
    }
  };

  const columns = [
    { header: 'Ticker', accessorKey: 'ticker', cell: info => <span className="font-semibold text-[#00C8E0] cursor-pointer hover:underline" onClick={() => setSelectedTicker(info.getValue())}>{info.getValue()}</span> },
    { header: 'BDC Name', accessorKey: 'bdc_name' },
    { header: 'Portfolio Size', accessorKey: 'portfolio_size_bn', cell: info => `$${info.getValue().toFixed(1)}B` },
    { header: 'Avg Yield', accessorKey: 'weighted_avg_yield', cell: info => `${(info.getValue() * 100).toFixed(1)}%` },
    { header: 'Non-Accrual %', accessorKey: 'non_accrual_rate_pct', cell: info => `${info.getValue().toFixed(1)}%` },
    { header: '1st Lien %', accessorKey: 'first_lien_pct', cell: info => `${(info.getValue() * 100).toFixed(0)}%` },
    { header: 'NAV Prem/Dis', accessorKey: 'nav_premium_discount_pct', cell: info => `${info.getValue().toFixed(1)}%` },
    { header: 'D/E Ratio', accessorKey: 'debt_to_equity', cell: info => `${info.getValue().toFixed(2)}x` },
    { header: 'Risk Tier', accessorKey: 'risk_tier', cell: info => {
        const val = info.getValue();
        const vBadge = val === 'Conservative' ? 'second-lien' : val === 'Aggressive' ? 'non-accrual' : 'warning';
        return <Badge label={val} variant={vBadge} />;
    }},
    { header: 'Yield/Risk Score', accessorKey: 'yield_risk_ratio', cell: info => <span className="font-['JetBrains_Mono'] text-[#00C8E0] font-bold bg-[#00C8E015] px-2 py-1 rounded">{info.getValue().toFixed(2)}</span> }
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
      <div className="flex flex-col h-full bg-[#0D1424] border border-[#1E2D45] rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2D45] flex justify-between items-center">
          <h3 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">Manager Comparison Matrix</h3>
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
            <div className="absolute top-4 left-4 text-[#10B981] font-['DM_Sans'] text-xs uppercase tracking-wider opacity-60 font-bold">Conservative</div>
            <div className="absolute top-4 right-4 text-[#00C8E0] font-['DM_Sans'] text-xs uppercase tracking-wider opacity-60 font-bold">Sweet Spot</div>
            <div className="absolute bottom-4 left-4 text-[#8899AE] font-['DM_Sans'] text-xs uppercase tracking-wider opacity-60 font-bold">Low Yield</div>
            <div className="absolute bottom-4 right-4 text-[#F43F5E] font-['DM_Sans'] text-xs uppercase tracking-wider opacity-60 font-bold">Risk Chaser</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                <XAxis type="number" dataKey="risk" name="Non-Accrual Rate" stroke="#8899AE" tickFormatter={(val) => `${val}%`} />
                <YAxis type="number" dataKey="yield" name="Yield" stroke="#8899AE" tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0D1424] border border-[#334155] rounded p-3 font-['JetBrains_Mono'] text-[12px] shadow-lg z-50">
                        <p className="text-[#00C8E0] font-bold border-b border-[#1E2D45] pb-1 mb-2">{data.ticker}</p>
                        <p className="text-[#E8EDF5]">Yield: {data.yield.toFixed(1)}%</p>
                        <p className="text-[#E8EDF5]">Non-Accrual: {data.risk.toFixed(1)}%</p>
                        <p className="text-[#E8EDF5]">Tier: <span style={{color: getRiskColor(data.tier)}}>{data.tier}</span></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine x={avgNA} stroke="#E8EDF5" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={avgYield} stroke="#E8EDF5" strokeDasharray="3 3" opacity={0.5} />
                <Scatter name="BDCs" data={scatterData} fill="#00C8E0">
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <BDCDeepDivePanel ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
        </div>
      )}
    </div>
  );
};

const BDCDeepDivePanel = ({ ticker, onClose }) => {
  const { data, loading } = useApi(`/managers/deep-dive/${ticker}`);

  return (
    <div className="w-[480px] h-full bg-[#0D1424] border-l border-[#1E2D45] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-[#1E2D45] flex justify-between items-center bg-[#111827]">
        <h2 className="text-xl font-['DM_Sans'] text-[#E8EDF5] font-bold">
          {ticker} <span className="text-[#8899AE] text-sm font-normal ml-2">Deep Dive</span>
        </h2>
        <button onClick={onClose} className="p-1 text-[#8899AE] hover:text-[#E8EDF5] rounded hover:bg-[#1E2D45] transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? <LoadingSpinner /> : data ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#111827] p-3 rounded border border-[#1E2D45]">
                 <div className="text-[11px] text-[#8899AE] uppercase tracking-wider">Portfolio Size</div>
                 <div className="text-lg text-[#E8EDF5] font-['JetBrains_Mono'] mt-1">${data.summary?.portfolio_size_bn?.toFixed(1)}B</div>
               </div>
               <div className="bg-[#111827] p-3 rounded border border-[#1E2D45]">
                 <div className="text-[11px] text-[#8899AE] uppercase tracking-wider">Risk Tier</div>
                 <div className="text-sm font-bold text-[#E8EDF5] mt-2"><Badge label={data.summary?.risk_tier || 'N/A'} variant={data.summary?.risk_tier === 'Conservative' ? 'second-lien' : data.summary?.risk_tier === 'Aggressive' ? 'non-accrual' : 'warning'} /></div>
               </div>
            </div>

            <div className="border border-[#1E2D45] rounded overflow-hidden">
               <div className="bg-[#111827] px-3 py-2 border-b border-[#1E2D45] text-[11px] font-['DM_Sans'] font-semibold text-[#8899AE] uppercase tracking-wider">Top 5 Positions</div>
               <div className="divide-y divide-[#1E2D45]">
                  {data.top_10_positions?.slice(0,5).map((pos, i) => (
                    <div key={i} className="p-3 text-sm flex justify-between items-center bg-[#0D1424]">
                       <span className="text-[#E8EDF5] truncate mr-2" title={pos.borrower_name}>{pos.borrower_name}</span>
                       <span className="font-['JetBrains_Mono'] text-[#00C8E0]">${pos.fair_value_mm?.toFixed(1)}M</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <a href={`https://www.sec.gov/edgar/search/#/q=${ticker}&force=true`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-[#111827] hover:bg-[#1E2D45] border border-[#1E2D45] text-[#00C8E0] font-semibold text-sm rounded transition-colors mt-4">
              <ExternalLink size={16} /> View SEC Filings
            </a>
          </div>
        ) : <div className="text-center text-[#8899AE] mt-10">No data available.</div>}
      </div>
    </div>
  );
};

export default ManagerMatrixPage;
