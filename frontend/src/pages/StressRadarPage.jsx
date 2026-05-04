import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert, Zap, Layers } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';

const StressRadarPage = () => {
  const { data: stressDashboard, loading: stressLoading } = useApi('/stress/dashboard');
  const { data: nonAccrualTrends, loading: trendLoading } = useApi('/stress/non-accrual');
  const { data: watchlist, loading: watchLoading } = useApi('/stress/watchlist');
  const { data: navHistory, loading: navLoading } = useApi('/stress/nav-premium');

  const naRate = stressDashboard?.universe_non_accrual_rate || 0;
  const distressedFV = stressDashboard?.total_distressed_fair_value_mm || 0;
  const worstBDC = stressDashboard?.worst_bdc;

  const trendData = useMemo(() => {
    if (!nonAccrualTrends) return [];
    return nonAccrualTrends.map(t => ({
      ...t,
      universe_rate: t.universe_rate.toFixed(2)
    }));
  }, [nonAccrualTrends]);

  const watchColumns = [
    { header: 'Borrower', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#F8FAFC]">{info.getValue()}</span> },
    { header: 'Industry', accessorKey: 'industry', cell: info => <span className="text-[#64748B] text-xs">{info.getValue()}</span> },
    { header: 'Lenders', accessorKey: 'bdc_count', cell: info => <span className="font-mono text-[var(--accent)]">{info.getValue()} BDCs</span> },
    { header: 'Exposure', accessorKey: 'total_fair_value_mm', cell: info => `$${info.getValue().toFixed(1)}M` },
    { header: 'Fair/Par', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[#1E2D45] rounded-full overflow-hidden min-w-[60px]">
          <div 
            className={`h-full ${info.getValue() < 0.8 ? 'bg-[var(--negative)]' : 'bg-[var(--warning)]'}`} 
            style={{ width: `${Math.min(100, info.getValue() * 100)}%` }} 
          />
        </div>
        <span className="font-mono text-[10px] min-w-[35px]">{(info.getValue() * 100).toFixed(1)}%</span>
      </div>
    )},
    { header: 'Status', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="Non-Accrual" variant="non-accrual" /> : <Badge label="Watchlist" variant="loan-type" /> }
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Avg Non-Accrual" value={naRate.toFixed(2)} format="percent" icon={ShieldAlert} accentColor="#F43F5E" delta={0.2} deltaLabel="q/q change" />
        <KPICard label="Distressed Exposure" value={distressedFV} format="currency" icon={Zap} accentColor="#F59E0B" />
        <KPICard label="BDCs > 3% Non-Accrual" value={stressDashboard?.bdc_count_above_3pct} icon={AlertTriangle} accentColor="#F97316" />
        <KPICard label="Worst Performer" value={worstBDC?.ticker || '-'} delta={worstBDC?.non_accrual_rate} deltaLabel="NA Rate" icon={Layers} accentColor="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <ChartPanel title="Universe Non-Accrual Trends" subtitle="Aggregate non-accrual rate across all monitored BDCs" height={400}>
            {trendLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_rate" name="Universe Avg" fill="url(#stressGradient)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="universe_rate" stroke="var(--negative)" strokeWidth={3} dot={{ r: 4, fill: 'var(--negative)' }} />
                  <defs>
                    <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--negative)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
        
        <div className="lg:col-span-4">
          <ChartPanel title="NAV Premium/Discount" subtitle="Market sentiment vs reported book value" height={400}>
            {navLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={navHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_avg_premium_discount" name="Avg Prem/Disc">
                    {navHistory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.universe_avg_premium_discount < 0 ? 'var(--negative)' : 'var(--positive)'} opacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
      </div>

      <div className="premium-card bg-[#0D1424]/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-[#1E2D45] flex justify-between items-center bg-[#0D1424]/40">
          <div>
            <h3 className="font-['Outfit'] text-[18px] font-bold text-[#F8FAFC]">Systemic Watchlist</h3>
            <p className="text-[11px] text-[#64748B] uppercase tracking-widest mt-1 font-bold">Borrowers with exposure across 2+ BDCs or marked as non-accrual</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-[10px] text-[#475569] font-bold uppercase mr-2">Filter Status:</div>
             <Badge label="All Alerts" variant="status" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {watchLoading ? <LoadingSpinner /> : (
            <DataTable 
              data={watchlist || []} 
              columns={watchColumns} 
              loading={watchLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StressRadarPage;
