import React from 'react';
import { Header, RouteId } from './Header';
import { Footer } from './Footer';
import { GlobalFilterBar } from '../common/GlobalFilterBar';
import { GlobalFilterState } from '../../types';

interface LayoutProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  filters: GlobalFilterState;
  onFilterChange: (filters: GlobalFilterState) => void;
  onResetFilters: () => void;
  totalMatchingRecords?: number;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentRoute,
  onRouteChange,
  filters,
  onFilterChange,
  onResetFilters,
  totalMatchingRecords,
  children,
}) => {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header currentRoute={currentRoute} onRouteChange={onRouteChange} />
      <GlobalFilterBar
        filters={filters}
        onChange={onFilterChange}
        onReset={onResetFilters}
        totalMatchingRecords={totalMatchingRecords}
      />
      <main
        id="main-content"
        className="container"
        tabIndex={-1}
        style={{
          flex: '1 0 auto',
          paddingBottom: 'var(--space-5)',
          outline: 'none',
        }}
      >
        {children}
      </main>
      <Footer />
    </>
  );
};
