import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRound, MapPin, Link2, Globe, Save, Clock3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageBackButton from '../components/PageBackButton';
import api from '../services/api';
import { setUser, getUser } from '../utils/auth';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUserState] = useState(getUser());
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    location: '',
    website: '',
    avatarColor: '#6366f1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const targetId = userId || 'me';
        const res = await api.get(`/auth/profile/${targetId}`);
        const nextProfile = res.data;
        const nextUser = nextProfile.user || nextProfile;
        setProfile(nextProfile);
        setUserState(nextUser);
        setStats(nextProfile.stats || null);
        setRecentActivity(nextProfile.recentActivity || []);
        setCanEdit(Boolean(nextProfile.isSelf));
        setUser(nextUser);
        setForm({
          username: nextUser.username || '',
          email: nextUser.email || '',
          fullName: nextUser.fullName || '',
          bio: nextUser.bio || '',
          location: nextUser.location || '',
          website: nextUser.website || '',
          avatarColor: nextUser.avatarColor || '#6366f1',
          avatarUrl: nextUser.avatarUrl || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/auth/me', form);
      const nextUser = res.data;
      setUserState(nextUser);
      setUser(nextUser);
      setSuccess('Profile saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-indigo" style={{ width: '26px', height: '26px', borderWidth: '3px' }} />
        </main>
      </div>
    );
  }

  const initials = (user?.fullName || user?.username || 'C').slice(0, 2).toUpperCase();
  const profileUser = profile?.user || user;
  const displayName = profileUser?.fullName || profileUser?.username || 'User';
  const joinedAt = profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PageBackButton />
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Account</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Profile</h1>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <section style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 78, height: 78, borderRadius: 22, background: form.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontSize: 24, fontWeight: 700 }}>
                {form.avatarUrl ? <img src={form.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{displayName}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>@{profileUser?.username || 'unknown'}</div>
                <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)', fontSize: 13, marginTop: 10, flexWrap: 'wrap' }}>
                  <span>Joined {joinedAt}</span>
                  <span>•</span>
                  <span>{stats?.totalRoomsCreated || 0} rooms created</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[{ label: 'Rooms created', value: stats?.totalRoomsCreated || 0 }, { label: 'Public rooms', value: stats?.publicRooms || 0 }, { label: 'Private rooms', value: stats?.privateRooms || 0 }, { label: 'Saved files', value: stats?.savedFiles || 0 }].map((item) => (
                <div key={item.label} style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          {canEdit ? (
            <form onSubmit={handleSubmit} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: form.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Accent color</div>
              <input type="color" value={form.avatarColor} onChange={(e) => handleChange('avatarColor', e.target.value)} style={{ width: 56, height: 40, border: 'none', background: 'transparent', borderRadius: 10, cursor: 'pointer' }} />
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Avatar URL</label>
                <input className="input-base" value={form.avatarUrl} onChange={(e) => handleChange('avatarUrl', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          {error && <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 10, padding: '10px 12px', color: '#f85149', fontSize: 13 }}>{error}</div>}
          {success && <div style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.25)', borderRadius: 10, padding: '10px 12px', color: '#3fb950', fontSize: 13 }}>{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Username</label>
              <input className="input-base" value={form.username} onChange={(e) => handleChange('username', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Email</label>
              <input className="input-base" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Display name</label>
              <input className="input-base" value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Bio</label>
              <textarea className="input-base" value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} rows={4} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}><MapPin size={14} /> Location</label>
              <input className="input-base" value={form.location} onChange={(e) => handleChange('location', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}><Link2 size={14} /> Website</label>
              <input className="input-base" value={form.website} onChange={(e) => handleChange('website', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 18px' }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
          ) : null}

          <section style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock3 size={16} color="#a78bfa" />
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Recent activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No recent activity yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {recentActivity.map((activity, index) => (
                  <div key={`${activity.type}-${activity.title}-${index}`} style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{activity.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{activity.detail}</div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Languages used</div>
            {stats?.languagesUsed?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stats.languagesUsed.map((item) => (
                  <span key={item.language} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 999, padding: '7px 10px', fontSize: 12, color: '#c7d2fe' }}>{item.language} · {item.count}</span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No saved code yet.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
