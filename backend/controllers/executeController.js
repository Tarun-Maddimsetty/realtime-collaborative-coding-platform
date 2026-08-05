const { spawn, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');

const TIMEOUT_MS   = 10_000;
const MAX_CODE_LEN = 50_000;
const IS_WIN       = process.platform === 'win32';

// ─── Supported languages whitelist ───────────────────────────────────────────
// This is the single source of truth for what languages are accepted.
// req.body.language is looked up here before any other processing — raw user
// input never reaches a shell command or file-system path.
const SUPPORTED_LANGUAGES = new Set(['javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'php', 'ruby', 'rust', 'typescript', 'json', 'html', 'css']);
const WEB_PREVIEW_LANGS = new Set(['html', 'css', 'javascript']);
const EXECUTION_SESSIONS = new Map();

const buildPreviewDocument = ({ htmlCode = '', cssCode = '', jsCode = '', code = '', language = 'html' }) => {
  const html = (language === 'html' ? code : htmlCode || '').trim();
  const css = (language === 'css' ? code : cssCode || '').trim();
  const js = (language === 'javascript' ? code : jsCode || '').trim();
  const baseHtml = html || '<div style="font-family:system-ui,sans-serif;padding:24px;">Preview</div>';

  if (!css && !js) {
    if (baseHtml.includes('<!doctype html>') || /<html[\s>]/i.test(baseHtml) || /<body[\s>]/i.test(baseHtml)) {
      return baseHtml;
    }
    return `<!doctype html><html><body>${baseHtml}</body></html>`;
  }

  const styleTag = css ? `<style>${css}</style>` : '';
  const scriptTag = js ? `<script>${js}</script>` : '';

  if (baseHtml.includes('<!doctype html>') || /<html[\s>]/i.test(baseHtml)) {
    return baseHtml.replace(/<\/head>/i, `${styleTag}</head>`).replace(/<\/body>/i, `${scriptTag}</body>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8" />${styleTag}</head><body>${baseHtml}${scriptTag}</body></html>`;
};

// ─── Binary resolution ────────────────────────────────────────────────────────
// The Node.js server process inherits a restricted PATH that omits the JDK
// and MinGW bin directories. We resolve binaries by checking absolute paths
// with fs.existsSync — no child process is spawned just to probe existence,
// and no dependency on PATH is introduced.
//
// Candidates are tried in order; the first path whose file exists on disk wins.
// Bare names at the end of each list act as a cross-platform fallback for
// Linux/macOS where the tools are typically on PATH.
const BIN_CANDIDATES = {
  node: [
    'C:\\Program Files\\nodejs\\node.exe',
    'node',
  ],
  python: [
    'C:\\Users\\Dell-3420\\AppData\\Local\\Python\\bin\\python.exe',
    'C:\\Python313\\python.exe',
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'python3',
    'python',
  ],
  javac: [
    'C:\\Program Files\\Java\\jdk-21.0.12\\bin\\javac.exe',
    'C:\\Program Files\\Java\\latest\\bin\\javac.exe',
    'javac',
  ],
  java: [
    'C:\\Program Files\\Java\\jdk-21.0.12\\bin\\java.exe',
    'C:\\Program Files\\Java\\latest\\bin\\java.exe',
    'java',
  ],
  gcc: [
    'C:\\msys64\\ucrt64\\bin\\gcc.exe',
    'C:\\msys64\\mingw64\\bin\\gcc.exe',
    'C:\\TDM-GCC-64\\bin\\gcc.exe',
    'gcc',
  ],
  'g++': [
    'C:\\msys64\\ucrt64\\bin\\g++.exe',
    'C:\\msys64\\mingw64\\bin\\g++.exe',
    'C:\\TDM-GCC-64\\bin\\g++.exe',
    'g++',
  ],
  go: [
    'C:\\Program Files\\Go\\bin\\go.exe',
    'go',
  ],
};

/**
 * Resolve a logical binary name to the first candidate that exists on disk.
 *
 * - Absolute paths  → checked with fs.existsSync (no child process, no PATH).
 * - Bare names      → walked against every directory in process.env.PATH using
 *                     fs.existsSync, so still no child process is spawned.
 *
 * Returns the resolved path string, or null if nothing was found.
 */
const resolveBin = (name) => {
  const candidates = BIN_CANDIDATES[name] || [name];
  const pathDirs   = (process.env.PATH || process.env.Path || '')
    .split(path.delimiter)
    .filter(Boolean);
  const extraDirs = [];

  if (name === 'java' || name === 'javac') {
    if (process.env.JAVA_HOME) extraDirs.push(path.join(process.env.JAVA_HOME, 'bin'));
    if (IS_WIN) {
      extraDirs.push('C:\\Program Files\\Common Files\\Oracle\\Java\\javapath');
      extraDirs.push('C:\\Program Files\\Java\\jdk-21.0.12\\bin');
      extraDirs.push('C:\\Program Files\\Java\\latest\\bin');
    }
  }

  const dirsToCheck = [...new Set([...extraDirs, ...pathDirs])];

  for (const c of candidates) {
    if (path.isAbsolute(c)) {
      if (fs.existsSync(c)) return c;
    } else {
      const exts = IS_WIN ? (process.env.PATHEXT || '.EXE').split(';') : [''];
      for (const dir of dirsToCheck) {
        for (const ext of exts) {
          const full = path.join(dir, c + ext);
          if (fs.existsSync(full)) return full;
        }
      }
    }
  }
  return null;
};

// ─── Language definitions ─────────────────────────────────────────────────────
// All arguments are built as string arrays and passed directly to spawnSync —
// no shell is involved, so no shell-injection is possible regardless of what
// the source file path contains.
const LANGUAGES = {
  javascript: {
    ext:         '.js',
    compiled:    false,
    runBinKey:   'node',
    runArgs:     (src)          => [src],
  },
  python: {
    ext:         '.py',
    compiled:    false,
    runBinKey:   'python',
    runArgs:     (src)          => [src],
  },
  java: {
    ext:           '.java',
    compiled:      true,
    compileBinKey: 'javac',
    compileArgs:   (src, outDir) => ['-d', outDir, src],
    runBinKey:     'java',
    runArgs:       (_src, outDir) => ['-cp', outDir, 'Main'],
  },
  c: {
    ext:           '.c',
    compiled:      true,
    compileBinKey: 'gcc',
    compileArgs:   (src, out)    => [src, '-o', out],
    runBinKey:     null,          // compiled binary IS the executable
    runArgs:       ()            => [],
  },
  cpp: {
    ext:           '.cpp',
    compiled:      true,
    compileBinKey: 'g++',
    compileArgs:   (src, out)    => [src, '-o', out],
    runBinKey:     null,
    runArgs:       ()            => [],
  },
  go: {
    ext:           '.go',
    compiled:      true,
    compileBinKey: 'go',
    compileArgs:   (src, out) => ['build', '-o', out, src],
    runBinKey:     null,
    runArgs:       () => [],
  },
};

// ─── Path-traversal guard ─────────────────────────────────────────────────────
/**
 * Assert that `target` resolves to a path that is strictly inside `root`.
 * Throws if the resolved path escapes the root directory.
 * This prevents any path-traversal attack even if a UUID or filename somehow
 * contained `..` segments (which uuidv4 never produces, but we guard anyway).
 */
const assertInsideDir = (root, target) => {
  const resolvedRoot   = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep) &&
      resolvedTarget !== resolvedRoot) {
    throw new Error(`Path traversal detected: ${resolvedTarget} is outside ${resolvedRoot}`);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise Windows CRLF → LF and strip trailing whitespace. */
const normalise = (s) => (s || '').replace(/\r\n/g, '\n').trimEnd();

/**
 * Run a binary synchronously with a hard timeout.
 * Args are passed as an array — no shell is invoked, no injection possible.
 */
const runSync = (bin, args, opts = {}) => {
  const result = spawnSync(bin, args, {
    encoding:    'utf8',
    timeout:     TIMEOUT_MS,
    windowsHide: true,
    ...opts,
  });
  return {
    stdout:   normalise(result.stdout),
    stderr:   normalise(result.stderr || result.error?.message || ''),
    exitCode: result.status ?? 1,
    timedOut: result.signal === 'SIGTERM' || result.error?.code === 'ETIMEDOUT',
  };
};

/** Silently remove a directory tree. */
const cleanup = (dir) => {
  try {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch { /* ignore */ }
};

// ─── Controller ───────────────────────────────────────────────────────────────

const detectRequiresInput = (source, language) => {
  const normalized = (source || '').replace(/\r/g, '');
  const lang = (language || '').toLowerCase();

  if (lang === 'python') {
    return /\b(input|raw_input)\s*\(/m.test(normalized);
  }
  if (lang === 'java') {
    return /Scanner|System\.in|BufferedReader|readLine\(/m.test(normalized);
  }
  if (lang === 'c' || lang === 'cpp') {
    return /scanf\s*\(|cin\s*>>|std::cin|fgets\s*\(|gets\s*\(/m.test(normalized);
  }
  if (lang === 'javascript') {
    return /readline|prompt\(|process\.stdin|stdin/m.test(normalized);
  }
  if (lang === 'go') {
    return /fmt\.Scan|fmt\.Scanf|bufio\.NewReader|ReadString|Scanln/m.test(normalized);
  }
  return /input\s*\(|scanf\s*\(|cin\s*>>|System\.in|readline|prompt\(|fmt\.Scan|fmt\.Scanf|Scanner|ReadString|Scanln/m.test(normalized);
};

const getSession = (sessionId) => {
  if (!sessionId) return null;
  return EXECUTION_SESSIONS.get(sessionId) || null;
};

const attachSessionProcess = (session) => {
  if (!session.process) return;

  session.process.stdout.setEncoding('utf8');
  session.process.stderr.setEncoding('utf8');
  session.process.stdout.on('data', (chunk) => {
    session.outputBuffer += chunk;
    session.lastActivityAt = Date.now();
  });
  session.process.stderr.on('data', (chunk) => {
    session.outputBuffer += chunk;
    session.lastActivityAt = Date.now();
  });
  session.process.on('exit', (code) => {
    session.completed = true;
    session.exitCode = code ?? 0;
  });
  session.process.on('error', (error) => {
    session.completed = true;
    session.error = error.message;
  });
};

const waitForInteractiveOutput = (session) => new Promise((resolve) => {
  const startTime = Date.now();
  const initialLength = session.outputBuffer.length;

  const check = () => {
    if (session.completed) {
      const output = session.outputBuffer.slice(initialLength);
      resolve({ output, completed: true, exitCode: session.exitCode || 0 });
      return;
    }

    const currentLength = session.outputBuffer.length;
    const quiet = Date.now() - (session.lastActivityAt || startTime) > 220;
    if (currentLength !== initialLength && quiet) {
      const output = session.outputBuffer.slice(initialLength);
      resolve({ output, completed: false, exitCode: session.exitCode || 0 });
      return;
    }

    if (Date.now() - startTime > 1400) {
      const output = session.outputBuffer.slice(initialLength);
      resolve({ output, completed: false, exitCode: session.exitCode || 0 });
      return;
    }

    setTimeout(check, 60);
  };

  check();
});

const executeCode = async (req, res) => {
  const { code, language, htmlCode = '', cssCode = '', jsCode = '', input, stdin, sessionId } = req.body;
  const runtimeInput = typeof input === 'string' ? input : (typeof stdin === 'string' ? stdin : '');

  if (typeof code !== 'string' || !code.trim())
    return res.status(400).json({ success: false, language: null, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: 'code must be a non-empty string.' });

  if (typeof language !== 'string' || !language.trim())
    return res.status(400).json({ success: false, language: null, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: 'language is required.' });

  const lang = language.toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.has(lang))
    return res.status(400).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: `Unsupported language "${lang}". Supported: ${[...SUPPORTED_LANGUAGES].join(', ')}.` });

  if (code.length > MAX_CODE_LEN)
    return res.status(400).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: 'Code exceeds 50 KB limit.' });

  if (WEB_PREVIEW_LANGS.has(lang)) {
    const preview = buildPreviewDocument({ htmlCode, cssCode, jsCode, code, language: lang });
    return res.status(200).json({ success: true, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Accepted', preview, isPreview: true });
  }

  const config = LANGUAGES[lang];
  const requiresInput = detectRequiresInput(code, lang);
  const normalizedInput = (runtimeInput || '').replace(/\r/g, '');

  let session = getSession(sessionId);
  if (!sessionId) {
    session = { id: uuidv4(), inputHistory: '', outputBuffer: '', completed: false, exitCode: 0, tmpDir: null, process: null, error: '' };
    EXECUTION_SESSIONS.set(session.id, session);
  } else if (!session) {
    session = { id: sessionId, inputHistory: '', outputBuffer: '', completed: false, exitCode: 0, tmpDir: null, process: null, error: '' };
    EXECUTION_SESSIONS.set(sessionId, session);
  }

  if (typeof runtimeInput === 'string' && runtimeInput.length > 0) {
    const formattedInput = normalizedInput.endsWith('\n') ? normalizedInput : `${normalizedInput}\n`;
    session.inputHistory = `${session.inputHistory}${session.inputHistory ? '\n' : ''}${formattedInput}`.trimEnd();
  }

  const compileBin = config.compiled ? resolveBin(config.compileBinKey) : null;
  const runBinResolved = config.runBinKey ? resolveBin(config.runBinKey) : null;
  if (config.compiled && !compileBin) {
    return res.status(422).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: `Compiler "${config.compileBinKey}" was not found. Checked: ${(BIN_CANDIDATES[config.compileBinKey] || []).join(', ')}` });
  }
  if (config.runBinKey && !runBinResolved) {
    return res.status(422).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Error', error: `Runtime "${config.runBinKey}" was not found. Checked: ${(BIN_CANDIDATES[config.runBinKey] || []).join(', ')}` });
  }

  if (!session.process) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-exec-'));
    const srcName = lang === 'java' ? 'Main' : uuidv4();
    const srcFile = path.join(tmpDir, `${srcName}${config.ext}`);
    const exeExt = (lang === 'c' || lang === 'cpp') && IS_WIN ? '.exe' : '';
    const outPath = path.join(tmpDir, `${srcName}${exeExt}`);

    try {
      assertInsideDir(tmpDir, srcFile);
      assertInsideDir(tmpDir, outPath);
      fs.writeFileSync(srcFile, code, 'utf8');

      let compileOutput = '';
      if (config.compiled) {
        const compileArgs = lang === 'java'
          ? config.compileArgs(srcFile, tmpDir)
          : config.compileArgs(srcFile, outPath);
        const compile = runSync(compileBin, compileArgs, { input: '' });
        compileOutput = compile.stdout || compile.stderr || '';
        if (compile.exitCode !== 0 || compile.timedOut) {
          const compileError = compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout || 'Compilation failed.');
          return res.status(200).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: compileOutput, runtime_error: '', status: 'Compilation Error', error: compileError });
        }
      }

      const runBin = (lang === 'c' || lang === 'cpp') ? outPath : runBinResolved;
      const runArgs = lang === 'java'
        ? config.runArgs(srcFile, tmpDir)
        : config.runArgs(srcFile, outPath);

      const childProcess = spawn(runBin, runArgs, { cwd: tmpDir, windowsHide: true, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
      session.process = childProcess;
      session.tmpDir = tmpDir;
      attachSessionProcess(session);
      session.lastActivityAt = Date.now();
      if (typeof runtimeInput === 'string' && runtimeInput.length > 0) {
        session.process.stdin.write(`${normalizedInput}\n`);
      }
    } catch (error) {
      return res.status(200).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compile_output: '', runtime_error: '', status: 'Runtime Error', error: error.message || 'Execution failed' });
    }
  } else if (typeof runtimeInput === 'string' && runtimeInput.length > 0) {
    session.process.stdin.write(`${normalizedInput}\n`);
  }

  const outputInfo = await waitForInteractiveOutput(session);
  const deltaOutput = outputInfo.output || '';
  const completed = session.completed || outputInfo.completed || session.process.exitCode !== null;
  const needsInput = requiresInput && !completed && (deltaOutput.trim().length > 0 || !session.inputHistory);
  const success = completed && session.process.exitCode === 0;
  const status = needsInput ? 'Awaiting Input' : (success ? 'Accepted' : 'Error');

  if (completed) {
    cleanup(session.tmpDir);
    EXECUTION_SESSIONS.delete(session.id);
  }

  return res.status(200).json({
    success: success || needsInput,
    language: lang,
    output: deltaOutput,
    stdout: deltaOutput,
    stderr: '',
    compile_output: '',
    runtime_error: completed && !success ? session.error || 'Runtime error.' : '',
    status,
    needsInput,
    sessionId: session.id,
    error: completed && !success ? (session.error || 'Runtime error.') : '',
  });
};

module.exports = { executeCode };
