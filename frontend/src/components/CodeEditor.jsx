import Editor from '@monaco-editor/react';

const MONACO_LANG = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  php: 'php',
  ruby: 'ruby',
  rust: 'rust',
  typescript: 'typescript',
  json: 'json',
  html: 'html',
  css: 'css',
};

export default function CodeEditor({ code, language, onChange, readOnly = false, editorRef }) {
  const handleMount = (editor) => {
    if (editorRef) editorRef.current = editor;
  };

  return (
    <div style={{
      height: '100%', width: '100%',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: '#0d1117',
    }}>
      <Editor
        height="100%"
        language={MONACO_LANG[language] || 'javascript'}
        value={code}
        onChange={onChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          suggest: {
            showKeywords: true,
            showFunctions: true,
            showVariables: true,
            showClasses: true,
            showSnippets: true,
          },
          wordBasedSuggestions: 'currentDocument',
          suggestOnTriggerCharacters: true,
          tabCompletion: 'on',
          quickSuggestions: { other: true, comments: true, strings: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoClosingTags: 'always',
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderLineHighlightOnlyWhenFocus: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
