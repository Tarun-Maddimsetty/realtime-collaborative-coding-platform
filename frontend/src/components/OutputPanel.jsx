import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function OutputPanel({ output, stderr = '', compileError = '', runtimeError = '', status, loading, previewDoc, language, awaitingInput = false, requiresInput = false, stdinValue = '', onStdinChange, onInputSubmit }) {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const inputBufferRef = useRef('');
  const isWebLang = ['html', 'css', 'javascript', 'js', 'typescript', 'ts'].includes(language);
  const [viewMode, setViewMode] = useState(['html', 'css'].includes(language) ? 'preview' : 'terminal');
  const isSuccess = status === 'Accepted';

  useEffect(() => {
    if (['html', 'css'].includes(language)) {
      setViewMode('preview');
    } else if (language !== 'javascript') {
      setViewMode('terminal');
    }
  }, [language]);

  // Listen for console logs and errors sent from the preview iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.source === 'codecollab-preview') {
        const terminal = terminalInstanceRef.current;
        if (!terminal) return;
        const level = event.data.level || 'log';
        const text = event.data.text || '';
        const prefix = level === 'error' ? '\x1b[31m[error]\x1b[0m ' : (level === 'warn' ? '\x1b[33m[warn]\x1b[0m ' : '\x1b[36m[console]\x1b[0m ');
        terminal.write(`${prefix}${text}\r\n`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      disableStdin: !awaitingInput,
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#818cf8',
        selectionBackground: 'rgba(129, 140, 248, 0.35)',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 12,
      lineHeight: 1.4,
      scrollback: 20000,
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    try { fitAddon.fit(); } catch {}

    terminal.onKey(({ key, domEvent }) => {
      if (!awaitingInput) return;

      if (domEvent.key === 'Enter') {
        const value = inputBufferRef.current;
        inputBufferRef.current = '';
        terminal.write('\r\n');
        if (typeof onInputSubmit === 'function' && value.length > 0) {
          onInputSubmit(value);
        }
        return;
      }

      if (domEvent.key === 'Backspace') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          terminal.write('\b \b');
        }
        return;
      }

      if (domEvent.key === 'Escape') {
        inputBufferRef.current = '';
        terminal.write('\x1b[2K\r');
        return;
      }

      if (domEvent.key.length !== 1) return;

      inputBufferRef.current += key;
      terminal.write(key);
    });

    terminalInstanceRef.current = terminal;

    return () => {
      terminal.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, [onInputSubmit, awaitingInput]);

  useEffect(() => {
    if (viewMode === 'terminal' && fitAddonRef.current) {
      setTimeout(() => {
        try { fitAddonRef.current?.fit(); } catch {}
      }, 50);
    }
  }, [viewMode]);

  useEffect(() => {
    const terminal = terminalInstanceRef.current;
    if (!terminal) return;

    terminal.reset();
    terminal.options.disableStdin = !awaitingInput;

    if (loading) {
      terminal.write('Running code...\r\n');
      return;
    }

    const sections = [];
    if (output && output.trim()) sections.push(`stdout\n${output}`);
    if (stderr && stderr.trim()) sections.push(`stderr\n${stderr}`);
    if (compileError && compileError.trim()) sections.push(`compile errors\n${compileError}`);
    if (runtimeError && runtimeError.trim()) sections.push(`runtime errors\n${runtimeError}`);

    if (!sections.length) {
      if (['html', 'css'].includes(language)) {
        terminal.write('Live preview is running in the Preview tab.\r\nPress Run to refresh preview or view console logs here.\r\n');
      } else {
        terminal.write(requiresInput ? 'This program requires stdin input.\r\n' : 'Press Run to execute your code\r\n');
      }
      return;
    }

    terminal.write(sections.join('\r\n\r\n') + '\r\n');

    if (awaitingInput) {
      terminal.write('> ');
      inputBufferRef.current = '';
      terminal.focus();
    }
  }, [output, stderr, compileError, runtimeError, loading, awaitingInput, requiresInput, language]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
      {/* Header with Traffic Lights, View Toggles & Status */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', gap: '5px', marginRight: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f85149', display: 'block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d29922', display: 'block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3fb950', display: 'block' }} />
        </div>

        {/* View mode toggle pills for web languages */}
        {isWebLang ? (
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'preview' ? 'var(--indigo-500)' : 'transparent',
                color: viewMode === 'preview' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🌐 Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('terminal')}
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'terminal' ? 'var(--indigo-500)' : 'transparent',
                color: viewMode === 'terminal' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              💻 Terminal
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Terminal</span>
        )}

        {status && !loading && (
          <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', fontWeight: 600, padding: '2px 9px', borderRadius: '99px', background: isSuccess ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)', color: isSuccess ? 'var(--green)' : 'var(--red)', border: `1px solid ${isSuccess ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}` }}>
            {isSuccess ? '✓ Success' : '✗ Error'}
          </span>
        )}
      </div>

      {/* Stdin Input (Only shown in Terminal view when program requires input) */}
      {viewMode === 'terminal' && requiresInput && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Input
          </label>
          <textarea
            value={stdinValue}
            onChange={(event) => typeof onStdinChange === 'function' && onStdinChange(event.target.value)}
            placeholder="Enter stdin for your program…"
            rows={4}
            style={{ width: '100%', resize: 'vertical', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
          />
          <button
            onClick={() => typeof onInputSubmit === 'function' && onInputSubmit(stdinValue)}
            style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--indigo-500)', background: 'var(--indigo-500)', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Run with input
          </button>
        </div>
      )}

      {/* Live Preview Iframe */}
      <div style={{ flex: 1, minHeight: 0, display: viewMode === 'preview' ? 'flex' : 'none', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
        <iframe
          title="Code Preview"
          srcDoc={previewDoc || '<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;color:#64748b;">Write HTML, CSS, or JavaScript and click <strong>Run</strong> to see preview.</body></html>'}
          sandbox="allow-scripts allow-modals allow-same-origin"
          style={{ width: '100%', height: '100%', flex: 1, border: 'none' }}
        />
      </div>

      {/* Terminal View */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: viewMode === 'terminal' ? 'block' : 'none',
          overflow: 'hidden',
          background: '#0d1117',
          padding: '8px 10px',
        }}
      />
    </div>
  );
}
