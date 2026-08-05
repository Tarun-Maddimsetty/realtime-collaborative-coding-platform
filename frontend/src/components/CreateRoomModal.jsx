import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';

const LANGUAGES = [
  { value: 'html', label: 'HTML', icon: 'HT', color: '#e34c26' },
  { value: 'css', label: 'CSS', icon: 'CS', color: '#264de4' },
  { value: 'javascript', label: 'JavaScript', icon: 'JS', color: '#f0db4f' },
  { value: 'python', label: 'Python', icon: 'PY', color: '#4b8bbe' },
  { value: 'java', label: 'Java', icon: 'JV', color: '#f89820' },
  { value: 'cpp', label: 'C++', icon: 'C++', color: '#9c6af7' },
  { value: 'c', label: 'C', icon: 'C', color: '#3fb950' },
  { value: 'csharp', label: 'C#', icon: 'C#', color: '#9b59b6' },
  { value: 'go', label: 'Go', icon: 'GO', color: '#00add8' },
  { value: 'php', label: 'PHP', icon: 'PHP', color: '#777bb3' },
  { value: 'ruby', label: 'Ruby', icon: 'RB', color: '#cc342d' },
  { value: 'rust', label: 'Rust', icon: 'RS', color: '#dea584' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS', color: '#3178c6' },
  { value: 'json', label: 'JSON', icon: 'JSN', color: '#f59e0b' },
];

export default function CreateRoomModal({ onClose }) {
  const [form, setForm] = useState({ name: '', roomCode: '', password: '', language: 'javascript', isPrivate: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Room name is required');
    if (form.isPrivate && !form.roomCode.trim()) return setError('Private rooms require a room code');
    if (form.isPrivate && !form.password.trim()) return setError('Private rooms require a password');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        roomName: form.name.trim(),
        roomCode: form.roomCode.trim().toUpperCase(),
        password: form.password.trim(),
        language: form.language,
        isPrivate: form.isPrivate,
        visibility: form.isPrivate ? 'private' : 'public',
      };
      const res = await createRoom(payload);
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally { setLoading(false); }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-slide-up" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '28px', width: '100%', maxWidth: '460px',maxHeight:'90vh',overflow:'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create a Room</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>Set up your collaborative workspace</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s', flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 'var(--r-md)', padding: '10px 14px', color: '#f85149', fontSize: '0.8125rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>Room Name</label>
            <input className="input-base" placeholder="e.g. Algorithm Practice" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '10px' }}>Language</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {LANGUAGES.map((l) => {
                const selected = form.language === l.value;
                return (
                  <button key={l.value} type="button" onClick={() => setForm({ ...form, language: l.value })} style={{ padding: '12px 4px 10px', borderRadius: 'var(--r-md)', border: `1px solid ${selected ? l.color + '55' : 'var(--border)'}`, background: selected ? l.color + '18' : 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s', outline: selected ? `2px solid ${l.color}40` : 'none', outlineOffset: '1px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: selected ? l.color : 'var(--text-muted)', transition: 'color 0.15s' }}>{l.icon}</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selected ? 'var(--text-secondary)' : 'var(--text-muted)', transition: 'color 0.15s' }}>{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div role="switch" aria-checked={form.isPrivate} onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })} style={{ width: '38px', height: '22px', borderRadius: '11px', background: form.isPrivate ? 'var(--indigo-500)' : 'var(--bg-overlay)', border: `1px solid ${form.isPrivate ? 'var(--indigo-500)' : 'var(--border)'}`, position: 'relative', transition: 'background 0.2s, border-color 0.2s', flexShrink: 0, cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: '2px', left: form.isPrivate ? '17px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Private Room</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Only invited users can join</p>
            </div>
          </label>

          {form.isPrivate && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>Room Code</label>
                <input className="input-base" placeholder="e.g. ALPHA42" value={form.roomCode} onChange={(e) => setForm({ ...form, roomCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>Room Password</label>
                <input type="password" className="input-base" placeholder="Create a secure password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, padding: '10px' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, padding: '10px' }}>{loading ? <><span className="spinner" /> Creating…</> : '+ Create Room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
