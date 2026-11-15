import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { RouteId } from './components/layout/Header';
import { GlobalFilterState } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Page components
import { OverviewPage } from './pages/OverviewPage';
import { RejectedApplicationsPage } from './pages/RejectedApplicationsPage';
import { RejectionHistoryPage } from './pages/RejectionHistoryPage';
import { WithdrawnJournalsPage } from './pages/WithdrawnJournalsPage';
import { SintaAnalysisPage } from './pages/SintaAnalysisPage';
import { JournalExplorerPage } from './pages/JournalExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';

const INITIAL_FILTERS: GlobalFilterState = {
  searchQuery: '',
  sintaRank: 'all',
  eventKind: 'all',
  subject: 'all',
  matchingMode: 'strict',
  yearRange: [2022, 2026],
  metricView: 'records',
};

export const App: React.FC = () => {
  // Hash-based routing for clean GitHub Pages direct link & refresh support
  const getRouteFromHash = (): RouteId => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validRoutes: RouteId[] = [
      'overview',
      'rejected',
      'history',
      'withdrawn',
      'sinta',
      'explorer',
      'quality',
    ];
    if (validRoutes.includes(hash as RouteId)) {
      return hash as RouteId;
    }
    return 'overview';
  };

  const [currentRoute, setCurrentRoute] = useState<RouteId>(getRouteFromHash);
  const [filters, setFilters] = useState<GlobalFilterState>(INITIAL_FILTERS);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);

  // Sync hash changes with state
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRouteChange = (route: RouteId) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJournal = (journalId: string | null) => {
    setSelectedJournalId(journalId);
    handleRouteChange('explorer');
  };

  const handleSelectRank = (rank: string) => {
    setFilters((prev) => ({ ...prev, sintaRank: rank }));
    handleRouteChange('rejected');
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'overview':
        return (
          <OverviewPage
            filters={filters}
            onNavigateToRoute={(r) => handleRouteChange(r)}
          />
        );
      case 'rejected':
        return (
          <RejectedApplicationsPage
            filters={filters}
            onSelectJournal={handleSelectJournal}
          />
        );
      case 'history':
        return (
          <RejectionHistoryPage
            filters={filters}
            onSelectJournal={handleSelectJournal}
          />
        );
      case 'withdrawn':
        return (
          <WithdrawnJournalsPage
            filters={filters}
            onSelectJournal={handleSelectJournal}
          />
        );
      case 'sinta':
        return (
          <SintaAnalysisPage
            filters={filters}
            onSelectRank={handleSelectRank}
          />
        );
      case 'explorer':
        return (
          <JournalExplorerPage
            filters={filters}
            selectedJournalId={selectedJournalId}
            onSelectJournal={setSelectedJournalId}
          />
        );
      case 'quality':
        return <DataQualityPage />;
      default:
        return (
          <OverviewPage
            filters={filters}
            onNavigateToRoute={(r) => handleRouteChange(r)}
          />
        );
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Observatory Shell Error">
      <Layout
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
      >
        <ErrorBoundary fallbackTitle={`Observatory View Error (${currentRoute})`}>
          {renderActiveRoute()}
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
};
