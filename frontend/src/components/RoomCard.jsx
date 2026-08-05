import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom, joinRoomByCode } from '../services/roomService';

const LANG_META = {
  html: { label: 'HTML', color: '#e34c26', bg: 'rgba(227,76,38,0.1)', border: 'rgba(227,76,38,0.25)', icon: 'HT' },
  css: { label: 'CSS', color: '#264de4', bg: 'rgba(38,77,228,0.1)', border: 'rgba(38,77,228,0.25)', icon: 'CS' },
  javascript: { label: 'JavaScript', color: '#f0db4f', bg: 'rgba(240,219,79,0.1)', border: 'rgba(240,219,79,0.25)', icon: 'JS' },
  python: { label: 'Python', color: '#4b8bbe', bg: 'rgba(75,139,190,0.1)', border: 'rgba(75,139,190,0.25)', icon: 'PY' },
  java: { label: 'Java', color: '#f89820', bg: 'rgba(248,152,32,0.1)', border: 'rgba(248,152,32,0.25)', icon: 'JV' },
  cpp: { label: 'C++', color: '#9c6af7', bg: 'rgba(156,106,247,0.1)', border: 'rgba(156,106,247,0.25)', icon: 'C++' },
  c: { label: 'C', color: '#3fb950', bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.25)', icon: 'C' },
  csharp: { label: 'C#', color: '#9b59b6', bg: 'rgba(155,89,182,0.1)', border: 'rgba(155,89,182,0.25)', icon: 'C#' },
  go: { label: 'Go', color: '#00add8', bg: 'rgba(0,173,216,0.1)', border: 'rgba(0,173,216,0.25)', icon: 'GO' },
  php: { label: 'PHP', color: '#777bb3', bg: 'rgba(119,123,179,0.1)', border: 'rgba(119,123,179,0.25)', icon: 'PHP' },
  ruby: { label: 'Ruby', color: '#cc342d', bg: 'rgba(204,52,45,0.1)', border: 'rgba(204,52,45,0.25)', icon: 'RB' },
  rust: { label: 'Rust', color: '#dea584', bg: 'rgba(222,165,132,0.1)', border: 'rgba(222,165,132,0.25)', icon: 'RS' },
  typescript: { label: 'TypeScript', color: '#3178c6', bg: 'rgba(49,120,198,0.1)', border: 'rgba(49,120,198,0.25)', icon: 'TS' },
  json: { label: 'JSON', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: 'JSN' },
};

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [error, setError] = useState('');
  const meta = LANG_META[room.language] || { label: room.language, color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border)', icon: '?' };

  const handleJoin = async () => {
    if (room.visibility === 'private') {
      setShowPasswordPrompt(true);
      setError('');
      return;
    }

    try {
      await joinRoom(room.roomId);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join room');
    }
  };

  const handlePrivateJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await joinRoomByCode({ roomCode: room.roomCode, password });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join private room');
    }
  };

  const initials = room.owner?.username?.[0]?.toUpperCase() ?? '?';
  const participantCount = room.participants?.length || 0;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</h3>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '5px', padding: '3px 8px', flexShrink: 0 }}>{meta.icon}</span>
      </div>

      <div style={{ height: '1px', background: 'var(--border-muted)' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{room.owner?.username}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="status-dot online" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{participantCount} online</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: room.visibility === 'private' ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>{room.visibility === 'private' ? 'Private' : 'Public'}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code: {room.roomCode}</span>
      </div>

      <button onClick={handleJoin} className="btn-primary" style={{ width: '100%', padding: '9px', fontSize: '0.8125rem' }}>Join Room →</button>

      {showPasswordPrompt && (
        <form onSubmit={handlePrivateJoin} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input className="input-base" type="password" placeholder="Room password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <span style={{ color: '#f85149', fontSize: '0.75rem' }}>{error}</span>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowPasswordPrompt(false)}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Unlock</button>
          </div>
        </form>
      )}
    </div>
  );
}
