import { useState, useEffect, useCallback, useRef } from 'react';
import { buildPreviewDocument } from '../utils/preview.mjs';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CodeEditor from '../components/CodeEditor';
import Chat from '../components/Chat';
import OutputPanel from '../components/OutputPanel';
import { getRoomById, leaveRoom, deleteRoom, listFiles, createFile, updateFile, deleteFile } from '../services/roomService';
import { executeCode } from '../services/executeService';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

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

export default function Room() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useAuth();
  const socketRef   = useSocket();

  const [room, setRoom]               = useState(null);
  const [code, setCode]               = useState('');
  const [htmlCode, setHtmlCode]       = useState('');
  const [cssCode, setCssCode]         = useState('');
  const [jsCode, setJsCode]           = useState('');
  const [language, setLanguage]       = useState('javascript');
  const [output, setOutput]           = useState('');
  const [stderrOutput, setStderrOutput] = useState('');
  const [compileErrorOutput, setCompileErrorOutput] = useState('');
  const [runtimeErrorOutput, setRuntimeErrorOutput] = useState('');
  const [previewDoc, setPreviewDoc]   = useState('');
  const [execStatus, setExecStatus]   = useState('');
  const [execLoading, setExecLoading] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [requiresInput, setRequiresInput] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [executionSessionId, setExecutionSessionId] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeTab, setActiveTab]     = useState('chat');
  const [socketReady, setSocketReady] = useState(false);
  const [langOpen, setLangOpen]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [savedFiles, setSavedFiles] = useState([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);
  const filesPanelRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    getRoomById(roomId)
      .then(res => {
        const initialFile = location.state?.file;
        const fileToOpen = initialFile?.roomId === res.data.roomId ? initialFile : null;

        setRoom(res.data);
        setCode(fileToOpen?.code || res.data.code || '');
        setHtmlCode(fileToOpen?.language === 'html' ? fileToOpen.code : res.data.htmlCode || '');
        setCssCode(fileToOpen?.language === 'css' ? fileToOpen.code : res.data.cssCode || '');
        setJsCode(fileToOpen?.language === 'javascript' ? fileToOpen.code : res.data.jsCode || '');
        setLanguage(fileToOpen?.language || res.data.language || 'javascript');
      })
      .catch(() => navigate('/dashboard'));
  }, [roomId, navigate, location.state?.file]);

  useEffect(() => {
    if (!roomId) return;
    listFiles(roomId)
      .then((res) => setSavedFiles(res.data))
      .catch(() => setSavedFiles([]));
  }, [roomId]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!filesOpen) return;
    const handlePointerDown = (event) => {
      if (filesPanelRef.current && !filesPanelRef.current.contains(event.target)) {
        setFilesOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFilesOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filesOpen]);

  useEffect(() => {
    let intervalId;
    const attachListeners = (socket) => {
      socket.emit('join-room', roomId);
      socket.on('load-code', ({ code, language, htmlCode = '', cssCode = '', jsCode = '' }) => {
        setCode(code || '');
        setHtmlCode(htmlCode || '');
        setCssCode(cssCode || '');
        setJsCode(jsCode || '');
        setLanguage(language || 'javascript');
      });
      socket.on('code-update', ({ code, language, htmlCode = '', cssCode = '', jsCode = '' }) => {
        setCode(code || '');
        setHtmlCode(htmlCode || '');
        setCssCode(cssCode || '');
        setJsCode(jsCode || '');
        setLanguage(language || 'javascript');
      });
      socket.on('language-update', ({ language }) => setLanguage(language));
      socket.on('active-users',    setActiveUsers);
      socket.on('user-joined',     ({ username }) => console.log(`[Room] ${username} joined`));
      socket.on('user-left',       ({ username }) => console.log(`[Room] ${username} left`));
      socket.on('room-deleted',    () => navigate('/dashboard', { state: { deletedMessage: 'Room has been deleted' } }));
      setSocketReady(true);
    };
    const tryAttach = () => {
      const socket = socketRef.current;
      if (socket?.connected) { clearInterval(intervalId); attachListeners(socket); }
    };
    tryAttach();
    intervalId = setInterval(tryAttach, 200);
    return () => {
      clearInterval(intervalId);
      const socket = socketRef.current;
      if (socket) {
        socket.emit('leave-room', roomId);
        ['load-code','code-update','language-update','active-users','user-joined','user-left','room-deleted']
          .forEach(e => socket.off(e));
      }
    };
  }, [socketRef, roomId]);

  const handleCodeChange = useCallback((value) => {
    if (language === 'html') {
      setCode(value);
      setHtmlCode(value);
      socketRef.current?.emit('code-change', { roomId, code: value, language, htmlCode: value, cssCode, jsCode });
    } else if (language === 'css') {
      setCode(value);
      setCssCode(value);
      socketRef.current?.emit('code-change', { roomId, code: value, language, htmlCode, cssCode: value, jsCode });
    } else if (language === 'javascript') {
      setCode(value);
      setJsCode(value);
      socketRef.current?.emit('code-change', { roomId, code: value, language, htmlCode, cssCode, jsCode: value });
    } else {
      setCode(value);
      socketRef.current?.emit('code-change', { roomId, code: value, language, htmlCode, cssCode, jsCode });
    }
  }, [socketRef, roomId, language, htmlCode, cssCode, jsCode]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setLangOpen(false);
    socketRef.current?.emit('language-change', { roomId, language: lang });
  };

  useEffect(() => {
    const content = language === 'html' ? htmlCode : language === 'css' ? cssCode : language === 'javascript' ? jsCode : code;
    setPreviewDoc(buildPreviewDocument({ code: content, language, htmlCode, cssCode, jsCode }));
  }, [language, htmlCode, cssCode, jsCode, code]);

  const handleRun = async (stdinOverride = '') => {
    const resolvedInput = typeof stdinOverride === 'string' ? stdinOverride : stdinInput;
    const shouldPreserveOutput = typeof stdinOverride === 'string' && stdinOverride.length > 0;

    setExecLoading(true);
    setAwaitingInput(false);
    setActiveTab('output');
    setPreviewDoc('');

    if (!shouldPreserveOutput) {
      setOutput('');
      setStderrOutput('');
      setCompileErrorOutput('');
      setRuntimeErrorOutput('');
      setExecStatus('');
    }

    try {
      const payload = {
        code: language === 'html' ? htmlCode : language === 'css' ? cssCode : language === 'javascript' ? jsCode : code,
        language,
        htmlCode,
        cssCode,
        jsCode,
        input: resolvedInput,
        stdin: resolvedInput,
        sessionId: resolvedInput ? executionSessionId : null,
      };

      const res = await executeCode(payload);
      const {
        success,
        output: executionOutput,
        stdout,
        stderr,
        compileError,
        runtimeError,
        status,
        error,
        preview,
        isPreview,
        needsInput,
        sessionId,
        requiresInput: backendRequiresInput,
      } = res.data;

      if (isPreview) {
        setPreviewDoc(preview || '');
        setOutput(preview ? 'Live preview ready' : 'Preview cleared');
        setExecStatus(success ? 'Accepted' : 'Error');
        return;
      }

      const nextOutput = typeof stdout === 'string' && stdout.trim().length > 0 ? stdout : (typeof executionOutput === 'string' && executionOutput.trim().length > 0 ? executionOutput : 'No output');
      const nextStderr = typeof stderr === 'string' ? stderr : '';
      const nextCompileError = typeof compileError === 'string' ? compileError : '';
      const nextRuntimeError = typeof runtimeError === 'string' ? runtimeError : '';

      setOutput(shouldPreserveOutput ? `${output}${nextOutput}` : nextOutput);
      setStderrOutput(nextStderr);
      setCompileErrorOutput(nextCompileError);
      setRuntimeErrorOutput(nextRuntimeError);
      setExecStatus(status || (success ? 'Accepted' : 'Error'));
      setRequiresInput(Boolean(backendRequiresInput || needsInput));
      setAwaitingInput(Boolean(needsInput));

      if (sessionId) {
        setExecutionSessionId(sessionId);
      }

      if (needsInput) {
        setExecStatus('Awaiting Input');
      }
    } catch (err) {
      setPreviewDoc('');
      setOutput(err.response?.data?.error || err.message || 'Execution failed');
      setStderrOutput('');
      setCompileErrorOutput('');
      setRuntimeErrorOutput('');
      setExecStatus('Error');
    } finally { setExecLoading(false); }
  };

  const handleLeave = async () => {
    await leaveRoom(roomId).catch(() => {});
    navigate('/dashboard');
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteRoom(roomId);
      // server emits room-deleted to all sockets; navigate ourselves too
      navigate('/dashboard', { state: { deletedMessage: 'Room has been deleted' } });
    } catch (err) {
      console.error(err);
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  const getUserId = (currentUser) => currentUser?._id?.toString() || currentUser?.id?.toString() || '';
  const isOwner = room && user && room.owner?._id?.toString() === getUserId(user);

  const currentLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  const showToast = useCallback((message, duration = 2800) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    if (message) {
      toastTimerRef.current = window.setTimeout(() => setToast(''), duration);
    }
  }, []);

  const notifySavedFilesChanged = useCallback(() => {
    window.dispatchEvent(new CustomEvent('saved-files-updated'));
  }, []);

  const handleSaveFile = async () => {
    if (!fileName.trim()) {
      showToast('Please provide a file name');
      return;
    }

    setFileLoading(true);
    try {
      const content = language === 'html' ? htmlCode : language === 'css' ? cssCode : language === 'javascript' ? jsCode : code;
      const payload = { name: fileName.trim(), language, code: content };
      const res = await createFile(roomId, payload);
      const savedFile = res?.data;
      if (!savedFile?._id) {
        throw new Error('The server did not return a saved file record.');
      }
      setSavedFiles((prev) => [savedFile, ...prev]);
      setSelectedFileId(savedFile._id);
      setFileName('');
      setFilesOpen(false);
      if (editorRef.current) editorRef.current.focus();
      notifySavedFilesChanged();
      showToast('File saved successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save file');
    } finally { setFileLoading(false); }
  };

  const handleOpenFile = (file) => {
    setCode(file.code);
    setLanguage(file.language);
    if (file.language === 'html') {
      setHtmlCode(file.code);
    } else if (file.language === 'css') {
      setCssCode(file.code);
    } else if (file.language === 'javascript') {
      setJsCode(file.code);
    }
    setSelectedFileId(file._id);
    setFileName(file.name);
    setFilesOpen(false);
    showToast(`Opened ${file.name}`);
  };

  const handleUpdateFile = async (file) => {
    try {
      const updated = await updateFile(roomId, file._id, { name: file.name, language: file.language, code: file.code });
      setSavedFiles((prev) => prev.map((item) => item._id === file._id ? updated.data : item));
      notifySavedFilesChanged();
      showToast('File updated');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(roomId, fileId);
      setSavedFiles((prev) => prev.filter((file) => file._id !== fileId));
      if (selectedFileId === fileId) setSelectedFileId(null);
      notifySavedFilesChanged();
      showToast('File deleted');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to delete file');
    }
  };

  const startRename = (file) => {
    setEditingFileId(file._id);
    setRenameValue(file.name);
  };

  const submitRename = async (file) => {
    if (!renameValue.trim()) {
      showToast('File name cannot be empty');
      return;
    }

    try {
      const updated = await updateFile(roomId, file._id, { name: renameValue.trim(), language: file.language, code: file.code });
      setSavedFiles((prev) => prev.map((item) => item._id === file._id ? updated.data : item));
      setEditingFileId(null);
      setRenameValue('');
      notifySavedFilesChanged();
      showToast('File renamed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to rename file');
    }
  };

  const handleDownloadFile = (file) => {
    const extension = file.language === 'python' ? 'py' : file.language === 'java' ? 'java' : file.language === 'cpp' ? 'cpp' : file.language === 'c' ? 'c' : file.language === 'html' ? 'html' : file.language === 'css' ? 'css' : 'js';
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
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

  if (!room) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
        <span className="spinner spinner-indigo" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
        <span style={{ fontSize: '0.875rem' }}>Loading room…</span>
      </div>
    </div>
  );

  return (
    <>
    <div style={{ height: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      {toast && (
        <div style={{ position: 'fixed', top: '68px', left: '50%', transform: 'translateX(-50%)', zIndex: 320, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(129,140,248,0.35)', borderRadius: 'var(--r-lg)', padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: '0.85rem', color: 'var(--text-primary)', minWidth: '220px', textAlign: 'center', animation: 'toastIn 0.24s ease both' }}>
          {toast}
        </div>
      )}

      {/* Room toolbar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        {/* Room name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
          <span style={{ fontSize: '13px' }}>📁</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{room.name}</span>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />

        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '5px 10px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem', fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--indigo-500)'}
            onMouseLeave={e => { if (!langOpen) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <span style={{
              fontSize: '0.6875rem', fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: currentLang.color,
            }}>{currentLang.icon}</span>
            <span className="hide-mobile">{currentLang.label}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▾</span>
          </button>

          {langOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setLangOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 50, minWidth: '160px',
                overflow: 'hidden',
              }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.value}
                    onClick={() => handleLanguageChange(l.value)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 14px',
                      background: language === l.value ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: language === l.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem', fontWeight: language === l.value ? 600 : 400,
                      transition: 'background 0.12s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (language !== l.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (language !== l.value) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: l.color, minWidth: '24px' }}>
                      {l.icon}
                    </span>
                    {l.label}
                    {language === l.value && <span style={{ marginLeft: 'auto', color: 'var(--indigo-400)', fontSize: '12px' }}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Connection status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '5px 10px',
          fontSize: '0.75rem', color: 'var(--text-muted)',
        }}>
          <span className={`status-dot ${socketReady ? 'online' : 'offline'}`} />
          <span className="hide-mobile">
            {socketReady ? `${activeUsers.length} online` : 'Connecting…'}
          </span>
        </div>

        <button onClick={() => setFilesOpen((prev) => !prev)} className="btn-ghost" style={{ padding: '8px 12px' }}>📁 Files</button>
        <button onClick={handleSaveFile} disabled={fileLoading} className="btn-primary" style={{ padding: '8px 12px' }}>{fileLoading ? 'Saving…' : 'Save File'}</button>

        {/* Run button */}
        <button onClick={handleRun} disabled={execLoading} className="btn-run">
          {execLoading
            ? <><span className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} /> Running…</>
            : <><span style={{ fontSize: '11px' }}>▶</span> Run</>
          }
        </button>

        {/* Leave button */}
        <button onClick={handleLeave} className="btn-danger">
          Leave
        </button>

        {/* Delete button — owner only */}
        {isOwner && (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'rgba(248,81,73,0.1)',
              color: '#f85149',
              fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'inherit',
              borderRadius: 'var(--r-md)',
              border: '1px solid rgba(248,81,73,0.35)',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,81,73,0.2)'; e.currentTarget.style.borderColor = 'rgba(248,81,73,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,81,73,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,81,73,0.35)'; }}
          >
            🗑 Delete
          </button>
        )}
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '12px', gap: '12px' }}>

        {/* Editor */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filesOpen && (
            <div ref={filesPanelRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="input-base" placeholder="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                  <button onClick={handleSaveFile} disabled={fileLoading} className="btn-primary">{fileLoading ? 'Saving…' : 'Save'}</button>
                </div>
                <button onClick={() => setFilesOpen(false)} className="btn-ghost" style={{ padding: '8px 10px', marginLeft: '8px' }} aria-label="Close saved files panel">✕</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {savedFiles.map((file) => (
                  <div key={file._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 10px', background: 'var(--bg-elevated)', minWidth: '160px' }}>
                    {editingFileId === file._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input className="input-base" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => submitRename(file)}>Save</button>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => { setEditingFileId(null); setRenameValue(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{file.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{file.language}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleOpenFile(file)}>Open</button>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => startRename(file)}>Rename</button>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleDownloadFile(file)}>Download</button>
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleDeleteFile(file._id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <CodeEditor editorRef={editorRef} code={language === 'html' ? htmlCode : language === 'css' ? cssCode : language === 'javascript' ? jsCode : code} language={language} onChange={handleCodeChange} />

        </div>

        {/* Sidebar */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Tab switcher */}
          <div className="tab-bar">
            <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
              <span style={{ fontSize: '13px' }}>💬</span> Chat
            </button>
            <button className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>
              <span style={{ fontSize: '11px' }}>▶</span> Output
              {execStatus && !execLoading && (
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: execStatus === 'Accepted' ? 'var(--green)' : 'var(--red)',
                  flexShrink: 0,
                }} />
              )}
            </button>
          </div>

          {/* Panel */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'chat'
              ? <Chat socketRef={socketRef} roomId={roomId} currentUser={user?.username} />
              : <OutputPanel output={output} stderr={stderrOutput} compileError={compileErrorOutput} runtimeError={runtimeErrorOutput} status={execStatus} loading={execLoading} previewDoc={previewDoc} language={language} awaitingInput={awaitingInput} requiresInput={requiresInput} stdinValue={stdinInput} onStdinChange={(value) => setStdinInput(value)} onInputSubmit={(value) => handleRun(value)} />
            }
          </div>

          {/* Participants */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: '12px 14px',
            flexShrink: 0,
          }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Participants
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {activeUsers.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No one here yet</span>
              ) : activeUsers.map((u, i) => (
                <span key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.75rem', color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '99px',
                  padding: '3px 10px 3px 6px',
                }}>
                  <span className="status-dot online" />
                  {u.username}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {confirmDelete && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
        onClick={e => { if (e.target === e.currentTarget && !deleteLoading) setConfirmDelete(false); }}
      >
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: '28px',
            width: '100%', maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '48px', height: '48px',
            background: 'rgba(248,81,73,0.1)',
            border: '1px solid rgba(248,81,73,0.25)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', marginBottom: '18px',
          }}>🗑</div>

          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Delete Room?
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '6px' }}>
            You are about to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{room.name}</strong>.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            All participants will be disconnected and all chat history will be erased. This action cannot be undone.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleteLoading}
              className="btn-ghost"
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              style={{
                flex: 1, padding: '10px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                background: 'linear-gradient(135deg, #da3633, #b91c1c)',
                color: '#fff',
                fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
                borderRadius: 'var(--r-md)',
                border: '1px solid rgba(218,54,51,0.5)',
                cursor: deleteLoading ? 'not-allowed' : 'pointer',
                opacity: deleteLoading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {deleteLoading
                ? <><span className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} /> Deleting…</>
                : '🗑 Delete Room'
              }
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
