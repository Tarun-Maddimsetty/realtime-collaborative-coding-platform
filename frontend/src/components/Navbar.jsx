import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      background: 'rgba(13,17,23,0.82)',
      borderBottom: '1px solid rgba(48,54,61,0.8)',
      backdropFilter: 'blur(18px)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '16px',
      flexShrink: 0,
      zIndex: 100,
      position: 'sticky',
      top: 0,
    }}>
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 10px 24px rgba(99,102,241,0.35)',
          flexShrink: 0,
        }}><Sparkles size={16} /></div>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Code<span style={{ color: 'var(--indigo-400)' }}>Collab</span>
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/saved-files" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'rgba(99,102,241,0.06)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            <FolderOpen size={15} />
            Saved Files
          </Link>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '4px 12px 4px 4px',
          }}>
            <div style={{
              width: '26px', height: '26px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }} className="hide-mobile">
              {user.username}
            </span>
          </div>

          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8125rem', display: 'inline-flex', gap: 8 }}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
