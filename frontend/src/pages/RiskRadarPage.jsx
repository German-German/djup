import { useMemo } from 'react';
import { ShieldAlert, Zap, Layers, AlertTriangle, Search } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Cell, PieChart, Pie } from 'recharts';

const RiskRadarPage = () => {
  const { data: stressDashboard } = useApi('/stress/dashboard');
  const { data: nonAccrualTrends, loading: trendLoading } = useApi('/stress/non-accrual');
  const { data: watchlist, loading: watchLoading } = useApi('/stress/watchlist');
  const { data: navHistory, loading: navLoading } = useApi('/stress/nav-premium');
  const { data: fvDist, loading: fvLoading } = useApi('/stress/fair-value-dist');

  const donutData = useMemo(() => {
    if (!fvDist) return [];
    return Object.keys(fvDist).map(k => ({
      name: k.replace('_', ' '),
      value: fvDist[k].fair_value
    })).filter(d => d.value > 0);
  }, [fvDist]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#32D7FF'];

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
    { header: 'BORROWER', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#F0F0F0]">{info.getValue()}</span> },
    { header: 'INDUSTRY', accessorKey: 'industry', cell: info => <span className="text-[#A0A0A0] text-xs uppercase">{info.getValue()}</span> },
    { header: 'LENDERS', accessorKey: 'bdc_count', cell: info => <span className="font-mono text-[#F59E0B]">{info.getValue()} BDCs</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[#F0F0F0]">${info.getValue().toFixed(1)}M</span> },
    { header: 'FAIR/PAR', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[11px] min-w-[35px] ${info.getValue() < 0.8 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
          {(info.getValue() * 100).toFixed(1)}%
        </span>
      </div>
    )},
    { header: 'STATUS', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="NON-ACCRUAL" variant="non-accrual" /> : <Badge label="WATCHLIST" variant="status" /> }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="UNIVERSE NON-ACCRUAL" value={naRate.toFixed(2)} format="percent" icon={ShieldAlert} accentColor="#EF4444" delta={0.2} />
        <KPICard label="DISTRESSED EXPOSURE" value={distressedFV} format="currency" icon={Zap} accentColor="#F59E0B" />
        <KPICard label="BDC ALERTS (>3% NA)" value={stressDashboard?.bdc_count_above_3pct} icon={AlertTriangle} accentColor="#FCD34D" />
        <KPICard label="BOTTOM PERFORMER" value={worstBDC?.ticker || '-'} delta={worstBDC?.non_accrual_rate} deltaLabel="NA Rate" icon={Layers} accentColor="#8B5CF6" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 h-[450px]">
          <ChartPanel title="Aggregate Credit Deterioration" subtitle="Historical non-accrual trend line">
            {trendLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#333333" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_rate" name="Universe Avg" fill="#EF4444" opacity={0.3} radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="universe_rate" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} />
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#333333" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_avg_premium_discount" name="Avg Prem/Disc">
                    {navHistory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.universe_avg_premium_discount < 0 ? '#EF4444' : '#10B981'} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        {/* Portfolio Distribution */}
        <div className="col-span-12 lg:col-span-4 h-[450px]">
          <ChartPanel title="Fair Value Weighting" subtitle="Distribution by asset status">
            {fvLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#1E1E1E"
                    strokeWidth={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        <div className="col-span-12 binance-panel overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#333333] flex justify-between items-center bg-[#1E1E1E]">
            <div className="flex flex-col">
               <h3 className="font-bold text-[14px] text-[#F0F0F0] uppercase tracking-wider">Systemic Risk Registry</h3>
               <span className="text-[10px] text-[#A0A0A0] font-bold">MONITORING CROSS-LENDER DEFAULTS</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
                 <input type="text" placeholder="SEARCH ASSET..." className="bg-[#121212] border border-[#333333] rounded px-8 py-1.5 text-xs text-[#F0F0F0] focus:outline-none focus:border-[#F59E0B]" />
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

export default RiskRadarPage;

