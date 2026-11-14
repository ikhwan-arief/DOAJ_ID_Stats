import React from 'react';
import { GlobalFilterState } from '../../types';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  onChange: (nextFilters: GlobalFilterState) => void;
  onReset: () => void;
  totalMatchingRecords?: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalMatchingRecords,
}) => {
  return (
    <section
      aria-label="Global Observatory Filter Engine"
      style={{
        backgroundColor: 'var(--white)',
        borderBottom: '1px solid var(--neutral-border)',
        padding: 'var(--space-3) 0',
        marginBottom: 'var(--space-4)',
      }}
    >
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="filter-search-input"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-grey)' }}
            >
              Search Journal Title, ISSN, or Publisher
            </label>
            <input
              id="filter-search-input"
              type="search"
              placeholder="e.g. Science, 2502-1234, Nusantara..."
              value={filters.searchQuery}
              onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          {/* SINTA Rank Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
            <label
              htmlFor="filter-sinta-select"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-grey)' }}
            >
              SINTA Rank
            </label>
            <select
              id="filter-sinta-select"
              value={filters.sintaRank}
              onChange={(e) => onChange({ ...filters, sintaRank: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="S1">SINTA 1</option>
              <option value="S2">SINTA 2</option>
              <option value="S3">SINTA 3</option>
              <option value="S4">SINTA 4</option>
              <option value="S5">SINTA 5</option>
              <option value="S6">SINTA 6</option>
              <option value="NA">NA (Unaccredited)</option>
              <option value="unmatched">Unmatched to SINTA</option>
            </select>
          </div>

          {/* Event Kind Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
            <label
              htmlFor="filter-event-select"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-grey)' }}
            >
              Event Kind
            </label>
            <select
              id="filter-event-select"
              value={filters.eventKind}
              onChange={(e) => onChange({ ...filters, eventKind: e.target.value })}
            >
              <option value="all">All Events</option>
              <option value="rejected">Rejection Records</option>
              <option value="withdrawn">Withdrawn Records</option>
            </select>
          </div>

          {/* Matching Mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
            <label
              htmlFor="filter-match-select"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-grey)' }}
            >
              Matching Protocol
            </label>
            <select
              id="filter-match-select"
              value={filters.matchingMode}
              onChange={(e) =>
                onChange({ ...filters, matchingMode: e.target.value as 'strict' | 'extended' })
              }
            >
              <option value="strict">Strict (e-to-e / p-to-p)</option>
              <option value="extended">Extended (Cross-medium)</option>
            </select>
          </div>

          {/* Metric View Toggle: Records vs Journals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-grey)' }}>
              Metric Grain
            </span>
            <div
              role="radiogroup"
              aria-label="Metric Grain Toggle"
              style={{
                display: 'inline-flex',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--neutral-border)',
                height: '44px',
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={filters.metricView === 'records'}
                onClick={() => onChange({ ...filters, metricView: 'records' })}
                style={{
                  padding: '0 var(--space-3)',
                  border: 'none',
                  backgroundColor:
                    filters.metricView === 'records' ? 'var(--warm-black)' : 'var(--white)',
                  color: filters.metricView === 'records' ? 'var(--white)' : 'var(--warm-black)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Source Records
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={filters.metricView === 'journals'}
                onClick={() => onChange({ ...filters, metricView: 'journals' })}
                style={{
                  padding: '0 var(--space-3)',
                  border: 'none',
                  borderLeft: '1px solid var(--neutral-border)',
                  backgroundColor:
                    filters.metricView === 'journals' ? 'var(--warm-black)' : 'var(--white)',
                  color: filters.metricView === 'journals' ? 'var(--white)' : 'var(--warm-black)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Unique Journals
              </button>
            </div>
          </div>

          {/* Reset Action */}
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onReset}
              title="Reset all filters to default"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Status info bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            color: 'var(--dark-grey)',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--light-grey)',
          }}
        >
          <span>
            {totalMatchingRecords !== undefined ? (
              <strong>{totalMatchingRecords.toLocaleString()} items matching criteria</strong>
            ) : (
              'All filters synchronize across all seven views'
            )}
          </span>
          <span style={{ fontStyle: 'italic' }}>
            Scope: DOAJ 2022–2026 (Nov 14 UTC) × SINTA Snapshot 15 Nov 2026
          </span>
        </div>
      </div>
    </section>
  );
};
