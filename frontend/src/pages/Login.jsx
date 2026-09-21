import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (error) setToast({ type: 'error', message: error });
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      setToast({ type: 'success', message: 'Welcome back — redirecting to your workspace.' });
      setTimeout(() => navigate('/dashboard'), 600);
    } catch {
      setToast({ type: 'error', message: 'Unable to sign in right now.' });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setToast({ type: 'error', message: 'No credential received from Google.' });
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      setToast({ type: 'success', message: 'Signed in with Google — redirecting to your workspace.' });
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Google sign-in failed' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setToast({ type: 'error', message: 'Google sign-in was cancelled or failed.' });
  };

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background technology-themed effects */}
      <div className="login-tech-bg">
        <div className="login-tech-glow" />
        <div className="login-tech-grid" />
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '220px', height: '220px', background: 'rgba(99,102,241,0.16)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '280px', height: '280px', background: 'rgba(16,185,129,0.16)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="login-particle login-particle-1" />
        <div className="login-particle login-particle-2" />
        <div className="login-particle login-particle-3" />
        <div className="login-particle login-particle-4" />
      </div>

      {toast.message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 400, background: toast.type === 'error' ? 'rgba(248,81,73,0.16)' : 'rgba(16,185,129,0.16)', border: `1px solid ${toast.type === 'error' ? 'rgba(248,81,73,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 'var(--r-md)', padding: '12px 14px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}>{toast.message}</div>
      )}

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-primary)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', width: 'fit-content', padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Premium Collaborative Coding</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Build, debug, and ship together in real time.</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.7 }}>Sign in to continue your synchronized coding experience with private rooms, persistent files, and live collaboration.</p>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Welcome back</h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>Sign in to your workspace</p>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>✦</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>✉</span>
              <input type="email" required className="input-base" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: '38px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔐</span>
              <input type={showPw ? 'text' : 'password'} required className="input-base" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingLeft: '38px', paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '15px' }} title={showPw ? 'Hide password' : 'Show password'}>{showPw ? '🙈' : '👁'}</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((prev) => !prev)} />
                Remember Me
              </label>
              <Link to="/register" style={{ color: 'var(--indigo-400)', fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem' }}>Forgot Password?</Link>
            </div>

            <button type="submit" disabled={loading || googleLoading} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>{loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {googleLoading ? (
              <button type="button" disabled className="btn-ghost" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'not-allowed', opacity: 0.7 }}>
                <span className="spinner" />
                <span>Signing in with Google…</span>
              </button>
            ) : googleClientId ? (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="100%"
                />
              </div>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setToast({ type: 'error', message: 'Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your frontend .env file.' })}
                style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            )}
            <button type="button" className="btn-ghost" style={{ width: '100%', padding: '10px' }}>GitHub</button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '20px' }}>New here? <Link to="/register" style={{ color: 'var(--indigo-400)', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link></p>
        </div>
      </div>
    </div>
  );
}
