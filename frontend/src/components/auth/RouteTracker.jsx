import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Logs every authenticated page visit to Supabase `user_events`. Mounted
 * inside the protected app shell so every route change after auth fires
 * a row. Deduplicates by ignoring the same path within 2s.
 */
const RouteTracker = () => {
  const location = useLocation();
  const { user, logEvent } = useAuth();
  const lastFire = useRef({ path: null, at: 0 });

  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    if (lastFire.current.path === location.pathname && now - lastFire.current.at < 2000) return;
    lastFire.current = { path: location.pathname, at: now };
    logEvent('page_view', { path: location.pathname });
  }, [location.pathname, user, logEvent]);

  return null;
};

export default RouteTracker;
