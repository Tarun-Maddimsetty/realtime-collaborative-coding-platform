import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function OutputPanel({ output, stderr = '', compileError = '', runtimeError = '', status, loading, previewDoc, language, awaitingInput = false, requiresInput = false, stdinValue = '', onStdinChange, onInputSubmit }) {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const inputBufferRef = useRef('');
  const isPreview = ['html', 'css', 'javascript', 'js', 'typescript', 'ts'].includes(language);
  const isSuccess = status === 'Accepted';

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
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

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
    };
  }, [onInputSubmit, awaitingInput]);

  useEffect(() => {
    const terminal = terminalInstanceRef.current;
    if (!terminal) return;

    terminal.reset();
    terminal.options.disableStdin = !awaitingInput;

    if (isPreview) {
      const srcDoc = previewDoc || '<!doctype html><html><body><div style="font-family:system-ui,sans-serif;padding:24px;">Preview</div></body></html>';
      terminal.write('Preview is running in the browser renderer.\r\n');
      terminal.write('This view updates as the page is refreshed.\r\n');
      terminal.write('Press Run again to regenerate the preview.\r\n');
      terminal.write('\r\n');
      terminal.write('Rendered output: ' + (srcDoc ? 'ready' : 'empty') + '\r\n');
      return;
    }

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
      terminal.write(requiresInput ? 'This program requires stdin input.\r\n' : 'Press Run to execute your code\r\n');
      return;
    }

    terminal.write(sections.join('\r\n\r\n') + '\r\n');

    if (awaitingInput) {
      terminal.write('> ');
      inputBufferRef.current = '';
      terminal.focus();
    }
  }, [output, stderr, compileError, runtimeError, loading, previewDoc, isPreview, awaitingInput, requiresInput]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', gap: '5px', marginRight: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f85149', display: 'block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d29922', display: 'block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3fb950', display: 'block' }} />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isPreview ? 'Live Preview' : 'Terminal'}</span>
        {status && !loading && (
          <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', fontWeight: 600, padding: '2px 9px', borderRadius: '99px', background: isSuccess ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)', color: isSuccess ? 'var(--green)' : 'var(--red)', border: `1px solid ${isSuccess ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}` }}>
            {isSuccess ? '✓ Success' : '✗ Error'}
          </span>
        )}
      </div>

      <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {requiresInput ? 'Input' : 'Input (disabled for this program)'}
        </label>
        <textarea
          value={stdinValue}
          onChange={(event) => typeof onStdinChange === 'function' && onStdinChange(event.target.value)}
          placeholder={requiresInput ? 'Enter stdin for your program…' : 'This program does not require user input.'}
          disabled={!requiresInput}
          rows={5}
          style={{ width: '100%', resize: 'vertical', borderRadius: '10px', border: '1px solid var(--border)', background: requiresInput ? 'var(--bg-surface)' : 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
        />
        {requiresInput && (
          <button
            onClick={() => typeof onInputSubmit === 'function' && onInputSubmit(stdinValue)}
            style={{ marginTop: '8px', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--indigo-500)', background: 'var(--indigo-500)', color: 'white', cursor: 'pointer' }}
          >
            Run with input
          </button>
        )}
      </div>

      <div ref={terminalRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: '#0d1117', padding: '8px 10px' }} />
    </div>
  );
}
