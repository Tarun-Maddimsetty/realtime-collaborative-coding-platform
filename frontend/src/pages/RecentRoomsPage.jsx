import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageBackButton from '../components/PageBackButton';
import { getRooms } from '../services/roomService';
import { useSocket } from '../hooks/useSocket';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 60000) return 'just now';
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

export default function RecentRoomsPage({ filter = 'all' }) {
  const navigate = useNavigate();
  const socketRef = useSocket();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = filter === 'private' ? 'Private Rooms' : filter === 'public' ? 'Public Rooms' : filter === 'active' ? 'Active Rooms' : 'Rooms';
  const emptyText = filter === 'private'
    ? 'No private rooms are available right now.'
    : filter === 'public'
      ? 'No public rooms are available right now.'
      : filter === 'active'
        ? 'No active collaborations are available right now.'
        : 'No rooms are available right now.';

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const visibility = filter === 'private' ? 'private' : filter === 'public' ? 'public' : 'all';
        const res = await getRooms('', visibility);
        const allRooms = Array.isArray(res.data) ? res.data : [];
        const filteredRooms = filter === 'active'
          ? allRooms.filter((room) => (room.participants?.length || 0) > 1)
          : allRooms;
        setRooms(filteredRooms.slice(0, 12));
      } finally {
        setLoading(false);
      }
    };

    loadRecent();
  }, [filter]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleRoomActivity = ({ roomId, participants, updatedAt }) => {
      setRooms((prevRooms) => prevRooms.map((room) => {
        if (room.roomId !== roomId) return room;
        const mergedParticipants = participants?.length ? participants : room.participants || [];
        return {
          ...room,
          participants: mergedParticipants,
          updatedAt: updatedAt || room.updatedAt,
        };
      }));
    };

    socket.on('room-activity', handleRoomActivity);
    return () => socket.off('room-activity', handleRoomActivity);
  }, [socketRef]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PageBackButton />
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Overview</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>{title}</h1>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
          {loading ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '24px 0' }}>{emptyText}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {rooms.map((room) => {
                const participantCount = (room.participants || []).length;
                const isActive = participantCount > 0;

                return (
                  <div
                    key={room._id}
                    style={{
                      background: 'rgba(13,17,23,0.8)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      textAlign: 'left',
                      color: 'inherit',
                      transition: 'border-color 0.18s ease, transform 0.18s ease',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                      event.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = 'var(--border)';
                      event.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>{room.name}</div>
                      <span style={{
                        fontSize: 10,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
                        border: `1px solid ${isActive ? 'rgba(34,197,94,0.35)' : 'rgba(148,163,184,0.3)'}`,
                        color: isActive ? '#86efac' : 'var(--text-muted)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}>
                        {isActive ? 'Active' : 'Offline'}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span>Language: {room.language || 'javascript'}</span>
                      <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>{room.visibility === 'private' ? 'Private' : 'Public'}</span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Owner:</strong> {room.owner?.username || 'Unknown'}
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Participants:</strong> {participantCount}
                    </div>

                    <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Created:</strong> {formatDate(room.createdAt)}</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Last active:</strong> {formatRelativeTime(room.updatedAt)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <button type="button" onClick={() => navigate(`/room/${room.roomId}`)} className="btn-ghost" style={{ flex: 1, minWidth: 110 }}>
                        Open room
                      </button>
                      <button type="button" onClick={() => navigate(`/room/${room.roomId}/members`)} className="btn-primary" style={{ flex: 1, minWidth: 110 }}>
                        View Members
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
