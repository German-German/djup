import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  Bot,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, 
  ComposedChart, Line
} from 'recharts';

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

const OverviewPage = () => {
  const { data: yieldOverview, loading: yieldLoading } = useApi('/yields/overview');
  const { data: stressDashboard } = useApi('/stress/dashboard');
  const { data: dealflowTrends } = useApi('/dealflow/trends');
  const { data: navPremium } = useApi('/stress/nav-premium');
  const { data: yieldTimeSeries, loading: tsLoading } = useApi('/yields/time-series');
  const { data: watchlist } = useApi('/stress/watchlist');
  const { data: macroOverlay } = useApi('/macro/overlay?series=hy_spread');

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

  const wtdAvgYield = yieldOverview?.overall_weighted_yield ? (yieldOverview.overall_weighted_yield * 100).toFixed(2) : '11.04';
  const nonAccrual = stressDashboard?.universe_non_accrual_rate ? stressDashboard.universe_non_accrual_rate.toFixed(2) : '2.14';
  const netDeployment = dealflowTrends && dealflowTrends.length > 0 ? dealflowTrends[0].net_deployment_bn : '4.2';
  
  let avgNav = '0.98';
  if (navPremium && navPremium.length > 0) {
    avgNav = navPremium[navPremium.length - 1].universe_avg_premium_discount.toFixed(2);
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

  const watchColumns = [
    { header: 'ASSET', accessorKey: 'borrower_name', cell: info => <span className="font-bold text-[var(--djup-text)]">{info.getValue()}</span> },
    { header: 'EXPOSURE', accessorKey: 'total_fair_value_mm', cell: info => <span className="font-mono text-[var(--djup-primary)]">${info.getValue().toFixed(1)}M</span> },
    { header: 'RECOVERY', accessorKey: 'avg_fair_to_par', cell: info => (
      <span className={`font-mono text-[11px] ${info.getValue() < 0.9 ? 'text-[var(--djup-red)]' : 'text-[var(--djup-green)]'}`}>
        {(info.getValue() * 100).toFixed(1)}%
      </span>
    )},
    { header: 'STATUS', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="NON-ACCRUAL" variant="non-accrual" /> : <Badge label="PERFORMING" variant="loan-type" /> }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-2">Market Intelligence</h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Macro-level dashboard aggregating global universe metrics, risk warnings, and AI-driven narrative synthesis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <div className="px-3 py-1 bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] text-[var(--djup-text)] text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm">
            Institutional View
          </div>
        </div>
      </div>

      {/* KPI Ticker Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="UNIVERSE WEIGHTED YIELD" 
          value={`${wtdAvgYield}%`}
          loading={yieldLoading && !wtdAvgYield} 
          delta={1.25} 
          highlight
        />
        <KPICard 
          label="MARKET NON-ACCRUAL" 
          value={`${nonAccrual}%`}
          delta={-0.12} 
        />
        <KPICard 
          label="NET Q DEPLOYMENT" 
          value={`$${netDeployment}B`}
          delta={0.4}
        />
        <KPICard 
          label="NAV CONVERGENCE" 
          value={`${avgNav}x`}
          delta={0.02} 
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Yield/Spread Chart */}
        <TerminalPanel className="col-span-12 h-[450px] relative">
          <div className="flex justify-between items-center absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <h2 className="text-[16px] font-bold text-[var(--djup-text)] tracking-tight">Yield Analytics & Spread Tracking</h2>
          </div>

          <div className="w-full h-full pt-12">
            {tsLoading && combinedTimeSeries.length === 0 ? <LoadingSpinner /> : combinedTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--djup-green)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--djup-green)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="rgba(255, 190, 80, 0.05)" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={() => ''} width={0} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" iconType="rect" />
                  <Area type="monotone" dataKey="overall_yield" name="Overall Yield" stroke="var(--djup-green)" strokeWidth={2} fill="url(#yieldGrad)" />
                  <Line type="monotone" dataKey="hy_spread" name="HY Spread (bps)" stroke="var(--djup-primary)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No yield data available" />}
          </div>
        </TerminalPanel>

        {/* Watchlist Table */}
        <TerminalPanel className="col-span-12 lg:col-span-6 h-[400px]" title="Priority Risk Radar">
          <div className="flex-1 overflow-y-auto h-full pb-8">
            {watchlist?.length > 0 ? (
              <DataTable 
                data={watchlist.slice(0, 8)} 
                columns={watchColumns} 
              />
            ) : <EmptyState title="No active alerts" description="All tracked entities are performing within expected thresholds." />}
          </div>
        </TerminalPanel>

        {/* AI Commentary Panel */}
        <TerminalPanel className="col-span-12 lg:col-span-6 h-[400px]">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-[var(--djup-bg-panel-elevated)] transition-colors absolute top-0 left-0 w-full h-10 px-4 border-b border-[var(--djup-border)] bg-[var(--djup-bg-panel-elevated)]"
            onClick={() => setCommentaryExpanded(!commentaryExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center bg-[rgba(180,92,255,0.1)] text-[var(--djup-purple)] rounded w-6 h-6">
                <Bot className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-[var(--djup-text)] tracking-tight">AI Market Commentary</h3>
                <Badge label="AI Insight" variant="ai" />
              </div>
            </div>
            <button className="p-1 text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] rounded">
              {commentaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className={`p-4 pt-14 h-full overflow-y-auto transition-all ${commentaryExpanded ? 'opacity-100' : 'opacity-100'}`}>
             <div className="flex justify-between items-center mb-4">
               <p className="text-[10px] font-mono text-[var(--djup-text-faint)] uppercase tracking-wider">
                 {commentaryLoading ? "GENERATING INSIGHTS..." : `LAST SYNTHESIS: ${formatDate(commentaryData?.date).toUpperCase()}`}
               </p>
             </div>

             {commentaryLoading ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-3 bg-[var(--djup-border-strong)] rounded w-3/4"></div>
                 <div className="h-3 bg-[var(--djup-border-strong)] rounded w-full"></div>
                 <div className="h-3 bg-[var(--djup-border-strong)] rounded w-5/6"></div>
               </div>
             ) : commentaryData ? (
               <div className="text-[12px] font-mono text-[var(--djup-text-muted)] leading-relaxed space-y-4 pr-2">
                 {commentaryData.commentary_text.split('\n').map((paragraph, idx) => (
                   <p key={idx} className={paragraph.trim() ? "text-[var(--djup-text-muted)]" : ""}>{paragraph}</p>
                 ))}
               </div>
             ) : (
               <EmptyState title="Synthesis Unavailable" description="Connect an AI provider to generate automated market commentary." />
             )}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
};

export default OverviewPage;
