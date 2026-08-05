import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, FolderOpen, Lock, MessageSquareText, Users, Sparkles, Clock3 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import { useAuth } from '../hooks/useAuth';
import { getRooms, getUserFiles, updateFile, deleteFile } from '../services/roomService';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const toastTimerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const statCards = [
    { label: 'Total Rooms', value: String(rooms.length || 0), accent: '#818cf8', icon: Users, to: '/rooms' },
    { label: 'Saved Files', value: String(userFiles.length || 0), accent: '#22c55e', icon: FolderOpen, to: '/saved-files' },
    { label: 'Public Rooms', value: String(rooms.filter((room) => room.visibility !== 'private').length || 0), accent: '#38bdf8', icon: Activity, to: '/public-rooms' },
    { label: 'Private Rooms', value: String(rooms.filter((room) => room.visibility === 'private').length || 0), accent: '#f59e0b', icon: Lock, to: '/private-rooms' },
    { label: 'Active Collaborations', value: String(Math.max(rooms.filter((room) => (room.participants?.length || 0) > 1).length, 0)), accent: '#a78bfa', icon: MessageSquareText, to: '/active-rooms' },
  ];

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (location.state?.deletedMessage) {
      setToast(location.state.deletedMessage);
      window.history.replaceState({}, '');
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(''), 3200);
    }
  }, [location.state]);

  useEffect(() => {
    getRooms()
      .then((res) => setRooms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshUserFiles = () => {
    if (!currentUserId) {
      setUserFiles([]);
      setFilesLoading(false);
      return;
    }

    setFilesLoading(true);
    getUserFiles()
      .then((res) => setUserFiles(res.data || []))
      .catch(console.error)
      .finally(() => setFilesLoading(false));
  };

  useEffect(() => {
    refreshUserFiles();
  }, [currentUserId]);

  useEffect(() => {
    const handleFilesUpdated = () => refreshUserFiles();
    window.addEventListener('saved-files-updated', handleFilesUpdated);
    return () => window.removeEventListener('saved-files-updated', handleFilesUpdated);
  }, [currentUserId]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = rooms.filter((room) => {
    const searchableText = [room.name, room.roomName, room.roomCode].filter(Boolean).join(' ').toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  const recentRooms = [...rooms].slice(0, 4);

  const showToast = (message, duration = 2800) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    if (message) {
      toastTimerRef.current = window.setTimeout(() => setToast(''), duration);
    }
  };

  const handleOpenFile = (file) => {
    navigate(`/room/${file.roomId}`, { state: { file } });
  };

  const handleRenameFile = async (file) => {
    const nextName = renameValue.trim();
    if (!nextName) {
      showToast('File name cannot be empty');
      return;
    }

    try {
      const updated = await updateFile(file.roomId, file._id, { name: nextName, language: file.language, code: file.code });
      setUserFiles((prev) => prev.map((item) => item._id === file._id ? updated.data : item));
      setEditingFileId(null);
      setRenameValue('');
      refreshUserFiles();
      showToast('File renamed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to rename file');
    }
  };

  const handleDeleteFile = async (file) => {
    try {
      await deleteFile(file.roomId, file._id);
      setUserFiles((prev) => prev.filter((item) => item._id !== file._id));
      refreshUserFiles();
      showToast('File deleted');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to delete file');
    }
  };

  const handleDownloadFile = (file) => {
    const extension = file.language === 'python' ? 'py' : file.language === 'java' ? 'java' : file.language === 'cpp' ? 'cpp' : file.language === 'c' ? 'c' : file.language === 'html' ? 'html' : file.language === 'css' ? 'css' : 'js';
    const blob = new Blob([file.code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name || 'file'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File downloaded');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 32%), var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {toast && (
        <div style={{
          position: 'fixed', top: '68px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 320,
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(129,140,248,0.35)',
          borderRadius: 'var(--r-lg)',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'toastIn 0.24s ease both',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '15px' }}>🗑</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{toast}</span>
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '0 0 0 6px', lineHeight: 1 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />

        <main style={{ flex: 1, padding: '28px 28px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 26, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Overview</div>
              <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.05em', marginTop: 8 }}>Workspace Dashboard</h1>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '11px 18px', display: 'inline-flex', gap: 8 }}>
              <Sparkles size={16} /> Create Room
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
            {statCards.map(({ label, value, accent, icon: Icon, to }) => (
              <button key={label} type="button" onClick={() => navigate(to)} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, boxShadow: '0 12px 28px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${accent}22, transparent 40%)` }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 12 }}>{value}</div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}18`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                    <Icon size={19} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, marginBottom: 28 }}>
            <section style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Quick Search</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Join a room</h2>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: 14 }}>
                <input
                  className="input-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rooms by name or code"
                  style={{ paddingLeft: 40 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {filtered.slice(0, 4).map((room) => (
                  <div key={room._id} style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{room.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>{room.language || 'javascript'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 12 }}>
                      <span>{room.participants?.length || 0} members</span>
                      <span>{room.visibility || 'public'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Clock3 size={16} color="#a78bfa" />
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Recent Rooms</h3>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {recentRooms.map((room) => (
                  <div key={room._id} style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{room.name}</div>
                      <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#c7d2fe' }}>{room.language || 'javascript'}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>{room.participants?.length || 0} members · last opened just now</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Your Files</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '3px' }}>Saved across every room you’ve worked in</p>
              </div>
            </div>

            {filesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {[1,2,3].map((item) => (
                  <div key={item} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px', minHeight: '90px' }}>
                    <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                  </div>
                ))}
              </div>
            ) : userFiles.length === 0 ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No saved files yet. Create or open a room and save a file to see it here.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {userFiles.map((file) => (
                  <div key={file._id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {editingFileId === file._id ? (
                      <>
                        <input className="input-base" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-primary" style={{ flex: 1, padding: '7px 10px' }} onClick={() => handleRenameFile(file)}>Save</button>
                          <button className="btn-ghost" style={{ flex: 1, padding: '7px 10px' }} onClick={() => { setEditingFileId(null); setRenameValue(''); }}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</h3>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{file.language}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          Last modified: {file.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Recently saved'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                          <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.74rem' }} onClick={() => handleOpenFile(file)}>Open</button>
                          <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.74rem' }} onClick={() => { setEditingFileId(file._id); setRenameValue(file.name); }}>Rename</button>
                          <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.74rem' }} onClick={() => handleDownloadFile(file)}>Download</button>
                          <button className="btn-danger" style={{ padding: '6px 10px', fontSize: '0.74rem' }} onClick={() => handleDeleteFile(file)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Coding Rooms</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '3px' }}>Browse and join collaborative spaces</p>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="skeleton" style={{ height: '18px', width: '55%' }} />
                    <div className="skeleton" style={{ height: '13px', width: '35%' }} />
                    <div style={{ height: '1px', background: 'var(--border-muted)' }} />
                    <div className="skeleton" style={{ height: '36px', width: '100%' }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>🏠</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>{search ? 'No rooms match your search' : 'No rooms yet'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>{search ? 'Try a different keyword' : 'Create a room to start collaborating with your team'}</p>
                {!search && <button onClick={() => setShowModal(true)} className="btn-primary">+ Create your first room</button>}
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                {filtered.map((room) => <RoomCard key={room._id} room={room} />)}
              </div>
            )}
          </section>
        </main>
      </div>

      {showModal && <CreateRoomModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
