import { useEffect, useMemo, useState } from 'react';
import { Download, FolderOpen, PencilLine, Search, Trash2, ArrowUpDown } from 'lucide-react';
import { getUserFiles, deleteSavedFile, updateFile } from '../services/roomService';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import PageBackButton from '../components/PageBackButton';

const LANGUAGE_OPTIONS = ['All', 'javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'typescript', 'json'];

export default function SavedFilesPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);

  const refreshFiles = () => {
    setLoading(true);
    getUserFiles()
      .then((res) => setFiles(res.data || []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshFiles();

    const onFilesUpdated = () => refreshFiles();
    window.addEventListener('saved-files-updated', onFilesUpdated);
    return () => window.removeEventListener('saved-files-updated', onFilesUpdated);
  }, []);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    const next = [...files].filter((file) => {
      const nameMatches = !term || (file.name || '').toLowerCase().includes(term);
      const languageMatches = languageFilter === 'All' || file.language === languageFilter;
      return nameMatches && languageMatches;
    });

    next.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return next;
  }, [files, search, languageFilter, sortOrder]);

  const handleOpen = (file) => {
    navigate(`/room/${file.roomId}`, { state: { file } });
  };

  const handleDelete = async (fileId) => {
    try {
      await deleteSavedFile(fileId);
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
      window.dispatchEvent(new CustomEvent('saved-files-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (file) => {
    const extension = file.language === 'python' ? 'py' : file.language === 'java' ? 'java' : file.language === 'cpp' ? 'cpp' : file.language === 'c' ? 'c' : file.language === 'html' ? 'html' : file.language === 'css' ? 'css' : file.language === 'javascript' ? 'js' : 'txt';
    const blob = new Blob([file.code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name || 'file'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRename = async (file) => {
    const nextName = window.prompt('Rename file:', file.name || '');
    if (!nextName || !nextName.trim()) return;

    try {
      const updated = await updateFile(file.roomId, file._id, {
        name: nextName.trim(),
        filename: nextName.trim(),
        language: file.language,
        code: file.code,
      });

      setFiles((prev) => prev.map((item) => item._id === file._id ? { ...item, ...updated.data } : item));
      window.dispatchEvent(new CustomEvent('saved-files-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PageBackButton />
            <div>
              <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Workspace</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 6 }}>Saved Files</h1>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename"
              style={{ paddingLeft: 36 }}
            />
          </div>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="input-base"
            style={{ width: 180 }}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>{lang === 'All' ? 'All languages' : lang}</option>
            ))}
          </select>

          <button
            className="btn-ghost"
            onClick={() => setSortOrder((prev) => prev === 'newest' ? 'oldest' : 'newest')}
            style={{ display: 'inline-flex', gap: 8 }}
          >
            <ArrowUpDown size={15} />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[1,2,3,4].map((item) => (
              <div key={item} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 18 }} />
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ background: 'rgba(22,27,34,0.9)', border: '1px solid var(--border)', borderRadius: 18, padding: 30, textAlign: 'center' }}>
            <FolderOpen size={28} style={{ marginBottom: 14, opacity: 0.7 }} />
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>No saved files found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try another filename or save a file in a room.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {filteredFiles.map((file) => (
              <div
                key={file._id}
                style={{
                  background: 'rgba(22,27,34,0.8)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>{file.language}</div>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 999, padding: '6px 10px', fontSize: 11, color: '#c7d2fe' }}>{file.language}</div>
                </div>

                <div style={{ display: 'grid', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Modified:</strong> {file.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Recently'}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Room:</strong> {file.roomName || file.roomId || 'Personal file'}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button className="btn-ghost" onClick={() => handleOpen(file)} style={{ flex: 1, minWidth: 96 }}><FolderOpen size={14} /> Open</button>
                  <button className="btn-ghost" onClick={() => handleRename(file)} style={{ flex: 1, minWidth: 96 }}><PencilLine size={14} /> Rename</button>
                  <button className="btn-ghost" onClick={() => handleDownload(file)} style={{ flex: 1, minWidth: 96 }}><Download size={14} /> Download</button>
                  <button className="btn-danger" onClick={() => handleDelete(file._id)} style={{ flex: 1, minWidth: 96 }}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
