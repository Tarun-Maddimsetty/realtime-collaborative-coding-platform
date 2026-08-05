import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getRooms, joinRoom, joinRoomByCode } from '../services/roomService';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ roomCode: '', password: '' });
  const [error, setError] = useState('');

  const loadRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleJoinRoom = async (room) => {
    try {
      if (room.visibility === 'private') {
        const res = await joinRoomByCode({ roomCode: room.roomCode, password: form.password || '' });
        navigate(`/room/${res.data.roomId}`);
        return;
      }
      await joinRoom(room.roomId);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join room');
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.roomCode.trim()) return setError('Room code is required');

    try {
      const res = await joinRoomByCode({ roomCode: form.roomCode, password: form.password });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join room');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Collaboration</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Join Room</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 420px) 1fr', gap: 18 }}>
          <form onSubmit={handleJoinByCode} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Quick join</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>Use a room code</h2>
            </div>
            {error && <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 10, padding: '10px 12px', color: '#f85149', fontSize: 13 }}>{error}</div>}
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Room code</label>
              <input className="input-base" value={form.roomCode} onChange={(e) => setForm({ ...form, roomCode: e.target.value.toUpperCase() })} placeholder="ABC12345" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Password (private rooms only)</label>
              <input type="password" className="input-base" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optional for public rooms" />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>Join room</button>
          </form>

          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Available</div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
              </div>
            ) : rooms.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '24px 0' }}>No public rooms are available right now.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {rooms.map((room) => (
                  <div key={room._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{room.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{room.visibility === 'private' ? 'Private room' : 'Public room'} · {room.participants?.length || 0} members</div>
                    </div>
                    <button className="btn-ghost" onClick={() => handleJoinRoom(room)} style={{ padding: '8px 12px' }}>Join</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
