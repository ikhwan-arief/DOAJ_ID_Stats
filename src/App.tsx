import React, { useState, useEffect, useRef } from 'react';
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
import { PublisherAnalysisPage } from './pages/PublisherAnalysisPage';
import { PublisherProfilePage } from './pages/PublisherProfilePage';

// Shared data loader for identity resolution
import { loadDimJournals, loadSintaSnapshot, loadFactDoajCurrent, loadFactRejected, loadFactWithdrawn, loadFactAccepted } from './data/loader';
import { buildJournalIdentityIndex, JournalIdentityIndex } from './lib/journalRoutes';

const INITIAL_FILTERS: GlobalFilterState = {
  searchQuery: '',
  sintaRank: 'all',
  eventKind: 'all',
  subject: 'all',
  matchingMode: 'strict',
  yearRange: [2022, 2026],
  metricView: 'records',
};

interface ParsedHash {
  route: RouteId;
  journalSlug: string | null;
  publisherId: string | null;
}

export const App: React.FC = () => {
  const [identityIndex, setIdentityIndex] = useState<JournalIdentityIndex | null>(null);

  // Load identity index for canonical profile routing
  useEffect(() => {
    Promise.all([
      loadDimJournals(),
      loadFactRejected(),
      loadFactWithdrawn(),
      loadFactAccepted(),
      loadFactDoajCurrent(),
      loadSintaSnapshot(),
    ])
      .then(([dim, rej, withdr, acc, curr, sintaList]) => {
        const sintaMap = new Map();
        sintaList.forEach((s) => sintaMap.set(s.journal_id, s));
        const idx = buildJournalIdentityIndex(dim, sintaMap, curr, rej, withdr, acc);
        setIdentityIndex(idx);
      })
      .catch((err) => console.error('Failed to build identity index:', err));
  }, []);

  // Parse hash into route and optional journal slug or publisher id
  const parseHash = (): ParsedHash => {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    if (!raw) return { route: 'overview', journalSlug: null, publisherId: null };

    // Support #/journal/{slug} or #/explorer/{slug}
    if (raw.startsWith('journal/')) {
      const slug = raw.slice('journal/'.length).trim();
      return { route: 'explorer', journalSlug: slug || null, publisherId: null };
    }
    if (raw.startsWith('explorer/')) {
      const slug = raw.slice('explorer/'.length).trim();
      return { route: 'explorer', journalSlug: slug || null, publisherId: null };
    }

    // Support #/publisher/{id}
    if (raw.startsWith('publisher/')) {
      const pubId = raw.slice('publisher/'.length).trim();
      return { route: 'publishers', journalSlug: null, publisherId: pubId ? decodeURIComponent(pubId) : null };
    }

    const validRoutes: RouteId[] = [
      'overview',
      'rejected',
      'history',
      'withdrawn',
      'sinta',
      'explorer',
      'quality',
      'publishers',
    ];

    if (validRoutes.includes(raw as RouteId)) {
      return { route: raw as RouteId, journalSlug: null, publisherId: null };
    }

    return { route: 'overview', journalSlug: null, publisherId: null };
  };

  const [currentParsed, setCurrentParsed] = useState<ParsedHash>(parseHash);
  const [filters, setFilters] = useState<GlobalFilterState>(INITIAL_FILTERS);

  // Navigation history tracker for reliable Back navigation
  const previousRouteRef = useRef<RouteId | null>(null);
  const previousRouteNameRef = useRef<string | null>(null);

  // Sync hash changes with state
  useEffect(() => {
    const handleHashChange = () => {
      const nextParsed = parseHash();
      setCurrentParsed((prev) => {
        if (prev.route !== nextParsed.route) {
          previousRouteRef.current = prev.route;
          const routeLabels: Record<RouteId, string> = {
            overview: 'Overview',
            rejected: 'Rejected Applications',
            history: 'Rejection History',
            withdrawn: 'Withdrawn Journals',
            sinta: 'SINTA Analysis',
            explorer: 'Journal Search',
            quality: 'Data Quality',
            publishers: 'Publisher Analysis',
          };
          previousRouteNameRef.current = routeLabels[prev.route] || 'Previous Page';
        }
        return nextParsed;
      });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRouteChange = (route: RouteId) => {
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToJournalSlug = (slug: string) => {
    window.location.hash = `#/journal/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToPublisher = (publisherId: string) => {
    window.location.hash = `#/publisher/${encodeURIComponent(publisherId)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJournalById = (journalId: string | null) => {
    if (!journalId) {
      handleRouteChange('explorer');
      return;
    }
    if (identityIndex) {
      const slug = identityIndex.journalToCanonicalSlug.get(journalId) || `id:${journalId}`;
      handleNavigateToJournalSlug(slug);
    } else {
      handleNavigateToJournalSlug(`id:${journalId}`);
    }
  };

  const handleBackNavigation = () => {
    if (previousRouteRef.current && previousRouteRef.current !== 'explorer') {
      handleRouteChange(previousRouteRef.current);
    } else {
      // Clear journal selection and go to clean search explorer
      handleRouteChange('explorer');
    }
  };

  const handleSelectRank = (rank: string) => {
    setFilters((prev) => ({ ...prev, sintaRank: rank }));
    handleRouteChange('rejected');
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const renderActiveRoute = () => {
    switch (currentParsed.route) {
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
            onSelectJournal={handleSelectJournalById}
          />
        );
      case 'history':
        return (
          <RejectionHistoryPage
            filters={filters}
            onSelectJournal={handleSelectJournalById}
          />
        );
      case 'withdrawn':
        return (
          <WithdrawnJournalsPage
            filters={filters}
            onSelectJournal={handleSelectJournalById}
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
            journalSlug={currentParsed.journalSlug}
            onNavigateToJournal={handleNavigateToJournalSlug}
            onNavigateToPublisher={handleNavigateToPublisher}
            onBack={handleBackNavigation}
            backTargetLabel={previousRouteNameRef.current || undefined}
          />
        );
      case 'quality':
        return <DataQualityPage />;
      case 'publishers':
        if (currentParsed.publisherId) {
          return (
            <PublisherProfilePage
              publisherId={currentParsed.publisherId}
              onNavigateToJournal={handleSelectJournalById}
              onBackToDirectory={() => handleRouteChange('publishers')}
              onBackToPrevious={previousRouteRef.current ? () => handleRouteChange(previousRouteRef.current!) : undefined}
              previousRouteLabel={previousRouteNameRef.current || undefined}
            />
          );
        }
        return (
          <PublisherAnalysisPage
            filters={filters}
            onSelectPublisher={handleNavigateToPublisher}
          />
        );
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
        currentRoute={currentParsed.route}
        onRouteChange={handleRouteChange}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
      >
        <ErrorBoundary fallbackTitle={`Observatory View Error (${currentParsed.route})`}>
          {renderActiveRoute()}
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
};
