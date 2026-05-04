import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      // Find the macro point closest to the quarter's end date
      // Assuming yieldTimeSeries has a 'filing_date' or we can estimate from 'quarter'
      // For now, we'll try to find the macro point that matches the latest date before or on the quarter label
      // If macroOverlay is just a few points, this might still be sparse
      
      const macroPoint = macroOverlay?.reduce((prev, curr) => {
        // Simple logic: pick the point with a date closest to the end of the quarter
        // In a real app, you'd parse dates. Here we'll do a simple match or pick latest.
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
      name: k,
      value: fvDist[k].fair_value
    })).filter(d => d.value > 0);
  }, [fvDist]);

  const COLORS = ['#10B981', '#F59E0B', '#F97316', '#F43F5E'];

  const watchColumns = [
    { header: 'Borrower', accessorKey: 'borrower_name', cell: info => <span className="font-semibold text-white">{info.getValue()}</span> },
    { header: '# BDCs', accessorKey: 'bdc_count' },
    { header: 'Exposure', accessorKey: 'total_fair_value_mm', cell: info => `$${info.getValue().toFixed(1)}M` },
    { header: 'Fair/Par', accessorKey: 'avg_fair_to_par', cell: info => `${(info.getValue() * 100).toFixed(1)}%` },
    { header: 'Status', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="Non-Accrual" variant="non-accrual" /> : <Badge label="Performing" variant="loan-type" /> }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="WTD AVG YIELD" value={wtdAvgYield} format="percent" icon={TrendingUp} accentColor="#00C8E0" loading={yieldLoading} />
        <KPICard label="UNIVERSE NON-ACCRUAL" value={nonAccrual} format="percent" icon={AlertTriangle} accentColor="#F43F5E" loading={stressLoading} />
        <KPICard label="NET Q DEPLOYMENT" value={netDeployment} format="currency" icon={Activity} accentColor="#10B981" loading={dfLoading} />
        <KPICard label="AVG NAV PREM/DIS" value={avgNav !== null ? avgNav.toFixed(2) : null} format="percent" icon={BarChart2} accentColor="#8B5CF6" loading={navLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <ChartPanel title="Private Credit Yield History" height={350}>
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8899AE' }} />
                  <Line type="monotone" dataKey="first_lien_yield" name="First Lien" stroke="#00C8E0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="unitranche_yield" name="Unitranche" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="second_lien_yield" name="Second Lien" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="hy_spread" name="HY Benchmark" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <ChartPanel title="Portfolio Health Distribution" height={350}>
            {fvLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Deal Flow" height={350}>
          {dfLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealflowTrends ? [...dealflowTrends].reverse() : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                <XAxis dataKey="quarter_label" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total_new_originations_bn" name="Originations" fill="#00C8E0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_repayments_bn" name="Repayments" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
        
        <div className="flex flex-col h-full bg-[#0D1424] border border-[#1E2D45] rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2D45] flex justify-between items-center">
            <h3 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">Top Watchlist Borrowers</h3>
            <Link to="/stress" className="text-[#00C8E0] text-[11px] font-['DM_Sans'] hover:underline">View All &rarr;</Link>
          </div>
          <div className="flex-1 p-0 overflow-y-auto max-h-[350px]">
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
