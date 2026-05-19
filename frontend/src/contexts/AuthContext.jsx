import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileFetchInFlight = useRef(false);

  const refreshProfile = useCallback(async (userId) => {
    if (!userId || profileFetchInFlight.current) return;
    profileFetchInFlight.current = true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) setProfile(data);
    } finally {
      profileFetchInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
      if (data?.session?.user) refreshProfile(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) refreshProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, [refreshProfile]);

  const signUp = async ({ email, password, fullName, firm }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, firm },
      },
    });
    if (error) return { error };
    // Best-effort profile row insert (RLS lets the auth'd user write their own row)
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName || null,
        firm: firm || null,
        email,
      });
      await supabase.from('user_events').insert({
        user_id: data.user.id,
        event_type: 'signup',
        path: '/welcome',
        metadata: { firm },
      });
    }
    return { data };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data?.user) {
      await supabase.from('user_events').insert({
        user_id: data.user.id,
        event_type: 'signin',
        path: '/welcome',
      });
    }
    return { data };
  };

  const signOut = async () => {
    if (user?.id) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'signout',
        path: window.location.pathname,
      });
    }
    await supabase.auth.signOut();
  };

  const updateProfile = async (patch) => {
    if (!user?.id) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  const logEvent = async (event_type, payload = {}) => {
    if (!user?.id) return;
    try {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type,
        path: payload.path || window.location.pathname,
        metadata: payload.metadata ?? null,
      });
    } catch {
      /* silent — we never want activity logging to break the UI */
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signUp, signIn, signOut, updateProfile, logEvent, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
