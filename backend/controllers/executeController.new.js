const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const TIMEOUT_MS = 10_000;
const MAX_CODE_LEN = 50_000;
const IS_WIN = process.platform === 'win32';
const SUPPORTED_LANGUAGES = new Set(['javascript', 'js', 'python', 'py', 'java', 'c', 'cpp', 'cc', 'csharp', 'cs', 'go', 'php', 'ruby', 'rb', 'rust', 'rs', 'typescript', 'ts', 'json', 'html', 'css']);
const WEB_PREVIEW_LANGS = new Set(['html', 'css', 'javascript', 'js', 'typescript', 'ts']);
const EXECUTION_SESSIONS = new Map();

const buildPreviewDocument = ({ htmlCode = '', cssCode = '', jsCode = '', code = '', language = 'html' }) => {
  const html = (language === 'html' ? code : htmlCode || '').trim();
  const css = (language === 'css' ? code : cssCode || '').trim();
  const js = (language === 'javascript' || language === 'js' ? code : jsCode || '').trim();
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

const BIN_CANDIDATES = {
  node: ['C:\\Program Files\\nodejs\\node.exe', 'node'],
  python: ['C:\\Users\\Dell-3420\\AppData\\Local\\Python\\bin\\python.exe', 'python3', 'python'],
  javac: ['C:\\Program Files\\Java\\jdk-21.0.12\\bin\\javac.exe', 'javac'],
  java: ['C:\\Program Files\\Java\\jdk-21.0.12\\bin\\java.exe', 'java'],
  gcc: ['C:\\msys64\\ucrt64\\bin\\gcc.exe', 'gcc'],
  'g++': ['C:\\msys64\\ucrt64\\bin\\g++.exe', 'g++'],
  go: ['go'],
  php: ['php'],
  ruby: ['ruby'],
  rustc: ['rustc'],
  dotnet: ['dotnet'],
  tsc: ['tsc'],
};

const resolveBin = (name) => {
  const candidates = BIN_CANDIDATES[name] || [name];
  const pathDirs = (process.env.PATH || process.env.Path || '').split(path.delimiter).filter(Boolean);
  const extraDirs = [];
  if (name === 'java' || name === 'javac') {
    if (process.env.JAVA_HOME) extraDirs.push(path.join(process.env.JAVA_HOME, 'bin'));
    if (IS_WIN) {
      extraDirs.push('C:\\Program Files\\Common Files\\Oracle\\Java\\javapath');
      extraDirs.push('C:\\Program Files\\Java\\jdk-21.0.12\\bin');
    }
  }
  const dirsToCheck = [...new Set([...extraDirs, ...pathDirs])];
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    const exts = IS_WIN ? (process.env.PATHEXT || '.EXE').split(';') : [''];
    for (const dir of dirsToCheck) {
      for (const ext of exts) {
        const full = path.join(dir, candidate + ext);
        if (fs.existsSync(full)) return full;
      }
    }
  }
  return null;
};

const normalizeLanguage = (language) => {
  const lang = (language || '').toLowerCase().trim();
  if (lang === 'js' || lang === 'javascript') return 'javascript';
  if (lang === 'py' || lang === 'python') return 'python';
  if (lang === 'cpp' || lang === 'cc' || lang === 'c++') return 'cpp';
  if (lang === 'cs' || lang === 'csharp') return 'csharp';
  if (lang === 'ts' || lang === 'typescript') return 'typescript';
  if (lang === 'rb' || lang === 'ruby') return 'ruby';
  if (lang === 'rs' || lang === 'rust') return 'rust';
  return lang;
};

