import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--djup-border-strong)] bg-[var(--djup-bg-main)]">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-[var(--djup-text)] font-['Inter'] tracking-tight">
            Newswire
          </span>
          <span className="djup-section-label">
            {data.provider ? `via ${data.provider}` : '—'}
          </span>
        </div>
        <span className="djup-section-label">
          {data.fetchedAt ? `Updated ${formatRelative(data.fetchedAt)}` : 'Live'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12 djup-section-label">
            Loading newswire
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
          <ul className="divide-y divide-[var(--djup-border)]">
            {items.map((a, i) => (
              <li
                key={a.url || i}
                className="group relative border-l-2 border-transparent hover:border-[var(--djup-primary)] hover:bg-[var(--djup-bg-panel-elevated)] transition-colors"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block px-4 py-3 no-underline"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="djup-section-label text-[var(--djup-primary)]">
                          {a.source || 'Wire'}
                        </span>
                        <span className="djup-section-label">
                          {formatRelative(a.publishedAt)}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-medium text-[var(--djup-text)] leading-snug group-hover:text-[var(--djup-primary-strong)] transition-colors line-clamp-2">
                        {a.title}
                      </h4>
                    </div>
                    <ExternalLink
                      className="w-3 h-3 text-[var(--djup-text-faint)] group-hover:text-[var(--djup-primary)] shrink-0 mt-1"
                      strokeWidth={1.5}
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
