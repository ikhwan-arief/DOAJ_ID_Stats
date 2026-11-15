import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--warm-black)',
        color: 'var(--white)',
        borderTop: '1px solid var(--neutral-border)',
        marginTop: 'auto',
        padding: 'var(--space-5) 0 var(--space-4) 0',
      }}
    >
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Identity & Independence Disclaimer */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-md)',
                color: 'var(--white)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Independent Analytical Project
            </h3>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--light-grey)',
                lineHeight: 1.6,
                maxWidth: '480px',
              }}
            >
              This observatory is an independent scholarly communications research instrument. It is{' '}
              <strong>not an official DOAJ service</strong> and carries no implied official endorsement,
              sponsorship, or certification from DOAJ or Kemdikbudristek. Color palette and design guidelines
              are derived from open DOAJ design tokens for aesthetic consistency.
            </p>
          </div>

          {/* Sources and Temporal Scope */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-md)',
                color: 'var(--white)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Data Provenance & Snapshot
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                fontSize: 'var(--text-xs)',
                color: 'var(--light-grey)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
              }}
            >
              <li>• DOAJ Historical Rejection Records (2022–2026)</li>
              <li>• DOAJ Historical Withdrawal Records (2022–2026)</li>
              <li>• DOAJ Current Indexed Journals (Snapshot: 15 November 2026)</li>
              <li>• SINTA National Accreditation Census (Snapshot: 15 November 2026)</li>
              <li>• Methodology: Deterministic ISSN matching using strict and extended protocols</li>
            </ul>
          </div>

          {/* Privacy & Ethical Standards */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-md)',
                color: 'var(--white)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Privacy & Ethical Standards
            </h3>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--light-grey)',
                lineHeight: 1.6,
              }}
            >
              No personal account names, owner identities, or internal DOAJ administrative links are exposed or
              processed. Rejection and withdrawal records represent historical application events; they do not imply
              journal misconduct or current SINTA accreditation status at the moment of historical review.
            </p>
          </div>
        </div>

        {/* Bottom copyright / citation note */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 'var(--space-3)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--neutral-border)',
          }}
        >
          <span>Developed by Ikhwan Arief (ikhwan[at]unand.ac.id) • Open Research Instrument</span>
          <span>DOAJ × SINTA Journal Observatory v1.0 • Built with React, TypeScript & Vite</span>
        </div>
      </div>
    </footer>
  );
};
