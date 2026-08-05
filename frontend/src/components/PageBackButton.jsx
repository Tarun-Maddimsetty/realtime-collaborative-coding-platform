import { useNavigate } from 'react-router-dom';

export default function PageBackButton({ label = 'Back', to = '/dashboard', style = {} }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(13,17,23,0.7)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        color: 'var(--text-primary)',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        ...style,
      }}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
