import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FieldLabel = ({ children }) => (
  <span className="text-[11px] font-medium text-[var(--djup-text-faint)] tracking-wide uppercase">
    {children}
  </span>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3.5 py-2.5 text-[13.5px] bg-[var(--djup-bg-main)] border border-[var(--djup-border-strong)] focus:border-[var(--djup-primary)] outline-none text-[var(--djup-text)] placeholder-[var(--djup-text-faint)] transition-colors"
    style={{ borderRadius: 'var(--r-sm)' }}
  />
);

const AuthPanel = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [firm, setFirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error: err } = await signIn({ email, password });
      if (err) setError(err.message);
      else navigate('/overview');
    } else {
      const { error: err, data } = await signUp({ email, password, fullName, firm });
      if (err) setError(err.message);
      else if (data?.user?.identities?.length === 0) {
        setInfo('Account exists — sign in instead.');
      } else if (data?.session) {
        navigate('/overview');
      } else {
        setInfo('Check your inbox to confirm the email, then sign in.');
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] w-full max-w-md"
      style={{ borderRadius: 'var(--r-md)' }}
    >
      <div className="flex border-b border-[var(--djup-border-strong)]">
        {['signin', 'signup'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); setInfo(null); }}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
              mode === m
                ? 'text-[var(--djup-primary)] bg-[var(--djup-bg-panel-elevated)] border-b-2 border-[var(--djup-primary)] -mb-px'
                : 'text-[var(--djup-text-muted)] hover:text-[var(--djup-text)]'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="p-6 flex flex-col gap-4">
        {mode === 'signup' && (
          <>
            <label className="flex flex-col gap-2">
              <FieldLabel>Full name</FieldLabel>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <FieldLabel>Firm (optional)</FieldLabel>
              <Input
                type="text"
                placeholder="Capital partners"
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-2">
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signin' ? '••••••••' : 'min 8 characters'}
            minLength={mode === 'signup' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div className="text-[12.5px] text-[var(--djup-negative)] bg-[rgba(200,132,127,0.07)] border border-[var(--djup-negative)]/30 px-3 py-2" style={{ borderRadius: 'var(--r-xs)' }}>
            {error}
          </div>
        )}
        {info && (
          <div className="text-[12.5px] text-[var(--djup-primary)] bg-[var(--djup-primary-soft)] border border-[var(--djup-primary-line)] px-3 py-2" style={{ borderRadius: 'var(--r-xs)' }}>
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 text-[13px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors disabled:opacity-50"
          style={{ borderRadius: 'var(--r-sm)' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {mode === 'signin' ? 'Sign in to terminal' : 'Create account'}
        </button>

        <p className="text-[11.5px] text-[var(--djup-text-faint)] text-center mt-2">
          Authentication and profile data are stored in Supabase. By continuing you agree to the platform terms.
        </p>
      </form>
    </div>
  );
};

export default AuthPanel;