const LANGUAGES = {
  javascript: { ext: '.js', compiled: false, runBinKey: 'node', runArgs: (src) => [src] },
  python: { ext: '.py', compiled: false, runBinKey: 'python', runArgs: (src) => [src] },
  java: { ext: '.java', compiled: true, compileBinKey: 'javac', compileArgs: (src, outDir) => ['-d', outDir, src], runBinKey: 'java', runArgs: (_src, outDir) => ['-cp', outDir, 'Main'] },
  c: { ext: '.c', compiled: true, compileBinKey: 'gcc', compileArgs: (src, out) => [src, '-o', out], runBinKey: null, runArgs: () => [] },
  cpp: { ext: '.cpp', compiled: true, compileBinKey: 'g++', compileArgs: (src, out) => [src, '-o', out], runBinKey: null, runArgs: () => [] },
  go: { ext: '.go', compiled: true, compileBinKey: 'go', compileArgs: (src, out) => ['build', '-o', out, src], runBinKey: null, runArgs: () => [] },
  php: { ext: '.php', compiled: false, runBinKey: 'php', runArgs: (src) => [src] },
  ruby: { ext: '.rb', compiled: false, runBinKey: 'ruby', runArgs: (src) => [src] },
  rust: { ext: '.rs', compiled: true, compileBinKey: 'rustc', compileArgs: (src, out) => [src, '-o', out], runBinKey: null, runArgs: () => [] },
  csharp: { ext: '.cs', compiled: true, compileBinKey: 'dotnet', compileArgs: (src, outDir) => ['new', 'console', '--force', '-n', path.basename(outDir), '-o', outDir], runBinKey: 'dotnet', runArgs: (_src, outDir) => ['run', '--project', outDir, '--no-launch-profile'] },
  typescript: { ext: '.ts', compiled: true, compileBinKey: 'tsc', compileArgs: (src, out) => ['--target', 'ES2020', '--module', 'commonjs', '--outDir', path.dirname(out), '--pretty', 'false', src], runBinKey: 'node', runArgs: (src, out) => [out] },
  json: { ext: '.json', compiled: false, runBinKey: 'node', runArgs: (src) => [src] },
};

const assertInsideDir = (root, target) => {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep) && resolvedTarget !== resolvedRoot) {
    throw new Error(`Path traversal detected: ${resolvedTarget} is outside ${resolvedRoot}`);
  }
};

const normalise = (s) => (s || '').replace(/\r\n/g, '\n').trimEnd();
const formatBytes = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const runSync = (bin, args, opts = {}) => {
  const result = spawnSync(bin, args, { encoding: 'utf8', timeout: TIMEOUT_MS, windowsHide: true, ...opts });
  return {
    stdout: normalise(result.stdout),
    stderr: normalise(result.stderr || result.error?.message || ''),
    exitCode: result.status ?? 1,
    timedOut: result.signal === 'SIGTERM' || result.error?.code === 'ETIMEDOUT',
  };
};

