import React from 'react';

interface AlertProps {
  type?: 'note' | 'important' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children }) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'var(--sanguine-10)',
          border: 'var(--sanguine)',
          color: 'var(--sanguine)',
        };
      case 'important':
        return {
          bg: 'var(--grapefruit-10)',
          border: 'var(--grapefruit)',
          color: 'var(--warm-black)',
        };
      case 'note':
      default:
        return {
          bg: 'var(--light-grey)',
          border: 'var(--neutral-border)',
          color: 'var(--warm-black)',
        };
    }
  };

  const style = getStyles();

  return (
    <div
      role="region"
      aria-label={title || `${type} notification`}
      style={{
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {title && (
        <h4
          style={{
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            marginBottom: 'var(--space-1)',
            color: style.color,
          }}
        >
          {title}
        </h4>
      )}
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--warm-black)' }}>
        {children}
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  provenance?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  description,
  provenance,
  color = 'var(--warm-black)',
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--dark-grey)',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            color: color,
            lineHeight: 1.1,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: 'var(--space-1)' }}>
          {description}
        </p>
      )}
      {provenance && (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--neutral-border)',
            fontStyle: 'italic',
            marginTop: 'auto',
            paddingTop: 'var(--space-1)',
          }}
        >
          Source: {provenance}
        </span>
      )}
    </div>
  );
};

interface RankBadgeProps {
  rank: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
  const getRankBg = (r: string) => {
    switch (r.toUpperCase()) {
      case 'S1': return 'var(--color-s1)';
      case 'S2': return 'var(--color-s2)';
      case 'S3': return 'var(--color-s3)';
      case 'S4': return 'var(--color-s4)';
      case 'S5': return 'var(--color-s5)';
      case 'S6': return 'var(--color-s6)';
      case 'NA': return 'var(--color-na)';
      default: return 'var(--color-unmatched)';
    }
  };

  return (
    <span
      className="badge"
      style={{
        backgroundColor: getRankBg(rank),
        color: '#FFFFFF',
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      {rank}
    </span>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading observatory data...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5)',
        gap: 'var(--space-3)',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '4px solid var(--neutral-border)',
          borderTopColor: 'var(--sanguine)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: 'var(--dark-grey)', fontSize: 'var(--text-sm)' }}>{message}</p>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; message: string; onReset?: () => void }> = ({
  title,
  message,
  onReset,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        border: '1px dashed var(--neutral-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
        textAlign: 'center',
      }}
    >
      <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', marginBottom: 'var(--space-4)' }}>
        {message}
      </p>
      {onReset && (
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Reset Active Filters
        </button>
      )}
    </div>
  );
};
