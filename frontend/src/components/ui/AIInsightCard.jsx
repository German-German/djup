import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { aiService } from '../../services/aiService';

/**
 * Compact AI commentary panel that sits at the top of every data page.
 * Sends a small JSON payload of the page metrics to Gemini and renders the
 * 3-sentence response. Gracefully degrades when no key is configured.
 *
 * @param {string}  page    — identifier (e.g. 'overview', 'yields', 'risk')
 * @param {object}  context — compact JSON of the page's headline metrics
 * @param {string}  style   — 'default' | 'risk' | 'macro' | 'news'
 * @param {boolean} ready   — only triggers the call when true (gives parent
 *                            time to assemble the context payload)
 */
const AIInsightCard = ({ page, context, style = 'default', ready = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!ready) return;
    setLoading(true);
    const res = await aiService.analyze(page, context || {}, style);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ready]);

  return (
    <div
      className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] p-6 flex items-start gap-5"
      style={{ borderRadius: 'var(--r-md)' }}
    >
      <div
        className="w-9 h-9 shrink-0 flex items-center justify-center bg-[var(--djup-primary-soft)] border border-[var(--djup-primary-line)] text-[var(--djup-primary)]"
        style={{ borderRadius: 'var(--r-sm)' }}
      >
        <Sparkles className="w-4 h-4" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="djup-section-label text-[var(--djup-primary)]">AI Analysis</span>
            <span className="text-[11px] text-[var(--djup-text-faint)]">Gemini</span>
          </div>
          <button
            onClick={run}
            disabled={loading || !ready}
            className="p-1.5 text-[var(--djup-text-faint)] hover:text-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] transition-colors disabled:opacity-40"
            style={{ borderRadius: 'var(--r-xs)' }}
            aria-label="Regenerate"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex gap-2 items-center text-[13px] text-[var(--djup-text-faint)]">
            <span className="w-1.5 h-1.5 bg-[var(--djup-primary)] rounded-full animate-pulse" />
            Synthesising insight…
          </div>
        ) : data?.available === false ? (
          <p className="text-[13px] text-[var(--djup-text-muted)] leading-relaxed">
            {data.text}
          </p>
        ) : (
          <p className="text-[13.5px] text-[var(--djup-text)] leading-relaxed">
            {data?.text || 'Awaiting page metrics…'}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIInsightCard;
