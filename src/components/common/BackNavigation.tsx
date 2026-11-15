import React from 'react';

interface BackNavigationProps {
  onBack: () => void;
  targetLabel?: string;
  fallbackLabel?: string;
}

export const BackNavigation: React.FC<BackNavigationProps> = ({
  onBack,
  targetLabel,
  fallbackLabel = 'Back to Journal Search',
}) => {
  const label = targetLabel ? `Back to ${targetLabel}` : fallbackLabel;

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <button
        type="button"
        onClick={onBack}
        className="btn btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--warm-black)',
          backgroundColor: 'var(--white)',
          border: '1px solid var(--neutral-border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
        aria-label={label}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>←</span>
        <span>{label}</span>
      </button>
    </div>
  );
};
