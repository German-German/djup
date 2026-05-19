import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import AIInsightCard from '../components/ui/AIInsightCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

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

const DealFlowPage = () => {
  const { data: trends, loading: trendsLoading } = useApi('/dealflow/trends');
  const { data: bySector, loading: sectorLoading } = useApi('/dealflow/by-sector');
  const { data: holdSizes, loading: holdLoading } = useApi('/dealflow/hold-sizes');

  const latestTrend = trends && trends.length > 0 ? trends[trends.length - 1] : { total_new_originations_bn: 12.4, net_deployment_bn: 4.2, avg_new_origination_yield: 0.114 };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--djup-text)] tracking-tight mb-2">Deal Intelligence</h1>
          <p className="text-[14px] text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Market liquidity, deployment velocity, and origination breakdown across the private credit ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <Badge label="Institutional" />
        </div>
      </div>

      <AIInsightCard
        page="dealflow"
        ready={!!trends}
        context={{
          latest_quarter: latestTrend?.quarter_label,
          originations_bn: latestTrend?.total_new_originations_bn,
          repayments_bn: latestTrend?.total_repayments_bn,
          net_deployment_bn: latestTrend?.net_deployment_bn,
          avg_yield: latestTrend?.avg_new_origination_yield,
          top_sectors: (bySector || []).slice(0, 6).map(s => ({ industry: s.industry, fv_mm: s.fair_value_mm, pct: s.pct_of_total })),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="GROSS ORIGINATIONS (Q)" value={`$${latestTrend?.total_new_originations_bn}B`} loading={trendsLoading && !trends} highlight />
        <KPICard label="NET DEPLOYMENT (Q)" value={`$${latestTrend?.net_deployment_bn}B`} />
        <KPICard label="AVG NEW LOAN YIELD" value={`${(latestTrend?.avg_new_origination_yield * 100).toFixed(2)}%`} delta={0.12} />
      </div>

      <TerminalPanel className="w-full h-[450px]" title="Origination & Repayment Activity">
        <div className="w-full h-full pt-4 pb-12">
          {trendsLoading ? <LoadingSpinner /> : trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" vertical={false} horizontal={false} />
                <XAxis dataKey="quarter_label" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} width={50} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />
                <Bar yAxisId="left" dataKey="total_new_originations_bn" name="Originations" fill="var(--djup-primary)" radius={[2, 2, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="left" dataKey="total_repayments_bn" name="Repayments" fill="var(--djup-border-strong)" radius={[2, 2, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="net_deployment_bn" name="Net Deployment" stroke="var(--djup-green)" strokeWidth={2} dot={{ r: 3, fill: 'var(--djup-green)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No trend data" />}
        </div>
      </TerminalPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerminalPanel className="h-[450px]" title="New Origination by Sector">
          <div className="w-full h-full pt-4 pb-8 pr-4">
            {sectorLoading ? <LoadingSpinner /> : bySector?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={bySector || []} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" horizontal={false} vertical={false} />
                  <XAxis type="number" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}M`} dy={5} />
                  <YAxis dataKey="industry" type="category" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fair_value_mm" name="Origination Vol" fill="var(--djup-cyan)" radius={[0, 2, 2, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No sector data" />}
          </div>
        </TerminalPanel>

        <TerminalPanel className="h-[450px]" title="Average Hold Size Trend">
          <div className="w-full h-full pt-4 pb-8 pr-4">
            {holdLoading ? <LoadingSpinner /> : holdSizes?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={holdSizes || []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" vertical={false} horizontal={false} />
                  <XAxis dataKey="quarter" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}M`} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />
                  <Line type="monotone" dataKey="avg_loan_size" name="Average Hold" stroke="var(--djup-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--djup-primary)' }} />
                  <Line type="monotone" dataKey="median_loan_size" name="Median Hold" stroke="var(--djup-purple)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No hold size data" />}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
};

export default DealFlowPage;
