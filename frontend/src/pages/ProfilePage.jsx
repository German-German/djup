import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, LogOut, Save, Mail, Clock, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';

const ProfilePage = () => {
  const { user, profile, updateProfile, signOut, logEvent } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [firm, setFirm] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setFirm(profile?.firm || '');
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('user_events')
        .select('id, event_type, path, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) {
        if (!error && data) setEvents(data);
        setEventsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName, firm });
    if (!error) {
      setSavedAt(new Date());
      logEvent('profile_update', { metadata: { firm, has_name: !!fullName } });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-7 animate-fade-in pb-12 max-w-5xl">
      <div className="flex justify-between items-start flex-wrap gap-4 pb-6 border-b border-[var(--djup-border-strong)]">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--djup-text)] tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-[14px] text-[var(--djup-text-muted)] leading-relaxed">
            Manage your account details and review recent activity. Data syncs with Supabase in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Authenticated" variant="positive" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <TerminalPanel title="Account details">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="flex flex-col gap-2">
                  <span className="djup-section-label flex items-center gap-2">
                    <Mail size={11} strokeWidth={1.75} /> Email
                  </span>
                  <input
                    readOnly
                    value={user?.email || ''}
                    className="px-3.5 py-2.5 text-[13.5px] bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] text-[var(--djup-text-muted)] outline-none cursor-not-allowed"
                    style={{ borderRadius: 'var(--r-sm)' }}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="djup-section-label flex items-center gap-2">
                    <Clock size={11} strokeWidth={1.75} /> Member since
                  </span>
                  <input
                    readOnly
                    value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                    className="px-3.5 py-2.5 text-[13.5px] bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] text-[var(--djup-text-muted)] outline-none"
                    style={{ borderRadius: 'var(--r-sm)' }}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="djup-section-label flex items-center gap-2">
                  <User size={11} strokeWidth={1.75} /> Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="px-3.5 py-2.5 text-[13.5px] bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] focus:border-[var(--djup-primary)] outline-none text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] transition-colors"
                  style={{ borderRadius: 'var(--r-sm)' }}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="djup-section-label flex items-center gap-2">
                  <Briefcase size={11} strokeWidth={1.75} /> Firm
                </span>
                <input
                  type="text"
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  placeholder="Capital partners"
                  className="px-3.5 py-2.5 text-[13.5px] bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] focus:border-[var(--djup-primary)] outline-none text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] transition-colors"
                  style={{ borderRadius: 'var(--r-sm)' }}
                />
              </label>

              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors disabled:opacity-50"
                    style={{ borderRadius: 'var(--r-sm)' }}
                  >
                    <Save size={13} strokeWidth={1.75} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  {savedAt && (
                    <span className="text-[11.5px] text-[var(--djup-positive)]">
                      Saved {savedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[12.5px] text-[var(--djup-negative)] border border-[var(--djup-negative)]/30 hover:bg-[rgba(200,132,127,0.06)] transition-colors"
                  style={{ borderRadius: 'var(--r-sm)' }}
                >
                  <LogOut size={13} strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            </form>
          </TerminalPanel>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TerminalPanel
            title="Recent activity"
            source={`${events.length} events`}
            padding={false}
          >
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12 djup-section-label">
                Loading activity…
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
                <Activity className="w-5 h-5 text-[var(--djup-text-faint)]" strokeWidth={1.5} />
                <span className="djup-section-label">No activity yet</span>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--djup-border)] max-h-[420px] overflow-y-auto">
                {events.map((ev) => (
                  <li key={ev.id} className="px-6 py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12.5px] font-medium text-[var(--djup-text)]">
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                        {ev.path && (
                          <span className="text-[11px] text-[var(--djup-text-faint)] font-mono">{ev.path}</span>
                        )}
                      </div>
                      {ev.metadata && (
                        <span className="text-[11px] text-[var(--djup-text-faint)]">
                          {JSON.stringify(ev.metadata).slice(0, 80)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--djup-text-faint)] shrink-0 font-mono tabular-nums">
                      {new Date(ev.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TerminalPanel>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
