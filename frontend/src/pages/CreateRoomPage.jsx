import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', roomCode: '', password: '', language: 'javascript', isPrivate: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Room name is required');
    if (form.isPrivate && !form.roomCode.trim()) return setError('Private rooms require a room code');
    if (form.isPrivate && !form.password.trim()) return setError('Private rooms require a password');

    setLoading(true);
    setError('');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Workspace</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Create Room</h1>
          </div>
        </div>

        <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, maxWidth: 760 }}>
          {error && <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 10, padding: '10px 12px', color: '#f85149', fontSize: 13, marginBottom: 18 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Room Name</label>
              <input className="input-base" placeholder="e.g. Algorithm Practice" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Language</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8 }}>
                {LANGUAGES.map((l) => {
                  const selected = form.language === l.value;
                  return (
                    <button key={l.value} type="button" onClick={() => setForm({ ...form, language: l.value })} style={{ padding: '12px 4px 10px', borderRadius: 'var(--r-md)', border: `1px solid ${selected ? l.color + '55' : 'var(--border)'}`, background: selected ? l.color + '18' : 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: selected ? l.color : 'var(--text-muted)' }}>{l.icon}</span>
                      <span style={{ fontSize: '0.625rem', fontWeight: 500, color: selected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div role="switch" aria-checked={form.isPrivate} onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })} style={{ width: 38, height: 22, borderRadius: 11, background: form.isPrivate ? 'var(--indigo-500)' : 'var(--bg-overlay)', border: `1px solid ${form.isPrivate ? 'var(--indigo-500)' : 'var(--border)'}`, position: 'relative', transition: 'background 0.2s, border-color 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: form.isPrivate ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Private Room</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Only invited users can join</p>
              </div>
            </label>

            {form.isPrivate && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Room Code</label>
                  <input className="input-base" placeholder="e.g. ALPHA42" value={form.roomCode} onChange={(e) => setForm({ ...form, roomCode: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Room Password</label>
                  <input type="password" className="input-base" placeholder="Create a secure password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 18px' }}>{loading ? 'Creating…' : '+ Create Room'}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
