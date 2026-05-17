import { useMemo } from 'react';
import { ShieldAlert, Zap, Layers, AlertTriangle, Search } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Cell, PieChart, Pie } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 rounded-sm shadow-xl">
        <p className="text-[11px] font-mono text-[var(--djup-text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-3 text-[12px] font-mono mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--djup-text)]">{entry.name}:</span>
            <span className="font-bold text-[var(--djup-primary)]">{entry.value.toFixed ? entry.value.toFixed(2) : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

  const COLORS = ['var(--djup-green)', 'var(--djup-primary)', 'var(--djup-red)', 'var(--djup-purple)', 'var(--djup-cyan)'];

  const naRate = stressDashboard?.universe_non_accrual_rate || 2.14;
  const distressedFV = stressDashboard?.total_distressed_fair_value_mm || 450;
  const worstBDC = stressDashboard?.worst_bdc || { ticker: 'BKCC', non_accrual_rate: 8.5 };

  const trendData = useMemo(() => {
    if (!nonAccrualTrends) return [];
    return nonAccrualTrends.map(t => ({
      ...t,
      universe_rate: t.universe_rate.toFixed(2)
    }));
  }, [nonAccrualTrends]);

  const watchColumns = [
    { header: 'BORROWER', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[var(--djup-text)]">{info.getValue()}</span> },
    { header: 'INDUSTRY', accessorKey: 'industry', cell: info => <span className="text-[var(--djup-text-muted)] text-[10px] font-mono tracking-wider uppercase">{info.getValue()}</span> },
    { header: 'LENDERS', accessorKey: 'bdc_count', cell: info => <span className="font-mono text-[var(--djup-primary)]">{info.getValue()} BDCs</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[var(--djup-text)]">${info.getValue().toFixed(1)}M</span> },
    { header: 'FAIR/PAR', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[11px] min-w-[35px] ${info.getValue() < 0.8 ? 'text-[var(--djup-red)]' : 'text-[var(--djup-primary)]'}`}>
          {(info.getValue() * 100).toFixed(1)}%
        </span>
      </div>
    )},
    { header: 'STATUS', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="NON-ACCRUAL" variant="danger" /> : <Badge label="WATCHLIST" variant="warning" /> }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-2">Risk Radar</h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Systemic risk monitoring, non-accrual trends, and stressed asset identification across the BDC universe.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <Badge label="Anomaly Detection" variant="ai" />
          <div className="px-3 py-1 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] text-[var(--djup-text)] text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm">
            Institutional View
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="UNIVERSE NON-ACCRUAL" value={`${naRate}%`} delta={0.2} highlight />
        <KPICard label="DISTRESSED EXPOSURE" value={`$${distressedFV}M`} />
        <KPICard label="BDC ALERTS (>3% NA)" value={stressDashboard?.bdc_count_above_3pct || 4} />
        <KPICard label="BOTTOM PERFORMER" value={worstBDC.ticker} delta={worstBDC.non_accrual_rate} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <TerminalPanel className="col-span-12 lg:col-span-4 h-[450px]" title="Aggregate Credit Deterioration">
          <div className="w-full h-full pt-4 pb-12">
            {trendLoading ? <LoadingSpinner /> : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="rgba(255, 190, 80, 0.05)" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} width={50} tick={{ fontSize: 10, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_rate" name="Universe Avg" fill="var(--djup-red)" opacity={0.2} radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="universe_rate" stroke="var(--djup-red)" strokeWidth={2} dot={{ r: 3, fill: 'var(--djup-red)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No trend data" />}
          </div>
        </TerminalPanel>
        
        <TerminalPanel className="col-span-12 lg:col-span-4 h-[450px]" title="NAV Premium History">
          <div className="w-full h-full pt-4 pb-12">
            {navLoading ? <LoadingSpinner /> : navHistory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={navHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="rgba(255, 190, 80, 0.05)" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} width={50} tick={{ fontSize: 10, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="universe_avg_premium_discount" name="Avg Prem/Disc">
                    {navHistory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.universe_avg_premium_discount < 0 ? 'var(--djup-red)' : 'var(--djup-green)'} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No NAV data" />}
          </div>
        </TerminalPanel>

        {/* Portfolio Distribution */}
        <TerminalPanel className="col-span-12 lg:col-span-4 h-[450px]" title="Fair Value Weighting">
          <div className="w-full h-full pt-4 pb-8">
            {fvLoading ? <LoadingSpinner /> : donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="var(--djup-bg-panel)"
                    strokeWidth={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No distribution data" />}
          </div>
        </TerminalPanel>

        <TerminalPanel className="col-span-12 h-[500px]" title="Systemic Risk Registry">
          <div className="absolute top-2 right-4 flex items-center gap-3">
             <div className="relative">
               <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--djup-text-muted)]" />
               <input type="text" placeholder="SEARCH ASSET..." className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] rounded-sm pl-6 pr-3 py-1 text-[11px] font-mono text-[var(--djup-text)] focus:outline-none focus:border-[var(--djup-primary)] transition-colors w-[200px]" />
             </div>
             <Badge label="HIGH ALERT" variant="danger" />
          </div>
          <div className="w-full h-full pb-8">
            {watchLoading ? <LoadingSpinner /> : watchlist?.length > 0 ? (
              <DataTable 
                data={watchlist} 
                columns={watchColumns} 
                loading={watchLoading}
              />
            ) : <EmptyState message="No registry data" />}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
};

export default RiskRadarPage;

