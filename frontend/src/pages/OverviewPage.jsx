import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe,
  Info,
  Maximize2,
  Bot,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
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

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#32D7FF'];

  const watchColumns = [
    { header: 'ASSET', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[#F0F0F0]">{info.getValue()}</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[#F59E0B]">${info.getValue().toFixed(1)}M</span> },
    { header: 'RECOVERY', accessorKey: 'avg_fair_to_par', cell: info => (
      <div className="flex items-center gap-2">
        <span className={`font-mono text-[11px] ${info.getValue() < 0.9 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
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
          accentColor="#10B981" 
          loading={yieldLoading} 
          delta={1.25} 
          deltaLabel="q/q" 
        />
        <KPICard 
          label="MARKET NON-ACCRUAL" 
          value={nonAccrual} 
          format="percent" 
          icon={AlertTriangle} 
          accentColor="#EF4444" 
          loading={stressLoading} 
          delta={-0.12} 
        />
        <KPICard 
          label="NET Q DEPLOYMENT" 
          value={netDeployment} 
          format="currency" 
          icon={Activity} 
          accentColor="#F59E0B" 
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
        <div className="col-span-12 h-[450px]">
          <ChartPanel 
            title="Yield Analytics & Spread Tracking" 
            subtitle="Comparing overall BDC yields vs HY benchmark spreads"
          >
            {tsLoading ? <LoadingSpinner /> : yieldTimeSeries?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#333333" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" iconType="rect" />
                  <Area type="monotone" dataKey="overall_yield" name="Overall Yield" stroke="#10B981" strokeWidth={3} fill="url(#yieldGrad)" />
                  <Line type="monotone" dataKey="hy_spread" name="HY Spread (bps)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No yield data available" />}
          </ChartPanel>
        </div>



        {/* Watchlist Table */}
        <div className="col-span-12 h-[400px] binance-panel overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#333333] flex justify-between items-center bg-[#1E1E1E]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="font-bold text-[14px] text-[#F0F0F0] uppercase tracking-wider">Priority Risk Radar</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {watchLoading ? <LoadingSpinner /> : watchlist?.length > 0 ? (
              <DataTable 
                data={watchlist.slice(0, 8)} 
                columns={watchColumns} 
                loading={watchLoading}
              />
            ) : <EmptyState message="No watchlist data" />}
          </div>
        </div>

        {/* AI Commentary Panel */}
        <div className="col-span-12 h-auto binance-panel overflow-hidden transition-all duration-300">
          <div 
            className="px-5 py-4 border-b border-[#2B2F36] flex justify-between items-center bg-[#1E2329]/50 cursor-pointer hover:bg-[#2B2F36]/50 transition-colors"
            onClick={() => setCommentaryExpanded(!commentaryExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full w-8 h-8">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-[14px] text-[#EAECEF] uppercase tracking-wider flex items-center">
                    AI Market Commentary
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI INSIGHT
                  </span>
                </div>
                <p className="text-[11px] text-[#848E9C] mt-0.5">
                  {commentaryLoading ? "GENERATING INSIGHTS..." : `UPDATED ${formatDate(commentaryData?.date).toUpperCase()}`}
                </p>
              </div>
            </div>
            <button className="p-2 text-[#848E9C] hover:text-[#EAECEF] rounded-full">
              {commentaryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {commentaryExpanded && (
            <div className="p-6 bg-[#181A20]">
              {commentaryLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-[#2B2F36] rounded w-3/4"></div>
                  <div className="h-4 bg-[#2B2F36] rounded w-full"></div>
                  <div className="h-4 bg-[#2B2F36] rounded w-5/6"></div>
                </div>
              ) : commentaryData ? (
                <div className="prose prose-sm max-w-none text-[#EAECEF] leading-relaxed">
                  {commentaryData.commentary_text.split('\n').map((paragraph, idx) => (
                    <p key={idx} className={paragraph.trim() ? "mb-4 text-[#848E9C]" : ""}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[#848E9C] text-sm">Commentary is currently unavailable.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
