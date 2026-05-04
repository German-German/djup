import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, Activity, BarChart2, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const OverviewPage = () => {
  const { data: yieldOverview, loading: yieldLoading } = useApi('/yields/overview');
  const { data: stressDashboard, loading: stressLoading } = useApi('/stress/dashboard');
  const { data: dealflowTrends, loading: dfLoading } = useApi('/dealflow/trends');
  const { data: navPremium, loading: navLoading } = useApi('/stress/nav-premium');
  const { data: yieldTimeSeries, loading: tsLoading } = useApi('/yields/time-series');
  const { data: fvDist, loading: fvLoading } = useApi('/stress/fair-value-dist');
  const { data: watchlist, loading: watchLoading } = useApi('/stress/watchlist');
  const { data: macroOverlay, loading: macroLoading } = useApi('/macro/overlay?series=hy_spread');

  const wtdAvgYield = yieldOverview?.overall_weighted_yield ? (yieldOverview.overall_weighted_yield * 100).toFixed(2) : null;
  const nonAccrual = stressDashboard?.universe_non_accrual_rate ? stressDashboard.universe_non_accrual_rate.toFixed(2) : null;
  const netDeployment = dealflowTrends && dealflowTrends.length > 0 ? dealflowTrends[0].net_deployment_bn : null;
  
  let avgNav = null;
  if (navPremium && navPremium.length > 0) {
    avgNav = navPremium[navPremium.length - 1].universe_avg_premium_discount;
  }

  const combinedTimeSeries = useMemo(() => {
    if (!yieldTimeSeries) return [];
    
    return yieldTimeSeries.map(q => {
      const macroPoint = macroOverlay?.reduce((prev, curr) => {
        return curr; 
      }, null);

      return {
        ...q,
        overall_yield: q.overall_yield * 100,
        first_lien_yield: q.first_lien_yield * 100,
        unitranche_yield: q.unitranche_yield * 100,
        second_lien_yield: q.second_lien_yield * 100,
        hy_spread: macroPoint?.values?.hy_spread || null
      };
    });
  }, [yieldTimeSeries, macroOverlay]);

  const donutData = useMemo(() => {
    if (!fvDist) return [];
    return Object.keys(fvDist).map(k => ({
      name: k.split(' (')[0].replace('_', ' '),
      value: fvDist[k].fair_value
    })).filter(d => d.value > 0);
  }, [fvDist]);

  const COLORS = ['#10B981', '#F59E0B', '#F97316', '#F43F5E', '#8B5CF6'];

  const watchColumns = [
    { header: 'Borrower', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#F8FAFC]">{info.getValue()}</span> },
    { header: 'Exposure', accessorKey: 'total_fair_value_mm', cell: info => `$${info.getValue().toFixed(1)}M` },
    { header: 'Fair/Par', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 bg-[#1E2D45] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(100, info.getValue() * 100)}%` }} />
        </div>
        <span className="font-mono text-[10px]">{(info.getValue() * 100).toFixed(1)}%</span>
      </div>
    )},
    { header: 'Status', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="Non-Accrual" variant="non-accrual" /> : <Badge label="Performing" variant="loan-type" /> }
  ];

  const hasData = yieldTimeSeries && yieldTimeSeries.length > 0;

  if (!hasData && !yieldLoading && !tsLoading) {
    return <EmptyState title="No Market Data Available" description="Initialize the data pipeline to begin monitoring private credit markets." icon={Globe} />;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Avg Market Yield" value={wtdAvgYield} format="percent" icon={TrendingUp} accentColor="#00C8E0" loading={yieldLoading} delta={1.2} deltaLabel="vs prev Q" />
        <KPICard label="Non-Accrual Rate" value={nonAccrual} format="percent" icon={AlertTriangle} accentColor="#F43F5E" loading={stressLoading} delta={-0.4} />
        <KPICard label="Net Q Deployment" value={netDeployment} format="currency" icon={Activity} accentColor="#10B981" loading={dfLoading} />
        <KPICard label="NAV Premium/Discount" value={avgNav !== null ? avgNav.toFixed(2) : null} format="percent" icon={BarChart2} accentColor="#8B5CF6" loading={navLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <ChartPanel title="Yield Compression & Benchmark Trends" subtitle="Quarterly yields vs High Yield Index spreads" height={400}>
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C8E0" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00C8E0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" verticalAlign="top" align="right" height={36}/>
                  <Area type="monotone" dataKey="first_lien_yield" name="First Lien" stroke="#00C8E0" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                  <Line type="monotone" dataKey="hy_spread" name="HY Spread (bps)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
        
        <div className="lg:col-span-4">
          <ChartPanel title="Portfolio Fair Value" subtitle="Distribution by par-recovery status" height={400}>
            {fvLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartPanel title="Net Origination Trends" subtitle="New deployments vs repayments ($ Billions)" height={350}>
          {dfLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealflowTrends ? [...dealflowTrends].reverse() : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter_label" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar dataKey="total_new_originations_bn" name="Originations" fill="#00C8E0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_repayments_bn" name="Repayments" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
        
        <div className="premium-card overflow-hidden flex flex-col h-full bg-[#0D1424]/20">
          <div className="px-6 py-5 border-b border-[#1E2D45] flex justify-between items-center">
            <h3 className="font-['Outfit'] text-[15px] font-bold text-[#F8FAFC]">Priority Stressed Assets</h3>
            <Link to="/stress" className="text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">View Full Radar &rarr;</Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px]">
            {watchLoading ? <LoadingSpinner /> : (
              <DataTable 
                data={watchlist ? watchlist.slice(0, 6) : []} 
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

export default OverviewPage;
