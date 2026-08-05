const isHtmlLike = (value) => /<(html|body|head|style|script|div|p|h[1-6]|span|svg|img|a|button|section|article|main)[\s>]/i.test(value || '');

const wrapHtml = (content) => {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return `<!doctype html><html><head><meta charset="utf-8" /></head><body><div style="font-family:system-ui,sans-serif;padding:24px;">Preview</div></body></html>`;
  }

  if (trimmed.includes('<!doctype html>') || /<html[\s>]/i.test(trimmed) || /<body[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#fff;color:#111;} .preview-root{display:grid;gap:12px;}</style></head><body><div class="preview-root">${trimmed}</div></body></html>`;
};

export function buildPreviewDocument({ code = '', language = 'html', htmlCode = '', cssCode = '', jsCode = '' }) {
  const html = (language === 'html' ? code : htmlCode || '').trim();
  const css = (language === 'css' ? code : cssCode || '').trim();
  const js = (language === 'javascript' ? code : jsCode || '').trim();
  const baseHtml = html || '<div style="font-family:system-ui,sans-serif;padding:24px;">Preview</div>';

  if (!css && !js) {
    if (isHtmlLike(baseHtml)) {
      return baseHtml.includes('<!doctype html>') || /<html[\s>]/i.test(baseHtml) ? baseHtml : wrapHtml(baseHtml);
    }
    return wrapHtml(baseHtml);
  }

  const styleTag = css ? `<style>${css}</style>` : '';
  const scriptTag = js ? `<script>${js}</script>` : '';

  if (baseHtml.includes('<!doctype html>') || /<html[\s>]/i.test(baseHtml)) {
    return baseHtml.replace(/<\/head>/i, `${styleTag}</head>`).replace(/<\/body>/i, `${scriptTag}</body>`);
  }

  return `<!doctype html><html><head><meta charset="utf-8" />${styleTag}</head><body>${baseHtml}${scriptTag}</body></html>`;
}
