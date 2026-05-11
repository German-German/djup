<<<<<<< HEAD
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe,
  Info,
  Maximize2
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, 
  ReferenceLine, ComposedChart, Line
} from 'recharts';

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
    return yieldTimeSeries.map(q => ({
      ...q,
      overall_yield: q.overall_yield * 100,
      first_lien_yield: q.first_lien_yield * 100,
      hy_spread: macroOverlay?.[0]?.values?.hy_spread || 450
    }));
  }, [yieldTimeSeries, macroOverlay]);

  const donutData = useMemo(() => {
    if (!fvDist) return [];
    return Object.keys(fvDist).map(k => ({
      name: k.replace('_', ' '),
      value: fvDist[k].fair_value
    })).filter(d => d.value > 0);
  }, [fvDist]);

  const COLORS = ['#0ECB81', '#FCD535', '#F6465D', '#8B5CF6', '#32D7FF'];

  const watchColumns = [
    { header: 'ASSET', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#EAECEF]">{info.getValue()}</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[#FCD535]">${info.getValue().toFixed(1)}M</span> },
    { header: 'RECOVERY', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-2">
        <span className={`font-mono text-[11px] ${info.getValue() < 0.9 ? 'text-[#F6465D]' : 'text-[#0ECB81]'}`}>
          {(info.getValue() * 100).toFixed(1)}%
        </span>
      </div>
    )},
    { header: 'STATUS', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="NON-ACCRUAL" variant="non-accrual" /> : <Badge label="PERFORMING" variant="loan-type" /> }
  ];

  if (yieldLoading && !yieldTimeSeries) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <span className="text-sm font-mono text-[#848E9C]">SYNCHRONIZING GLOBAL UNIVERSE...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-10">
      {/* KPI Ticker Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="UNIVERSE WEIGHTED YIELD" 
          value={wtdAvgYield} 
          format="percent" 
          icon={TrendingUp} 
          accentColor="#0ECB81" 
          loading={yieldLoading} 
          delta={1.25} 
          deltaLabel="q/q" 
        />
        <KPICard 
          label="MARKET NON-ACCRUAL" 
          value={nonAccrual} 
          format="percent" 
          icon={AlertTriangle} 
          accentColor="#F6465D" 
          loading={stressLoading} 
          delta={-0.12} 
        />
        <KPICard 
          label="NET Q DEPLOYMENT" 
          value={netDeployment} 
          format="currency" 
          icon={Activity} 
          accentColor="#FCD535" 
          loading={dfLoading} 
        />
        <KPICard 
          label="NAV CONVERGENCE" 
          value={avgNav !== null ? avgNav.toFixed(2) : null} 
          format="percent" 
          icon={BarChart2} 
          accentColor="#8B5CF6" 
          loading={navLoading} 
        />
      </div>

      {/* Main Analysis Section */}
      <div className="bento-grid">
        {/* Yield/Spread Chart */}
        <div className="col-span-12 lg:col-span-8 h-[450px]">
          <ChartPanel 
            title="Yield Analytics & Spread Tracking" 
            subtitle="Comparing overall BDC yields vs HY benchmark spreads"
          >
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ECB81" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ECB81" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2F36" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" iconType="rect" />
                  <Area type="monotone" dataKey="overall_yield" name="Overall Yield" stroke="#0ECB81" strokeWidth={3} fill="url(#yieldGrad)" />
                  <Line type="monotone" dataKey="hy_spread" name="HY Spread (bps)" stroke="#FCD535" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
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
                    stroke="#181A20"
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

        {/* Deal Flow Heatmap */}
        <div className="col-span-12 lg:col-span-6 h-[400px]">
          <ChartPanel title="Deployment Momentum" subtitle="Gross originations vs repayments">
            {dfLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealflowTrends ? [...dealflowTrends].reverse() : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2F36" />
                  <XAxis dataKey="quarter_label" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_new_originations_bn" name="Originations" fill="#FCD535" />
                  <Bar dataKey="total_repayments_bn" name="Repayments" fill="#474D57" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        {/* Watchlist Table */}
        <div className="col-span-12 lg:col-span-6 h-[400px] binance-panel overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#2B2F36] flex justify-between items-center bg-[#1E2329]/50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FCD535]" />
              <h3 className="font-bold text-[14px] text-[#EAECEF] uppercase tracking-wider">Priority Risk Radar</h3>
            </div>
            <button className="text-[11px] text-[#FCD535] font-bold hover:underline">VIEW ALL TERMINAL &rarr;</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {watchLoading ? <LoadingSpinner /> : (
              <DataTable 
                data={watchlist ? watchlist.slice(0, 8) : []} 
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
=======
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, ChevronDown, ChevronUp, Sparkles, Activity } from 'lucide-react';

export default function OverviewPage() {
  const [commentaryData, setCommentaryData] = useState(null);
  const [commentaryLoading, setCommentaryLoading] = useState(true);
  const [commentaryExpanded, setCommentaryExpanded] = useState(false);

  useEffect(() => {
    async function fetchCommentary() {
      try {
        const res = await axios.get('/api/commentary/latest');
        setCommentaryData(res.data);
      } catch (err) {
        console.error("Failed to load commentary:", err);
      } finally {
        setCommentaryLoading(false);
      }
    }
    fetchCommentary();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Key metrics and insights for the private credit market.</p>
      </div>

      {/* Other dashboard elements would go here... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Market Pulse</p>
            <p className="text-xl font-bold text-gray-900">Active</p>
          </div>
        </div>
        {/* Placeholder metric cards */}
      </div>

      {/* AI Commentary Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
        {/* Header (Clickable to expand/collapse) */}
        <div 
          className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
          onClick={() => setCommentaryExpanded(!commentaryExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center bg-purple-100 text-purple-600 rounded-full w-10 h-10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  Market Commentary
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {commentaryLoading 
                  ? "Loading insights..." 
                  : `Updated ${formatDate(commentaryData?.date)}`}
              </p>
            </div>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            {commentaryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Expanded Content */}
        {commentaryExpanded && (
          <div className="p-6">
            {commentaryLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : commentaryData ? (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {commentaryData.commentary_text.split('\n').map((paragraph, idx) => (
                  <p key={idx} className={paragraph.trim() ? "mb-4" : ""}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Commentary is currently unavailable.</p>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 italic">
                Generated by AI based on public filing data. Not investment advice.
              </p>
              {commentaryData?.cached && (
                <span className="text-xs text-gray-400">Viewing cached version</span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
>>>>>>> 84a527c (Implement BDC Analytics suite: stress prediction, yield forecast, and AI commentary)
