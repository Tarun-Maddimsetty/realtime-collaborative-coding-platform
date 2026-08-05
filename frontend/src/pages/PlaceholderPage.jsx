import Sidebar from '../components/Sidebar';

export default function PlaceholderPage({ title, subtitle, actionText }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 33%), var(--bg-base)' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '32px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: '40px 28px',
            maxWidth: 760,
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            Workspace
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, marginBottom: 18 }}>
            {subtitle}
          </p>

          {actionText && (
            <button className="btn-primary" style={{ width: 'fit-content' }}>
              {actionText}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
