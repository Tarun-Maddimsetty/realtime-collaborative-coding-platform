export function buildPreviewDocument({ code = '', language = 'html', htmlCode = '', cssCode = '', jsCode = '' }) {
  const html = (language === 'html' ? code : htmlCode || '').trim();
  const css = (language === 'css' ? code : cssCode || '').trim();
  const js = (language === 'javascript' ? code : jsCode || '').trim();

  let baseHtml = html;
  if (!baseHtml) {
    if (css || js) {
      baseHtml = `<div style="font-family:system-ui,-apple-system,sans-serif;padding:24px;">
        <h2 style="margin-top:0;color:#1e293b;">Live Preview</h2>
        <p style="color:#64748b;">HTML is empty. CSS and JavaScript are running.</p>
      </div>`;
    } else {
      baseHtml = `<div style="font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#94a3b8;">
        Write HTML, CSS, or JavaScript and click <strong>Run</strong> to see preview.
      </div>`;
    }
  }

  const styleTag = css ? `<style id="user-styles">\n${css}\n</style>` : '';

  // Forward preview console output and errors to parent window
  const consoleHook = `<script>
(function() {
  function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
    }
    return String(arg);
  }
  function send(level, args) {
    try {
      var text = Array.prototype.map.call(args, formatArg).join(' ');
      window.parent.postMessage({ source: 'codecollab-preview', level: level, text: text }, '*');
    } catch(e) {}
  }
  var _log = console.log, _error = console.error, _warn = console.warn, _info = console.info;
  console.log = function() { _log.apply(console, arguments); send('log', arguments); };
  console.info = function() { _info.apply(console, arguments); send('info', arguments); };
  console.warn = function() { _warn.apply(console, arguments); send('warn', arguments); };
  console.error = function() { _error.apply(console, arguments); send('error', arguments); };
  window.addEventListener('error', function(e) {
    send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
})();
<\/script>`;

  const scriptTag = js ? `<script>\ntry {\n${js}\n} catch (err) {\n  console.error(err.message || err);\n}\n<\/script>` : '';

  const hasHead = /<\/head>/i.test(baseHtml);
  const hasBodyOpen = /<body[\s>]/i.test(baseHtml);
  const hasBodyClose = /<\/body>/i.test(baseHtml);
  const hasHtmlTag = /<html[\s>]/i.test(baseHtml);

  let doc = baseHtml;

  if (hasHead) {
    doc = doc.replace(/<\/head>/i, `${styleTag}\n</head>`);
  } else if (hasBodyOpen) {
    doc = doc.replace(/<body[\s>]/i, (m) => `<head><meta charset="utf-8" />${styleTag}</head>\n${m}`);
  } else if (hasHtmlTag) {
    doc = doc.replace(/<html[\s>]/i, (m) => `${m}\n<head><meta charset="utf-8" />${styleTag}</head>`);
  }

  const combinedScripts = `${consoleHook}\n${scriptTag}`;

  if (hasBodyClose) {
    doc = doc.replace(/<\/body>/i, `${combinedScripts}\n</body>`);
  } else if (hasHtmlTag) {
    doc = doc.replace(/<\/html>/i, `${combinedScripts}\n</html>`);
  } else {
    doc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${styleTag}
</head>
<body>
  ${doc}
  ${combinedScripts}
</body>
</html>`;
  }

  return doc;
}
