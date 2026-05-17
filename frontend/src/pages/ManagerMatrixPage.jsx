import { useState } from 'react';
import TerminalPanel from '../components/ui/TerminalPanel';
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
      case 'Conservative': return 'var(--djup-green)';
      case 'Balanced': return 'var(--djup-primary)';
      case 'Aggressive': return 'var(--djup-red)';
      default: return 'var(--djup-cyan)';
    }
  };

  const columns = [
    { header: 'TICKER', accessorKey: 'ticker', cell: info => <span className="font-mono font-bold text-[var(--djup-primary)] cursor-pointer hover:underline" onClick={() => setSelectedTicker(info.getValue())}>{info.getValue()}</span> },
    { header: 'BDC NAME', accessorKey: 'bdc_name', cell: info => <span className="font-bold text-[var(--djup-text)]">{info.getValue()}</span> },
    { header: 'PORTFOLIO SIZE', accessorKey: 'portfolio_size_bn', cell: info => <span className="font-mono">${info.getValue().toFixed(1)}B</span> },
    { header: 'AVG YIELD', accessorKey: 'weighted_avg_yield', cell: info => <span className="font-mono text-[var(--djup-green)]">{(info.getValue() * 100).toFixed(1)}%</span> },
    { header: 'NON-ACCRUAL %', accessorKey: 'non_accrual_rate_pct', cell: info => <span className="font-mono text-[var(--djup-red)]">{info.getValue().toFixed(1)}%</span> },
    { header: '1ST LIEN %', accessorKey: 'first_lien_pct', cell: info => <span className="font-mono">{(info.getValue() * 100).toFixed(0)}%</span> },
    { header: 'NAV PREM/DIS', accessorKey: 'nav_premium_discount_pct', cell: info => <span className="font-mono">{info.getValue().toFixed(1)}%</span> },
    { header: 'D/E RATIO', accessorKey: 'debt_to_equity', cell: info => <span className="font-mono">{info.getValue().toFixed(2)}x</span> },
    { header: 'RISK TIER', accessorKey: 'risk_tier', cell: info => {
        const val = info.getValue();
        const vBadge = val === 'Conservative' ? 'second-lien' : val === 'Aggressive' ? 'non-accrual' : 'status';
        return <Badge label={val} variant={vBadge} />;
    }},
    { header: 'YIELD/RISK', accessorKey: 'yield_risk_ratio', cell: info => <span className="font-mono text-[var(--djup-primary)] font-bold bg-[var(--djup-primary-soft)] px-2 py-0.5 border border-[var(--djup-primary)] border-opacity-30 rounded-[2px]">{info.getValue().toFixed(2)}</span> }
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
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-2">Manager Matrix</h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Manager Dispersion Plot: Multi-dimensional BDC analysis comparing yield profile, portfolio safety, leverage ratios, and pricing deviations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <div className="px-3 py-1 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] text-[var(--djup-text)] text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm">
            Institutional View
          </div>
        </div>
      </div>

      <TerminalPanel className="h-[400px]" title="Manager Comparison Matrix">
        <div className="w-full h-full overflow-y-auto pb-8">
          {matrixLoading ? <LoadingSpinner /> : (
            <DataTable 
              data={matrix || []} 
              columns={columns} 
              loading={matrixLoading}
            />
          )}
        </div>
      </TerminalPanel>

      <TerminalPanel className="h-[500px]" title="Risk vs. Return Scatter Plot">
        {matrixLoading ? <LoadingSpinner /> : (
          <div className="w-full h-full relative pt-8 pb-12 pr-4">
            <div className="absolute top-12 left-6 text-[var(--djup-green)] font-mono text-[10px] uppercase tracking-widest opacity-60 font-bold border border-[var(--djup-green)] border-opacity-30 bg-[rgba(0,255,138,0.05)] px-2 py-0.5 rounded-[2px]">Conservative</div>
            <div className="absolute top-12 right-6 text-[var(--djup-primary)] font-mono text-[10px] uppercase tracking-widest opacity-60 font-bold border border-[var(--djup-primary)] border-opacity-30 bg-[var(--djup-primary-soft)] px-2 py-0.5 rounded-[2px]">Sweet Spot</div>
            <div className="absolute bottom-16 left-6 text-[var(--djup-text-muted)] font-mono text-[10px] uppercase tracking-widest opacity-60 font-bold border border-[var(--djup-border)] bg-[var(--djup-bg-panel)] px-2 py-0.5 rounded-[2px]">Low Yield</div>
            <div className="absolute bottom-16 right-6 text-[var(--djup-red)] font-mono text-[10px] uppercase tracking-widest opacity-60 font-bold border border-[var(--djup-red)] border-opacity-30 bg-[rgba(255,107,107,0.05)] px-2 py-0.5 rounded-[2px]">Risk Chaser</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" horizontal={false} vertical={false} />
                <XAxis type="number" dataKey="risk" name="Non-Accrual Rate" stroke="var(--djup-text-muted)" tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                <YAxis type="number" dataKey="yield" name="Yield" stroke="var(--djup-text-muted)" tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} width={45} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 font-mono text-[11px] shadow-2xl z-50">
                        <p className="text-[var(--djup-primary)] font-bold border-b border-[var(--djup-border)] pb-1 mb-2 uppercase">{data.ticker}</p>
                        <p className="text-[var(--djup-text)]">Yield: {data.yield.toFixed(1)}%</p>
                        <p className="text-[var(--djup-text)]">Non-Accrual: {data.risk.toFixed(1)}%</p>
                        <p className="text-[var(--djup-text-muted)]">Tier: <span style={{color: getRiskColor(data.tier)}}>{data.tier}</span></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine x={avgNA} stroke="rgba(255, 190, 80, 0.15)" strokeDasharray="3 3" />
                <ReferenceLine y={avgYield} stroke="rgba(255, 190, 80, 0.15)" strokeDasharray="3 3" />
                <Scatter name="BDCs" data={scatterData} fill="var(--djup-primary)">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.tier)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </TerminalPanel>

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
    <div className="w-[480px] h-full bg-[var(--djup-bg-panel)] border-l border-[var(--djup-border)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-[var(--djup-border)] flex justify-between items-center bg-[var(--djup-bg-panel-elevated)]">
        <h2 className="text-[16px] font-bold text-[var(--djup-text)] tracking-tight">
          {ticker} <span className="text-[var(--djup-text-muted)] text-[11px] font-mono font-normal ml-2 tracking-wide uppercase">[DEEP DIVE]</span>
        </h2>
        <button onClick={onClose} className="p-1.5 text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] border border-[var(--djup-border)] bg-[var(--djup-bg-main)] hover:bg-[var(--djup-bg-panel-elevated)] rounded-sm transition-all"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? <LoadingSpinner /> : data ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[var(--djup-bg-main)] p-4 rounded-sm border border-[var(--djup-border)]">
                 <div className="text-[10px] font-mono text-[var(--djup-text-muted)] uppercase tracking-wider">Portfolio Size</div>
                 <div className="text-xl text-[var(--djup-text)] font-mono mt-1 font-bold">${data.summary?.portfolio_size_bn?.toFixed(1)}B</div>
               </div>
               <div className="bg-[var(--djup-bg-main)] p-4 rounded-sm border border-[var(--djup-border)] flex flex-col justify-between">
                 <div className="text-[10px] font-mono text-[var(--djup-text-muted)] uppercase tracking-wider">Risk Tier</div>
                 <div className="mt-2"><Badge label={data.summary?.risk_tier || 'N/A'} variant={data.summary?.risk_tier === 'Conservative' ? 'second-lien' : data.summary?.risk_tier === 'Aggressive' ? 'danger' : 'warning'} /></div>
               </div>
            </div>

            <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] rounded-sm overflow-hidden">
               <div className="bg-[var(--djup-bg-panel-elevated)] px-4 py-2.5 border-b border-[var(--djup-border)] text-[10px] font-mono font-bold text-[var(--djup-text-muted)] uppercase tracking-wider">Top 5 Portfolio Positions</div>
               <div className="divide-y divide-[var(--djup-border)]">
                  {data.top_10_positions?.slice(0,5).map((pos, i) => (
                    <div key={i} className="p-4 text-[12px] font-mono flex justify-between items-center hover:bg-[var(--djup-bg-panel-elevated)] transition-colors">
                       <span className="text-[var(--djup-text)] font-medium truncate mr-4" title={pos.borrower}>{pos.borrower}</span>
                       <span className="text-[var(--djup-primary)] font-bold">${pos.fair_value_mm?.toFixed(1)}M</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <a href={`https://www.sec.gov/edgar/search/#/q=${ticker}&force=true`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-soft)] hover:text-[var(--djup-primary)] text-[var(--djup-bg-main)] font-mono font-bold text-[12px] border border-[var(--djup-primary)] rounded-sm transition-all shadow-lg shadow-amber-500/5 active:scale-[0.98]">
              <ExternalLink size={14} /> View SEC EDGAR Filings
            </a>
          </div>
        ) : <div className="text-center text-[var(--djup-text-muted)] mt-20 italic font-mono text-[11px]">Analytical data point unavailable.</div>}
      </div>
    </div>
  );
};

export default ManagerMatrixPage;
