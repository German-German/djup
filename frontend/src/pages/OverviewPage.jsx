import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  marketDataService,
  cryptoService,
  macroLiveService,
} from '../services/data/index.js';
import { ChevronDown, ChevronUp } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import NewsFeed from '../components/ui/NewsFeed';
import useApi from '../hooks/useApi';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] p-3 shadow-lg"
        style={{ borderRadius: 0 }}
      >
        <p className="text-[10px] font-mono text-[var(--djup-text-faint)] mb-2 tracking-wider uppercase">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center gap-3 text-[11px] font-mono mb-1 last:mb-0"
          >
            <span
              className="w-2 h-2 inline-block"
              style={{ backgroundColor: entry.color, borderRadius: 0 }}
            />
            <span className="text-[var(--djup-text-muted)]">{entry.name}:</span>
            <span className="font-semibold text-[var(--djup-text)]">
              {entry.value && entry.value.toFixed ? entry.value.toFixed(2) : entry.value}
            </span>
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

  const [commentary, setCommentary] = useState(null);
  const [commentaryLoading, setCommentaryLoading] = useState(true);
  const [commentaryExpanded, setCommentaryExpanded] = useState(false);
  const [marketQuotes, setMarketQuotes] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [macroSnapshot, setMacroSnapshot] = useState({});
  const [hyOverlay, setHyOverlay] = useState([]);

  useEffect(() => {
    const tickers = ['ARCC', 'MAIN', 'BXSL', 'BX', 'APO', 'SPY', 'HYG', 'BKLN'];
    marketDataService.getQuotes(tickers).then(setMarketQuotes);
    cryptoService.getQuotes(['bitcoin', 'ethereum', 'solana']).then(setCrypto);
    macroLiveService.getSnapshot().then(setMacroSnapshot);
    macroLiveService.getOverlay(['hy_spread'], 24).then(setHyOverlay);
  }, []);

  useEffect(() => {
    const refreshMarkets = setInterval(() => {
      marketDataService
        .getQuotes(['ARCC', 'MAIN', 'BXSL', 'BX', 'APO', 'SPY', 'HYG', 'BKLN'])
        .then(setMarketQuotes);
    }, 60_000);
    return () => clearInterval(refreshMarkets);
  }, []);

  useEffect(() => {
    axios
      .get('/api/commentary/latest')
      .then((res) => setCommentary(res.data))
      .catch(() => {})
      .finally(() => setCommentaryLoading(false));
  }, []);

  const wtdAvgYield = yieldOverview?.overall_weighted_yield
    ? yieldOverview.overall_weighted_yield.toFixed(2)
    : '—';
  const nonAccrual = stressDashboard?.universe_non_accrual_rate
    ? stressDashboard.universe_non_accrual_rate.toFixed(2)
    : '—';
  const netDeployment =
    dealflowTrends && dealflowTrends.length > 0
      ? dealflowTrends[dealflowTrends.length - 1].net_deployment_bn
      : '—';
  const avgNav =
    navPremium && navPremium.length > 0
      ? navPremium[navPremium.length - 1].universe_avg_premium_discount.toFixed(2)
      : '—';

  const combinedTimeSeries = useMemo(() => {
    if (!yieldTimeSeries) return [];
    const hyByQuarter = {};
    hyOverlay.forEach((p) => {
      const month = parseInt(p.date.slice(5, 7), 10);
      const q = `Q${Math.ceil(month / 3)}_${p.date.slice(2, 4)}`;
      if (p.values?.hy_spread != null) hyByQuarter[q] = p.values.hy_spread;
    });
    return yieldTimeSeries.map((q) => ({
      ...q,
      hy_spread: hyByQuarter[q.quarter] ?? null,
    }));
  }, [yieldTimeSeries, hyOverlay]);

  const watchColumns = [
    {
      header: 'Asset',
      accessorKey: 'borrower_name',
      cell: (info) => <span className="font-semibold text-[var(--djup-text)]">{info.getValue()}</span>,
    },
    {
      header: 'Exposure',
      accessorKey: 'total_fair_value_mm',
      cell: (info) => (
        <span className="font-mono text-[var(--djup-primary)]">${info.getValue().toFixed(1)}M</span>
      ),
    },
    {
      header: 'Recovery',
      accessorKey: 'avg_fair_to_par',
      cell: (info) => (
        <span
          className={`font-mono ${
            info.getValue() < 0.9 ? 'text-[var(--djup-negative)]' : 'text-[var(--djup-positive)]'
          }`}
        >
          {(info.getValue() * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'is_non_accrual_any',
      cell: (info) =>
        info.getValue() ? (
          <Badge label="Non-accrual" variant="danger" />
        ) : (
          <Badge label="Performing" variant="positive" />
        ),
    },
  ];

  const macroChip = (label, key, suffix = '') => {
    const s = macroSnapshot?.[key];
    if (!s || s.value == null) {
      return (
        <div className="flex flex-col gap-1 px-4 py-2 border-r border-[var(--djup-border-strong)] last:border-r-0">
          <span className="djup-section-label">{label}</span>
          <span className="font-mono text-[12px] text-[var(--djup-text-faint)]">—</span>
        </div>
      );
    }
    const change = s.change ?? 0;
    const color =
      change > 0 ? 'text-[var(--djup-positive)]' : change < 0 ? 'text-[var(--djup-negative)]' : 'text-[var(--djup-text-muted)]';
    return (
      <div className="flex flex-col gap-1 px-4 py-2 border-r border-[var(--djup-border-strong)] last:border-r-0">
        <span className="djup-section-label">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[13px] text-[var(--djup-text)]">
            {s.value.toFixed(2)}
            {suffix}
          </span>
          <span className={`font-mono text-[10px] ${color}`}>
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b border-[var(--djup-border-strong)]">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--djup-text)] font-['Inter'] tracking-tight mb-1.5">
            Market Overview
          </h1>
          <p className="text-[12px] font-mono text-[var(--djup-text-muted)] max-w-xl leading-relaxed">
            Universe metrics, structural stress signals, AI-synthesised commentary, and live newswire.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <span className="djup-section-label">Institutional</span>
        </div>
      </div>

      {/* Live macro snapshot strip */}
      <div className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] flex flex-wrap">
        {macroChip('HY OAS (bps)', 'hy_spread')}
        {macroChip('IG OAS (bps)', 'ig_spread')}
        {macroChip('SOFR', 'sofr', '%')}
        {macroChip('10Y–2Y', 'yield_curve', '%')}
        {macroChip('UST 10Y', 'treasury_10y', '%')}
        {macroChip('Fed Funds', 'fed_funds', '%')}
      </div>

      {/* Live ticker tape */}
      <div className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] py-2 px-4 flex items-center gap-6 overflow-x-auto whitespace-nowrap">
        <span className="djup-section-label border-r border-[var(--djup-border-strong)] pr-4">Live Marks</span>
        <div className="flex items-center gap-6">
          {marketQuotes && marketQuotes.length > 0 ? (
            marketQuotes.map((q) => {
              const pct = q.changePercent ?? 0;
              const isPos = pct >= 0;
              return (
                <div key={q.ticker} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="font-semibold text-[var(--djup-text)]">{q.ticker}</span>
                  <span className="text-[var(--djup-text-muted)]">${(q.price ?? 0).toFixed(2)}</span>
                  <span className={isPos ? 'text-[var(--djup-positive)]' : 'text-[var(--djup-negative)]'}>
                    {isPos ? '+' : ''}
                    {pct.toFixed(2)}%
                  </span>
                </div>
              );
            })
          ) : (
            <span className="djup-section-label animate-pulse">Connecting Yahoo Finance…</span>
          )}
          {crypto.length > 0 && (
            <span className="djup-section-label border-l border-[var(--djup-border-strong)] pl-4">Crypto</span>
          )}
          {crypto.map((c) => {
            const pct = c.changePercent ?? 0;
            const isPos = pct >= 0;
            return (
              <div key={c.id} className="flex items-center gap-2 font-mono text-[11px]">
                <span className="font-semibold text-[var(--djup-text)] uppercase">{c.id.slice(0, 3)}</span>
                <span className="text-[var(--djup-text-muted)]">${(c.price ?? 0).toLocaleString()}</span>
                <span className={isPos ? 'text-[var(--djup-positive)]' : 'text-[var(--djup-negative)]'}>
                  {isPos ? '+' : ''}
                  {pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--djup-border-strong)]">
        <KPICard label="Universe weighted yield" value={`${wtdAvgYield}%`} loading={yieldLoading && !wtdAvgYield} delta={1.25} highlight />
        <KPICard label="Market non-accrual" value={`${nonAccrual}%`} delta={-0.12} />
        <KPICard label="Net Q deployment" value={`$${netDeployment}B`} delta={0.4} />
        <KPICard label="NAV premium" value={`${avgNav}%`} delta={0.02} />
      </div>

      {/* Main analysis grid */}
      <div className="grid grid-cols-12 gap-5">
        <TerminalPanel
          className="col-span-12 lg:col-span-8 h-[420px]"
          title="Yield Analytics & Spread Tracking"
          source="FRED · SEC ingest"
        >
          <div className="w-full h-full pt-3">
            {tsLoading && combinedTimeSeries.length === 0 ? (
              <LoadingSpinner />
            ) : combinedTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(232,228,220,0.04)" strokeDasharray="0" />
                  <XAxis
                    dataKey="quarter"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'var(--djup-text-faint)', fontFamily: 'JetBrains Mono' }}
                    dy={6}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--djup-text-faint)' }} width={36} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="rect"
                    wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }}
                  />
                  <Area type="monotone" dataKey="overall_yield" name="Overall yield" stroke="var(--djup-primary)" fill="rgba(160,120,90,0.10)" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="hy_spread" name="HY OAS (bps)" stroke="var(--djup-text-muted)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No yield data" description="Time-series will populate once the universe is ingested." />
            )}
          </div>
        </TerminalPanel>

        <TerminalPanel
          className="col-span-12 lg:col-span-4 h-[420px] p-0"
          title="Newswire"
          source="auto-refresh 5m"
        >
          <div className="absolute inset-0 top-9">
            <NewsFeed limit={10} />
          </div>
        </TerminalPanel>

        <TerminalPanel
          className="col-span-12 lg:col-span-7 h-[360px]"
          title="Priority Risk Radar"
          source="BDC stress models"
        >
          <div className="overflow-y-auto h-full pr-1">
            {watchlist?.length > 0 ? (
              <DataTable data={watchlist.slice(0, 7)} columns={watchColumns} />
            ) : (
              <EmptyState title="No active alerts" description="All tracked entities are performing within thresholds." />
            )}
          </div>
        </TerminalPanel>

        <TerminalPanel
          className="col-span-12 lg:col-span-5 h-[360px]"
          title="AI Market Commentary"
          source={commentary?.date ? `Synth ${commentary.date}` : ''}
          action={
            <button
              className="djup-section-label hover:text-[var(--djup-text)] transition-colors"
              onClick={() => setCommentaryExpanded((v) => !v)}
            >
              {commentaryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          }
        >
          <div className="h-full overflow-y-auto pr-1">
            {commentaryLoading ? (
              <LoadingSpinner label="Generating insights" />
            ) : commentary?.commentary_text ? (
              <div className="text-[12px] font-mono text-[var(--djup-text-muted)] leading-relaxed space-y-3">
                {commentary.commentary_text.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Synthesis unavailable"
                description="Set OPENAI_API_KEY to generate automated commentary."
              />
            )}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
};

export default OverviewPage;
