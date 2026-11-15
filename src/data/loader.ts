// Typed loader service for versioned public exports

import {
  SummaryPublic,
  IntersectionsPublic,
  FactRejectedRecord,
  FactWithdrawnRecord,
  FactAcceptedRecord,
  FactDoajCurrentRecord,
  RejectionHistoryRecord,
  DimJournalRecord,
  SintaSnapshotRecord,
  DataQualityPublic,
} from '../types';

let cachedSummary: SummaryPublic | null = null;
let cachedIntersections: IntersectionsPublic | null = null;
let cachedRejected: FactRejectedRecord[] | null = null;
let cachedWithdrawn: FactWithdrawnRecord[] | null = null;
let cachedAccepted: FactAcceptedRecord[] | null = null;
let cachedDoajCurrent: FactDoajCurrentRecord[] | null = null;
let cachedHistory: RejectionHistoryRecord[] | null = null;
let cachedDimJournals: DimJournalRecord[] | null = null;
let cachedSinta: SintaSnapshotRecord[] | null = null;
let cachedQuality: DataQualityPublic | null = null;

const BASE_URL = import.meta.env.BASE_URL || './';

async function fetchPublicJson<T>(filename: string): Promise<T> {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const url = `${cleanBase}data/v1/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load observatory dataset ${filename}: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loadSummary(): Promise<SummaryPublic> {
  if (cachedSummary) return cachedSummary;
  cachedSummary = await fetchPublicJson<SummaryPublic>('summary_public.json');
  return cachedSummary;
}

export async function loadIntersections(): Promise<IntersectionsPublic> {
  if (cachedIntersections) return cachedIntersections;
  cachedIntersections = await fetchPublicJson<IntersectionsPublic>('intersections_public.json');
  return cachedIntersections;
}

export async function loadFactRejected(): Promise<FactRejectedRecord[]> {
  if (cachedRejected) return cachedRejected;
  cachedRejected = await fetchPublicJson<FactRejectedRecord[]>('fact_rejected_public.json');
  return cachedRejected;
}

export async function loadFactWithdrawn(): Promise<FactWithdrawnRecord[]> {
  if (cachedWithdrawn) return cachedWithdrawn;
  cachedWithdrawn = await fetchPublicJson<FactWithdrawnRecord[]>('fact_withdrawn_public.json');
  return cachedWithdrawn;
}

export async function loadFactAccepted(): Promise<FactAcceptedRecord[]> {
  if (cachedAccepted) return cachedAccepted;
  cachedAccepted = await fetchPublicJson<FactAcceptedRecord[]>('fact_accepted_public.json');
  return cachedAccepted;
}

export async function loadFactDoajCurrent(): Promise<FactDoajCurrentRecord[]> {
  if (cachedDoajCurrent) return cachedDoajCurrent;
  cachedDoajCurrent = await fetchPublicJson<FactDoajCurrentRecord[]>('fact_doaj_current_public.json');
  return cachedDoajCurrent;
}

export async function loadRejectionHistory(): Promise<RejectionHistoryRecord[]> {
  if (cachedHistory) return cachedHistory;
  cachedHistory = await fetchPublicJson<RejectionHistoryRecord[]>('rejection_history_public.json');
  return cachedHistory;
}

export async function loadDimJournals(): Promise<DimJournalRecord[]> {
  if (cachedDimJournals) return cachedDimJournals;
  cachedDimJournals = await fetchPublicJson<DimJournalRecord[]>('dim_journals_public.json');
  return cachedDimJournals;
}

export async function loadSintaSnapshot(): Promise<SintaSnapshotRecord[]> {
  if (cachedSinta) return cachedSinta;
  cachedSinta = await fetchPublicJson<SintaSnapshotRecord[]>('sinta_snapshot_public.json');
  return cachedSinta;
}

export async function loadDataQuality(): Promise<DataQualityPublic> {
  if (cachedQuality) return cachedQuality;
  cachedQuality = await fetchPublicJson<DataQualityPublic>('data_quality_public.json');
  return cachedQuality;
}
