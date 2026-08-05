import { useEffect, useState } from 'react';
import { Bell, MoonStar, SlidersHorizontal, Shield, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageBackButton from '../components/PageBackButton';
import api from '../services/api';
import { setUser, getUser } from '../utils/auth';

const defaultPreferences = {
  theme: 'dark',
  editorTheme: 'vs-dark',
  fontSize: 14,
  compactMode: false,
  notifications: {
    roomUpdates: true,
    mentions: true,
    fileChanges: true,
  },
  privacy: {
    showEmail: false,
    showOnlineStatus: true,
    profileVisible: true,
  },
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const user = getUser();
    const next = user?.preferences || defaultPreferences;
    setPreferences({ ...defaultPreferences, ...next, notifications: { ...defaultPreferences.notifications, ...(next.notifications || {}) }, privacy: { ...defaultPreferences.privacy, ...(next.privacy || {}) } });
    setLoading(false);
  }, []);

  const updateSetting = (path, value) => {
    setPreferences((prev) => {
      const next = { ...prev };
      if (path === 'theme' || path === 'editorTheme' || path === 'fontSize' || path === 'compactMode') {
        next[path] = value;
        return next;
      }

      const [section, key] = path.split('.');
      next[section] = { ...next[section], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');

    try {
      const res = await api.put('/auth/me', { preferences });
      setUser(res.data);
      setStatus('Settings saved successfully');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Unable to save settings');
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PageBackButton />
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Preferences</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Settings</h1>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'grid', gap: 20 }}>
          {status && <div style={{ borderRadius: 10, padding: '10px 12px', fontSize: 13, background: status.includes('success') ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)', border: `1px solid ${status.includes('success') ? 'rgba(63,185,80,0.25)' : 'rgba(248,81,73,0.25)'}`, color: status.includes('success') ? '#3fb950' : '#f85149' }}>{status}</div>}

          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 700 }}><MoonStar size={16} /> Appearance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Theme</label>
                <select className="input-base" value={preferences.theme} onChange={(e) => updateSetting('theme', e.target.value)}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="midnight">Midnight</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Editor theme</label>
                <select className="input-base" value={preferences.editorTheme} onChange={(e) => updateSetting('editorTheme', e.target.value)}>
                  <option value="vs-dark">VS Dark</option>
                  <option value="light">Light</option>
                  <option value="hc-black">High Contrast</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Font size</label>
                <input type="range" min="12" max="20" value={preferences.fontSize} onChange={(e) => updateSetting('fontSize', Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>{preferences.fontSize}px</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Compact mode</span>
                <input type="checkbox" checked={Boolean(preferences.compactMode)} onChange={(e) => updateSetting('compactMode', e.target.checked)} />
              </div>
            </div>
          </section>

          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 700 }}><Bell size={16} /> Notifications</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                ['notifications.roomUpdates', 'Room updates'],
                ['notifications.mentions', 'Mentions'],
                ['notifications.fileChanges', 'File changes'],
              ].map(([path, label]) => (
                <label key={path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span>{label}</span>
                  <input type="checkbox" checked={path === 'notifications.roomUpdates' ? preferences.notifications.roomUpdates : path === 'notifications.mentions' ? preferences.notifications.mentions : preferences.notifications.fileChanges} onChange={(e) => updateSetting(path, e.target.checked)} />
                </label>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 700 }}><Shield size={16} /> Privacy</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                ['privacy.showEmail', 'Show email to teammates'],
                ['privacy.showOnlineStatus', 'Show online status'],
                ['privacy.profileVisible', 'Profile visible to others'],
              ].map(([path, label]) => (
                <label key={path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span>{label}</span>
                  <input type="checkbox" checked={path === 'privacy.showEmail' ? preferences.privacy.showEmail : path === 'privacy.showOnlineStatus' ? preferences.privacy.showOnlineStatus : preferences.privacy.profileVisible} onChange={(e) => updateSetting(path, e.target.checked)} />
                </label>
              ))}
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleSave} className="btn-primary" disabled={saving} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 18px' }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
