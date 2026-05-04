import React, { useMemo } from 'react';
import { ShieldAlert, Zap, Layers, AlertTriangle, Search } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Cell } from 'recharts';

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
    { header: 'BORROWER', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#EAECEF]">{info.getValue()}</span> },
    { header: 'INDUSTRY', accessorKey: 'industry', cell: info => <span className="text-[#848E9C] text-xs uppercase">{info.getValue()}</span> },
    { header: 'LENDERS', accessorKey: 'bdc_count', cell: info => <span className="font-mono text-[#FCD535]">{info.getValue()} BDCs</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[#EAECEF]">${info.getValue().toFixed(1)}M</span> },
    { header: 'FAIR/PAR', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[11px] min-w-[35px] ${info.getValue() < 0.8 ? 'text-[#F6465D]' : 'text-[#F0B90B]'}`}>
          {(info.getValue() * 100).toFixed(1)}%
        </span>
      </div>
    )},
    { header: 'STATUS', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="NON-ACCRUAL" variant="non-accrual" /> : <Badge label="WATCHLIST" variant="status" /> }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="UNIVERSE NON-ACCRUAL" value={naRate.toFixed(2)} format="percent" icon={ShieldAlert} accentColor="#F6465D" delta={0.2} />
        <KPICard label="DISTRESSED EXPOSURE" value={distressedFV} format="currency" icon={Zap} accentColor="#FCD535" />
        <KPICard label="BDC ALERTS (>3% NA)" value={stressDashboard?.bdc_count_above_3pct} icon={AlertTriangle} accentColor="#F0B90B" />
        <KPICard label="BOTTOM PERFORMER" value={worstBDC?.ticker || '-'} delta={worstBDC?.non_accrual_rate} deltaLabel="NA Rate" icon={Layers} accentColor="#8B5CF6" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 h-[450px]">
          <ChartPanel title="Aggregate Credit Deterioration" subtitle="Historical non-accrual trend line">
            {trendLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2F36" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_rate" name="Universe Avg" fill="#F6465D" opacity={0.3} radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="universe_rate" stroke="#F6465D" strokeWidth={3} dot={{ r: 4, fill: '#F6465D' }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
        
        <div className="col-span-12 lg:col-span-4 h-[450px]">
          <ChartPanel title="NAV Premium History" subtitle="Market valuation of BDC equity vs book value">
            {navLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={navHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2F36" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_avg_premium_discount" name="Avg Prem/Disc">
                    {navHistory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.universe_avg_premium_discount < 0 ? '#F6465D' : '#0ECB81'} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        <div className="col-span-12 binance-panel overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#2B2F36] flex justify-between items-center bg-[#1E2329]/50">
            <div className="flex flex-col">
               <h3 className="font-bold text-[14px] text-[#EAECEF] uppercase tracking-wider">Systemic Risk Registry</h3>
               <span className="text-[10px] text-[#848E9C] font-bold">MONITORING CROSS-LENDER DEFAULTS</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#474D57]" />
                 <input type="text" placeholder="SEARCH ASSET..." className="bg-[#0B0E11] border border-[#2B2F36] rounded px-8 py-1.5 text-xs text-[#EAECEF] focus:outline-none focus:border-[#FCD535]" />
               </div>
               <Badge label="HIGH ALERT" variant="non-accrual" />
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
    </div>
  );
};

export default StressRadarPage;
