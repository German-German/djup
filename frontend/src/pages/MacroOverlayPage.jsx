import { useState, useMemo } from 'react';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import DataTable from '../components/ui/DataTable';
import useApi from '../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 rounded-sm shadow-xl">
        <p className="text-[11px] font-mono text-[var(--djup-text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-3 text-[12px] font-mono mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--djup-text)]">{entry.name}:</span>
            <span className="font-bold text-[var(--djup-primary)]">
              {entry.value.toFixed ? entry.value.toFixed(2) : entry.value}
              {entry.name.includes('Spread') ? ' bps' : '%'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MacroOverlayPage = () => {
  const { data: macroData, loading: macroLoading } = useApi('/macro/overlay?series=hy_spread,ig_spread,sofr,yield_curve');
  const { data: yieldsData, loading: yieldsLoading } = useApi('/yields/time-series');

  const [seriesVisible, setSeriesVisible] = useState({
    hy_spread: true,
    ig_spread: true,
    sofr: true,
    yield_curve: true,
    private_credit: true
  });

  const toggleSeries = (key) => setSeriesVisible(prev => ({...prev, [key]: !prev[key]}));

  const combinedData = useMemo(() => {
    if (!macroData) return [];
    
    return macroData.map(macroPt => {
      const macroYear = macroPt.date.substring(0, 4);
      const macroMonth = parseInt(macroPt.date.substring(5, 7));
      const quarterNum = Math.ceil(macroMonth / 3);
      const qLabel = `Q${quarterNum}_${macroYear.substring(2)}`;
      
      const yPt = yieldsData?.find(y => y.quarter === qLabel);
      
      return {
        date: macroPt.date,
        hy_spread: macroPt.values.hy_spread,
        ig_spread: macroPt.values.ig_spread,
        sofr: macroPt.values.sofr,
        yield_curve: macroPt.values.yield_curve,
        private_credit: yPt ? yPt.overall_yield : null
      };
    });
  }, [macroData, yieldsData]);

  // Real correlations computed from the combined macro + private credit series.
  const correlationPanels = useMemo(() => {
    const pairs = (xs, ys) => {
      const out = [];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i]; const y = ys[i];
        if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) {
          out.push({ x, y });
        }
      }
      return out;
    };
    const r2 = (data) => {
      if (data.length < 3) return null;
      const n = data.length;
      const sx = data.reduce((a, p) => a + p.x, 0);
      const sy = data.reduce((a, p) => a + p.y, 0);
      const mx = sx / n;
      const my = sy / n;
      let num = 0, dx = 0, dy = 0;
      for (const p of data) {
        const ex = p.x - mx, ey = p.y - my;
        num += ex * ey;
        dx += ex * ex;
        dy += ey * ey;
      }
      if (dx === 0 || dy === 0) return null;
      const r = num / Math.sqrt(dx * dy);
      return r * r;
    };
    // Sample one row per calendar month so dense daily macro doesn't drown
    // out the quarterly private-credit cadence.
    const monthly = (() => {
      const seen = new Map();
      for (const d of combinedData) {
        const mo = d.date?.slice(0, 7);
        if (!mo) continue;
        if (!seen.has(mo)) seen.set(mo, d);
      }
      return Array.from(seen.values());
    })();

    const buildPanel = (title, key1, key2, color, blurb) => {
      const data = [];
      for (const d of monthly) {
        const x = d[key1]; const y = d[key2];
        if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) continue;
        data.push({ x, y });
      }
      return { title, color, text: blurb, r2: r2(data), data };
    };
    return [
      buildPanel(
        'Private Credit vs HY OAS',
        'hy_spread', 'private_credit',
        'var(--djup-primary)',
        'Private credit yield vs high-yield option-adjusted spread (live FRED + SEC universe).',
      ),
      buildPanel(
        'Private Credit vs SOFR',
        'sofr', 'private_credit',
        'var(--djup-text-muted)',
        'Direct correlation reflects the floating-rate, SOFR-indexed nature of private credit.',
      ),
      buildPanel(
        'HY OAS vs Yield Curve',
        'yield_curve', 'hy_spread',
        'var(--djup-positive)',
        'Inversion of 10Y–2Y often precedes HY OAS widening — leading credit stress indicator.',
      ),
    ];
  }, [combinedData]);

  const macroTableColumns = [
    { header: 'DATE', accessorKey: 'date', cell: info => <span className="font-mono">{info.getValue()}</span> },
    { header: 'HY SPREAD (BPS)', accessorKey: 'hy_spread', cell: info => <span className="font-mono text-[var(--djup-primary)]">{info.getValue()?.toFixed(2) || '-'}</span> },
    { header: 'IG SPREAD (BPS)', accessorKey: 'ig_spread', cell: info => <span className="font-mono text-[var(--djup-green)]">{info.getValue()?.toFixed(2) || '-'}</span> },
    { header: 'SOFR (%)', accessorKey: 'sofr', cell: info => <span className="font-mono text-[var(--djup-purple)]">{info.getValue()?.toFixed(2) || '-'}</span> },
    { header: '10Y-2Y (%)', accessorKey: 'yield_curve', cell: info => <span className="font-mono text-[var(--djup-cyan)]">{info.getValue()?.toFixed(2) || '-'}</span> },
    { header: 'PRIVATE CREDIT (%)', accessorKey: 'private_credit', cell: info => <span className="font-mono">{(info.getValue())?.toFixed(2) || '-'}</span> },
  ];

  const loading = macroLoading || yieldsLoading;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--djup-text)] tracking-tight mb-2">Macro Overlay</h1>
          <p className="text-[14px] text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Correlating private credit yields against public market benchmarks, SOFR curves, and systemic liquidity factors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <Badge label="Macro Conditions" variant="warning" />
          <Badge label="Institutional" />
        </div>
      </div>

      {/* Series Filters */}
      <div className="flex items-center gap-3 bg-[var(--djup-bg-panel)] p-3 border border-[var(--djup-border)] rounded-sm flex-wrap">
        <div className="font-mono text-[var(--djup-text-muted)] text-[10px] uppercase tracking-wider mr-2">Toggle Benchmark:</div>
        {Object.keys(seriesVisible).map(key => (
           <button
             key={key} 
             onClick={() => toggleSeries(key)}
             className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border transition-all rounded-sm flex items-center gap-2 ${
               seriesVisible[key] 
                 ? 'bg-[var(--djup-primary-soft)] border-[var(--djup-primary)] text-[var(--djup-primary)]' 
                 : 'bg-[var(--djup-bg-main)] border-[var(--djup-border)] text-[var(--djup-text-muted)] hover:text-[var(--djup-text)]'
             }`}
           >
             <span className={`w-1.5 h-1.5 rounded-full ${seriesVisible[key] ? 'bg-[var(--djup-primary)] animate-pulse' : 'bg-[var(--djup-text-faint)]'}`} />
             {key.replace('_', ' ')}
           </button>
        ))}
      </div>

      {/* Main Chart */}
      <TerminalPanel className="h-[500px]" title="Public vs. Private Credit Conditions">
        {loading ? <LoadingSpinner /> : (
          <div className="w-full h-full pt-4 pb-12 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" vertical={false} horizontal={false} />
                <XAxis dataKey="date" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={(tick) => tick.substring(0,7)} axisLine={false} tickLine={false} dy={10} />
                
                <YAxis yAxisId="left" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} width={45} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={(val) => `${val} bps`} axisLine={false} tickLine={false} width={50} />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />

                {seriesVisible.yield_curve && (
                  <Line yAxisId="left" type="monotone" dataKey="yield_curve" name="10Y-2Y Curve" stroke="var(--djup-green)" strokeWidth={1} dot={false} fillOpacity={0.1} />
                )}
                
                <ReferenceLine x="2023-05-03" stroke="rgba(255,190,80,0.15)" strokeDasharray="3 3" yAxisId="left" label={{ position: 'top', value: 'Fed +25bps', fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine x="2023-07-26" stroke="rgba(255,190,80,0.15)" strokeDasharray="3 3" yAxisId="left" label={{ position: 'top', value: 'Fed +25bps', fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />

                {seriesVisible.private_credit && <Line yAxisId="left" type="monotone" dataKey="private_credit" name="Private Credit Yield" stroke="var(--djup-cyan)" strokeWidth={2} dot={false} />}
                {seriesVisible.sofr && <Line yAxisId="left" type="monotone" dataKey="sofr" name="SOFR" stroke="var(--djup-purple)" strokeWidth={1.5} dot={false} />}
                {seriesVisible.hy_spread && <Line yAxisId="right" type="monotone" dataKey="hy_spread" name="HY Spread" stroke="var(--djup-primary)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />}
                {seriesVisible.ig_spread && <Line yAxisId="right" type="monotone" dataKey="ig_spread" name="IG Spread" stroke="var(--djup-green)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </TerminalPanel>

      {/* Correlation Scatter Row — computed live from combinedData */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {correlationPanels.map((card, i) => (
          <TerminalPanel key={i} className="h-[240px] flex flex-col justify-between" title={card.title}>
            <div className="absolute top-2 right-4 text-[11px] font-mono text-[var(--djup-primary)] font-semibold tabular-nums">
              R² = {card.r2 != null ? card.r2.toFixed(2) : '—'}
            </div>
            <div className="w-full h-[120px] pt-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--djup-border)" />
                  <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
                  <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
                  <Scatter data={card.data} fill={card.color} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[10px] text-[var(--djup-text-muted)] mt-auto pt-2 leading-relaxed border-t border-[var(--djup-border-strong)]">
              {card.text}
            </p>
          </TerminalPanel>
        ))}
      </div>

      {/* Table */}
      <TerminalPanel className="h-[350px]" title="Macro Context (Last 8 Data Points)">
        <div className="w-full h-full overflow-y-auto pb-8">
          {loading ? <LoadingSpinner /> : (
            <DataTable 
              data={combinedData ? combinedData.slice(-8).reverse() : []} 
              columns={macroTableColumns} 
              loading={loading}
            />
          )}
        </div>
      </TerminalPanel>
    </div>
  );
};

export default MacroOverlayPage;
