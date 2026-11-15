import React from 'react';

export type RouteId =
  | 'overview'
  | 'rejected'
  | 'history'
  | 'withdrawn'
  | 'sinta'
  | 'explorer'
  | 'quality'
  | 'publishers';

interface HeaderProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onRouteChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: RouteId; label: string }[] = [
    { id: 'overview', label: '1. Overview' },
    { id: 'rejected', label: '2. Rejected Applications' },
    { id: 'history', label: '3. Rejection History' },
    { id: 'withdrawn', label: '4. Withdrawn Journals' },
    { id: 'sinta', label: '5. SINTA Analysis' },
    { id: 'explorer', label: '6. Journal Explorer' },
    { id: 'quality', label: '7. Data Quality' },
    { id: 'publishers', label: '8. Publisher Analysis' },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--warm-black)',
        color: 'var(--white)',
        borderBottom: '3px solid var(--sanguine)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'var(--space-3)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        {/* Brand Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--sanguine)',
                  borderRadius: '50%',
                }}
                aria-hidden="true"
              />
              <h1
                style={{
                  color: 'var(--white)',
                  fontSize: 'var(--text-xl)',
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                DOAJ × SINTA Journal Observatory
              </h1>
            </div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--salmon)',
                marginTop: '2px',
                letterSpacing: '0.02em',
              }}
            >
              Independent analytical observatory • English Edition • SINTA Snapshot 15 Nov 2026
            </p>
          </div>

          {/* Mobile toggle button */}
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={mobileMenuOpen}
            aria-controls="main-nav"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: '6px 12px',
              fontSize: 'var(--text-xs)',
            }}
            id="mobile-nav-toggle"
          >
            {mobileMenuOpen ? 'Close Menu' : 'Menu'}
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          id="main-nav"
          aria-label="Main Observatory Navigation"
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 'var(--space-2)',
          }}
          className={mobileMenuOpen ? 'nav-open' : ''}
        >
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onRouteChange(item.id);
                  setMobileMenuOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  background: isActive ? 'var(--sanguine)' : 'transparent',
                  color: 'var(--white)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-nav-toggle {
            display: inline-flex !important;
          }
          #main-nav {
            display: none !important;
            flex-direction: column !important;
          }
          #main-nav.nav-open {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
