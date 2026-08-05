import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '220px', height: '220px', background: 'rgba(99,102,241,0.16)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '280px', height: '280px', background: 'rgba(16,185,129,0.16)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite reverse' }} />
      </div>

      {toast.message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 400, background: toast.type === 'error' ? 'rgba(248,81,73,0.16)' : 'rgba(16,185,129,0.16)', border: `1px solid ${toast.type === 'error' ? 'rgba(248,81,73,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 'var(--r-md)', padding: '12px 14px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}>{toast.message}</div>
      )}

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '24px', alignItems: 'center' }}>
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

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>{loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-ghost" style={{ flex: 1, padding: '10px' }}>Google</button>
            <button className="btn-ghost" style={{ flex: 1, padding: '10px' }}>GitHub</button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '20px' }}>New here? <Link to="/register" style={{ color: 'var(--indigo-400)', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link></p>
        </div>
      </div>
    </div>
  );
}
