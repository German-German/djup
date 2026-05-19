import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const REFRESH_MS = 5 * 60 * 1000;

const formatRelative = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
};

const NewsFeed = ({ limit = 12 }) => {
  const [data, setData] = useState({ items: [], provider: null, fetchedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/news/latest`);
      setData(r.data || { items: [] });
      setError(null);
    } catch (e) {
      setError('News feed unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNews]);

  const items = (data.items || []).slice(0, limit);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--djup-border-strong)] shrink-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[14px] font-semibold text-[var(--djup-text)] tracking-tight">
            Newswire
          </span>
          {data.provider && (
            <span className="djup-section-label">via {data.provider}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--djup-text-faint)]">
            {data.fetchedAt ? `Updated ${formatRelative(data.fetchedAt)}` : 'Live'}
          </span>
          <button
            onClick={fetchNews}
            className="p-1.5 text-[var(--djup-text-faint)] hover:text-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] transition-colors"
            style={{ borderRadius: 'var(--r-xs)' }}
            aria-label="Refresh"
          >
            <RefreshCw size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12 djup-section-label">
            Loading newswire…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 djup-section-label">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-12 djup-section-label">
            No headlines available — set NEWSAPI_KEY or GNEWS_API_KEY
          </div>
        ) : (
          <ul>
            {items.map((a, i) => (
              <li
                key={a.url || i}
                className={`group relative border-b border-[var(--djup-border)] last:border-b-0 hover:bg-[var(--djup-bg-panel-elevated)] transition-colors`}
              >
                <span className="absolute top-0 left-0 w-[2px] h-full bg-transparent group-hover:bg-[var(--djup-primary)] transition-colors" />
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block px-5 py-3.5 no-underline"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[11px] font-medium text-[var(--djup-primary)] tracking-wide">
                          {a.source || 'Wire'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--djup-text-faint)]" />
                        <span className="text-[11px] text-[var(--djup-text-faint)]">
                          {formatRelative(a.publishedAt)}
                        </span>
                      </div>
                      <h4 className="text-[13.5px] text-[var(--djup-text)] leading-snug group-hover:text-[var(--djup-primary-strong)] transition-colors line-clamp-2">
                        {a.title}
                      </h4>
                    </div>
                    <ExternalLink
                      className="w-3.5 h-3.5 text-[var(--djup-text-faint)] group-hover:text-[var(--djup-primary)] shrink-0 mt-0.5 transition-colors"
                      strokeWidth={1.75}
                    />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
