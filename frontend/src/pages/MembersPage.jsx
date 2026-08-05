import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageBackButton from '../components/PageBackButton';
import { getParticipants } from '../services/roomService';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function MembersPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await getParticipants(roomId);
        setParticipants(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load room members');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [roomId]);

  const getInitials = (user) => {
    const source = user?.fullName || user?.username || 'User';
    return source.split(' ').slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'U';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PageBackButton to="/rooms" />
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Members</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>Loading participants…</div>
        ) : error ? (
          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, color: '#f85149' }}>{error}</div>
        ) : participants.length === 0 ? (
          <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, color: 'var(--text-muted)' }}>No participants found for this room.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {participants.map((participant) => {
              const userId = participant._id || participant.id;
              const isOnline = participant.preferences?.privacy?.showOnlineStatus !== false;
              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() => navigate(`/profile/${userId}`)}
                  style={{
                    background: 'rgba(22,27,34,0.8)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: 18,
                    textAlign: 'left',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: participant.avatarColor || '#6366f1', color: '#fff', fontWeight: 700 }}>
                      {participant.avatarUrl ? <img src={participant.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} /> : getInitials(participant)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{participant.fullName || participant.username || 'Anonymous'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{participant.username || 'unknown'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>{participant.bio ? participant.bio : 'No bio available'}</span>
                    <span style={{ color: isOnline ? '#3fb950' : 'var(--text-muted)', fontWeight: 700 }}>{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Role:</strong> {participant.role || 'Member'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Joined:</strong> {formatDate(participant.createdAt)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