const cleanup = (dir) => {
  try { if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch {}
};

const detectRequiresInput = (source, language) => {
  const normalized = (source || '').replace(/\r/g, '');
  const lang = normalizeLanguage(language);
  if (lang === 'python') return /\b(input|raw_input)\s*\(/m.test(normalized);
  if (lang === 'java') return /Scanner|System\.in|BufferedReader|readLine\(/m.test(normalized);
  if (lang === 'c' || lang === 'cpp') return /scanf\s*\(|cin\s*>>|std::cin|fgets\s*\(|gets\s*\(/m.test(normalized);
  if (lang === 'javascript' || lang === 'typescript') return /readline|prompt\(|process\.stdin|stdin/m.test(normalized);
  if (lang === 'go') return /fmt\.Scan|fmt\.Scanf|bufio\.NewReader|ReadString|Scanln/m.test(normalized);
  if (lang === 'csharp') return /Console\.ReadLine|Console\.Read\(|Console\.In/m.test(normalized);
  if (lang === 'php') return /readline\s*\(|fgets\s*\(/m.test(normalized);
  if (lang === 'ruby') return /gets\s*\(|STDIN|readline/m.test(normalized);
  if (lang === 'rust') return /std::io::stdin|read_line|read_to_string|read_until/m.test(normalized);
  return /input\s*\(|scanf\s*\(|cin\s*>>|System\.in|readline|prompt\(|fmt\.Scan|fmt\.Scanf|Scanner|ReadString|Scanln|Console\.ReadLine|gets\s*\(|readline\s*\(/m.test(normalized);
};

const executeCode = async (req, res) => {
  const { code, language, htmlCode = '', cssCode = '', jsCode = '', input, stdin, sessionId } = req.body;
  const runtimeInput = typeof input === 'string' ? input : (typeof stdin === 'string' ? stdin : '');
  const startedAt = Date.now();

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, language: null, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: 'code must be a non-empty string.' });
  }
  if (typeof language !== 'string' || !language.trim()) {
    return res.status(400).json({ success: false, language: null, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: 'language is required.' });
  }

  const lang = normalizeLanguage(language);
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    return res.status(400).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: `Unsupported language "${lang}". Supported: ${[...SUPPORTED_LANGUAGES].join(', ')}.` });
  }
  if (code.length > MAX_CODE_LEN) {
    return res.status(400).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: 'Code exceeds 50 KB limit.' });
  }

  if (WEB_PREVIEW_LANGS.has(lang)) {
    const preview = buildPreviewDocument({ htmlCode, cssCode, jsCode, code, language: lang });
    return res.status(200).json({ success: true, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Accepted', preview, isPreview: true, requiresInput: false });
  }

  const config = LANGUAGES[lang];
  if (!config) {
    return res.status(400).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: `Execution support for "${lang}" is not available yet.` });
  }

  const requiresInput = detectRequiresInput(code, lang);
  const normalizedInput = (runtimeInput || '').replace(/\r/g, '');
  const executionId = sessionId || uuidv4();
  const compileBin = config.compiled ? resolveBin(config.compileBinKey) : null;
  const runBinResolved = config.runBinKey ? resolveBin(config.runBinKey) : null;

  if (config.compiled && !compileBin) {
    return res.status(422).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: `Compiler "${config.compileBinKey}" was not found.` });
  }
  if (config.runBinKey && !runBinResolved) {
    return res.status(422).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: '', executionTime: '0 ms', memory: '0 B', status: 'Error', error: `Runtime "${config.runBinKey}" was not found.` });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-exec-'));
  const srcName = lang === 'java' ? 'Main' : `main-${uuidv4()}`;
  const srcFile = path.join(tmpDir, `${srcName}${config.ext}`);
  const outPath = path.join(tmpDir, `${srcName}${IS_WIN && (lang === 'c' || lang === 'cpp' || lang === 'rust') ? '.exe' : ''}`);

  try {
    assertInsideDir(tmpDir, srcFile);
    assertInsideDir(tmpDir, outPath);
    fs.writeFileSync(srcFile, code, 'utf8');

    if (config.compiled) {
      const compileArgs = lang === 'java' ? config.compileArgs(srcFile, tmpDir) : config.compileArgs(srcFile, outPath);
      const compile = runSync(compileBin, compileArgs, { input: '' });
      if (compile.exitCode !== 0 || compile.timedOut) {
        cleanup(tmpDir);
        const compileError = compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout || 'Compilation failed.');
        return res.status(200).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError, runtimeError: '', executionTime: `${Date.now() - startedAt} ms`, memory: formatBytes(process.memoryUsage().rss), status: 'Compilation Error', error: compileError });
      }
    }

    const runBin = (lang === 'c' || lang === 'cpp' || lang === 'rust') ? outPath : runBinResolved;
    const runArgs = lang === 'java' ? config.runArgs(srcFile, tmpDir) : config.runArgs(srcFile, outPath);
    return await new Promise((resolve) => {
      const child = spawn(runBin, runArgs, { cwd: tmpDir, windowsHide: true, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;
      const finish = (payload) => {
        if (settled) return;
        settled = true;
        cleanup(tmpDir);
        resolve(res.status(200).json(payload));
      };
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', (error) => finish({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: error.message || 'Execution failed.', executionTime: `${Date.now() - startedAt} ms`, memory: formatBytes(process.memoryUsage().rss), status: 'Runtime Error', error: error.message || 'Execution failed.', requiresInput }));
      child.on('exit', (code) => {
        const normalizedStdout = normalise(stdout);
        const normalizedStderr = normalise(stderr);
        const success = code === 0 && !timedOut;
        finish({ success, language: lang, output: normalizedStdout || normalizedStderr || '', stdout: normalizedStdout, stderr: normalizedStderr, compileError: '', runtimeError: timedOut ? 'Execution timed out.' : (code !== 0 ? (normalizedStderr || 'Execution failed.') : ''), executionTime: `${Date.now() - startedAt} ms`, memory: formatBytes(process.memoryUsage().rss), status: success ? 'Accepted' : 'Error', error: timedOut ? 'Execution timed out.' : (code !== 0 ? (normalizedStderr || 'Execution failed.') : ''), requiresInput, sessionId: executionId });
      });
      const timeout = setTimeout(() => { timedOut = true; try { child.kill(); } catch {} }, TIMEOUT_MS);
      child.on('exit', () => clearTimeout(timeout));
      if (typeof normalizedInput === 'string' && normalizedInput.length > 0) child.stdin.write(normalizedInput);
      child.stdin.end();
    });
  } catch (error) {
    cleanup(tmpDir);
    return res.status(200).json({ success: false, language: lang, output: '', stdout: '', stderr: '', compileError: '', runtimeError: error.message || 'Execution failed.', executionTime: `${Date.now() - startedAt} ms`, memory: formatBytes(process.memoryUsage().rss), status: 'Runtime Error', error: error.message || 'Execution failed.' });
  }
};

module.exports = { executeCode };