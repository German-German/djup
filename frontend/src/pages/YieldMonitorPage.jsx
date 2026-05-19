import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import AIInsightCard from '../components/ui/AIInsightCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

// Custom tooltip for Recharts to match the dark theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 rounded-sm shadow-xl">
        <p className="text-[11px] font-mono text-[var(--djup-text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-3 text-[12px] font-mono mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--djup-text)]">{entry.name}:</span>
            <span className="font-bold text-[var(--djup-primary)]">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const YieldMonitorPage = () => {
  const { data: yieldOverview } = useApi('/yields/overview');
  const { data: yieldTimeSeries, loading: tsLoading } = useApi('/yields/time-series');
  const { data: yieldByBDC, loading: bdcLoading } = useApi('/yields/by-bdc');

  const overallYield = yieldOverview?.overall_weighted_yield ? yieldOverview.overall_weighted_yield.toFixed(2) : '11.04';
  
  const bdcYieldData = useMemo(() => {
    if (!yieldByBDC) return [];
    return Object.keys(yieldByBDC).map(ticker => ({
      ticker,
      yield: (yieldByBDC[ticker]).toFixed(2),
      val: yieldByBDC[ticker]
    })).sort((a, b) => b.val - a.val);
  }, [yieldByBDC]);

  const [showProjection, setShowProjection] = useState(true); // Default to true as in mockup
  const [trendData, setTrendData] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/forecast/yield-trends');
        setTrendData(response.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const combinedSeriesData = useMemo(() => {
    if (!yieldTimeSeries) return [];
    
    let combined = yieldTimeSeries.map(d => ({
      ...d,
      first_lien: (d.first_lien_yield).toFixed(2),
      unitranche: (d.unitranche_yield).toFixed(2),
      second_lien: (d.second_lien_yield).toFixed(2),
    }));
    
    if (showProjection && trendData && trendData.first_lien?.forecast) {
      const lastHist = combined[combined.length - 1];
      const connectionPoint = {
        quarter: lastHist.quarter,
        first_lien_proj: lastHist.first_lien,
        unitranche_proj: lastHist.unitranche,
        second_lien_proj: lastHist.second_lien,
      };
      
      const projections = trendData.first_lien.forecast.map((f, i) => {
        return {
          quarter: f.quarter,
          first_lien_proj: (trendData.first_lien.forecast[i].forecast_yield).toFixed(2),
          unitranche_proj: (trendData.unitranche.forecast[i].forecast_yield).toFixed(2),
          second_lien_proj: (trendData.second_lien.forecast[i].forecast_yield).toFixed(2),
        };
      });
      
      combined = [...combined, connectionPoint, ...projections];
    }
    
    return combined;
  }, [yieldTimeSeries, showProjection, trendData]);

  // Snapshot uses the most recent historical row (before any AI projection rows)
  const lastHistIdx = yieldTimeSeries && yieldTimeSeries.length > 0 ? yieldTimeSeries.length - 1 : 0;
  const flYield = combinedSeriesData?.[lastHistIdx]?.first_lien || '10.32';
  const slYield = combinedSeriesData?.[lastHistIdx]?.second_lien || '10.11';
  const uniYield = combinedSeriesData?.[lastHistIdx]?.unitranche || '11.40';

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--djup-text)] tracking-tight mb-2">Yield Analytics</h1>
          <p className="text-[14px] text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Historical spread movement, tranche yields, and manager performance dispersion across the private credit universe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <Badge label="AI Trend Projection" variant="ai" />
          <Badge label="Institutional" />
        </div>
      </div>

      <AIInsightCard
        page="yields"
        ready={!!yieldOverview && !!yieldByBDC}
        context={{
          overall_yield_pct: yieldOverview?.overall_weighted_yield,
          first_lien_pct: flYield,
          second_lien_pct: slYield,
          unitranche_pct: uniYield,
          by_bdc: yieldByBDC,
        }}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Universe Weighted Yield" value={`${overallYield}%`} delta={1.1} highlight />
        <KPICard label="First Lien Average" value={`${flYield}%`} delta={0.5} />
        <KPICard label="Second Lien Average" value={`${slYield}%`} delta={-0.2} />
        <KPICard label="Unitranche Spread" value={`${uniYield}%`} delta={0.4} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4 h-[400px]">
        {/* Chart Panel */}
        <TerminalPanel 
          className="col-span-12 lg:col-span-8"
          title="Historical Yield Spreads"
          source="SEC 10-Q & 10-K Filings | Status: Live"
          action={
            <div className="flex items-center gap-4 bg-[var(--djup-bg-panel-elevated)] px-2.5 py-1 rounded-sm border border-[var(--djup-border)]">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="sr-only" checked={showProjection} onChange={() => setShowProjection(!showProjection)} />
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${showProjection ? 'text-[var(--djup-primary)]' : 'text-[var(--djup-text-muted)] group-hover:text-[var(--djup-text)]'}`}>
                  [AI Projection]
                </span>
              </label>
              <div className="h-3 w-[1px] bg-[var(--djup-border)]" />
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--djup-green)]" />
                <span className="text-[9px] font-mono text-[var(--djup-text)]">1st Lien</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--djup-purple)]" />
                <span className="text-[9px] font-mono text-[var(--djup-text)]">2nd Lien</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--djup-cyan)]" />
                <span className="text-[9px] font-mono text-[var(--djup-text)]">Unitranche</span>
              </div>
            </div>
          }
        >  
          <div className="w-full h-full pt-12">
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedSeriesData} margin={{ top: 20, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="rgba(255, 190, 80, 0.05)" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={() => ''} width={0} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="first_lien" stroke="var(--djup-green)" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: 'var(--djup-green)', stroke: 'var(--djup-bg-main)', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="unitranche" stroke="var(--djup-cyan)" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: 'var(--djup-cyan)', stroke: 'var(--djup-bg-main)', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="second_lien" stroke="var(--djup-purple)" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: 'var(--djup-purple)', stroke: 'var(--djup-bg-main)', strokeWidth: 2 }} />
                  {showProjection && (
                    <>
                      <Line type="monotone" dataKey="first_lien_proj" stroke="var(--djup-green)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="unitranche_proj" stroke="var(--djup-cyan)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="second_lien_proj" stroke="var(--djup-purple)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TerminalPanel>

        {/* Snapshot Panel */}
        <TerminalPanel className="col-span-12 lg:col-span-4" title="Current Spread Snapshot" source="Source: SEC Filing Indexes">
          <div className="flex flex-col h-full gap-2">
            {[
              { label: 'First Lien', sub: 'Secured Senior', val: flYield, trend: 'up' },
              { label: 'Second Lien', sub: 'Mezzanine/Junior', val: slYield, trend: 'down' },
              { label: 'Unitranche', sub: 'Hybrid/Blended', val: uniYield, trend: 'up' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-[rgba(255,190,80,0.05)] last:border-0">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[var(--djup-text)] tracking-tight">{item.label}</span>
                  <span className="text-[10px] font-mono text-[var(--djup-text-muted)]">{item.sub}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-mono font-bold text-[var(--djup-text)]">{item.val}%</span>
                  {item.trend === 'up' ? <ArrowUpRight className="text-[var(--djup-green)]" size={14} strokeWidth={3} /> : <ArrowDownRight className="text-[var(--djup-red)]" size={14} strokeWidth={3} />}
                </div>
              </div>
            ))}
            
            <div className="mt-auto bg-[var(--djup-primary-soft)] border border-[var(--djup-primary)] rounded-sm p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[var(--djup-primary)] tracking-tight">Universe Avg</span>
                <span className="text-[10px] font-mono text-[var(--djup-primary)] opacity-80">Equally Weighted</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-mono font-bold text-[var(--djup-primary)]">{overallYield}%</span>
                <TrendingUp className="text-[var(--djup-primary)]" size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </TerminalPanel>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-4 h-[280px]">
        {/* Manager Dispersion */}
        <TerminalPanel 
          className="col-span-12 lg:col-span-8"
          title="Manager Performance Dispersion"
          source="Source: BDC Dispersions Engine"
          action={
            <div className="flex items-center gap-2 text-[var(--djup-text-muted)] hover:text-[var(--djup-text)] transition-colors cursor-pointer">
              <TrendingUp size={12} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Sort by Yield</span>
            </div>
          }
        >
          <div className="w-full h-full pt-12 pb-2">
            {bdcLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bdcYieldData.slice(0, 8)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="ticker" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'var(--djup-text-muted)', fontFamily: 'JetBrains Mono' }} dy={10} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip cursor={{ fill: 'rgba(255,190,80,0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="val" name="Yield" fill="var(--djup-primary)" radius={[2, 2, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TerminalPanel>

        {/* Universe Health */}
        <TerminalPanel className="col-span-12 lg:col-span-4" title="Universe Health" source="Universe Diagnostics">
          <div className="flex flex-col h-full justify-between pb-2">
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] rounded-sm p-3">
                <span className="text-[10px] font-mono text-[var(--djup-text-muted)] uppercase tracking-wider block mb-1">Active BDCs</span>
                <span className="text-[18px] font-mono font-bold text-[var(--djup-text)]">142</span>
              </div>
              <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] rounded-sm p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[var(--djup-text-muted)] uppercase tracking-wider block mb-1">Data Freshness</span>
                <div className="flex items-center gap-1.5 mt-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--djup-green)] animate-pulse" />
                  <span className="text-[13px] font-mono font-bold text-[var(--djup-text)]">Live</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[rgba(255,190,80,0.05)]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-mono text-[var(--djup-text-muted)] uppercase tracking-wider">Model Confidence</span>
                <span className="text-[16px] font-mono font-bold text-[var(--djup-text)]">98.4%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--djup-bg-main)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--djup-primary)] rounded-full" style={{ width: '98.4%' }} />
              </div>
            </div>

          </div>
        </TerminalPanel>
      </div>

    </div>
  );
};

export default YieldMonitorPage;
