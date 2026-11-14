// Production Public-Safe Contracts and Types (WP4)

export type SintaRank = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'NA' | 'unmatched' | 'ambiguous';

export type IssnQuality =
  | 'checksum_valid'
  | 'format_only'
  | 'placeholder'
  | 'invalid_format'
  | 'missing'
  | 'ambiguous';

export interface GlobalFilterState {
  searchQuery: string;
  sintaRank: string; // 'all' | SintaRank
  eventKind: string; // 'all' | 'rejected' | 'withdrawn'
  subject: string;   // 'all' | specific subject
  matchingMode: 'strict' | 'extended';
  yearRange: [number, number]; // [2022, 2026]
  metricView: 'records' | 'journals'; // Records vs Unique Reconciled Journals
}

export interface SummaryPublic {
  schema_version: string;
  as_of: {
    doaj_export_utc: string;
    sinta_snapshot: string;
  };
  source_record_counts: {
    rejected: number;
    withdrawn: number;
    sinta: number;
  };
  identity_counts: {
    rejected_resolved_journals: number;
    withdrawn_resolved_journals: number;
    sinta_journals: number;
    unresolved_doaj_source_records: number;
  };
  intersection_universe_count: number;
  strict_match_status_counts: {
    matched: number;
    unmatched: number;
  };
  extended_match_status_counts: {
    matched: number;
    unmatched: number;
    ambiguous: number;
  };
  repeat_record_journals: number;
  repeat_date_journals: number;
  repeat_year_journals: number;
  repeat_record_histogram: Record<string, number>;
  sinta_rank_source_record_counts: Record<string, number>;
  sinta_rank_unique_journal_counts: Record<string, number>;
  rejected_rank_source_record_counts: Record<string, number>;
  rejected_rank_unique_journal_counts: Record<string, number>;
  venn_regions: Array<{
    region: string;
    R: boolean;
    W: boolean;
    S: boolean;
    count: number;
  }>;
}

export interface FactRejectedRecord {
  source_record_id: string;
  source_dataset: 'rejected';
  journal_id: string | null;
  journal_title: string;
  journal_url?: string | null;
  p_issn_raw: string;
  p_issn_normalized: string | null;
  p_issn_quality: IssnQuality;
  e_issn_raw: string;
  e_issn_normalized: string | null;
  e_issn_quality: IssnQuality;
  event_at_raw: string | null;
  event_day: string | null;
  event_month: string | null;
  event_year: number | null;
  strict_match_status: 'matched' | 'unmatched';
  strict_match_method: string | null;
  extended_match_status: 'matched' | 'unmatched' | 'ambiguous';
  extended_match_method: string | null;
  extended_journal_id: string | null;
  extended_sinta_rank: SintaRank;
  identity_status: 'resolved' | 'unresolved';
  sinta_rank: SintaRank;
}

export interface FactWithdrawnRecord {
  source_record_id: string;
  source_dataset: 'withdrawn';
  journal_id: string | null;
  journal_title: string;
  journal_url?: string | null;
  doaj_profile_url?: string | null; // Validated /toc/... profile URL only
  p_issn_raw: string;
  p_issn_normalized: string | null;
  p_issn_quality: IssnQuality;
  e_issn_raw: string;
  e_issn_normalized: string | null;
  e_issn_quality: IssnQuality;
  date_applied_raw?: string | null;
  last_withdrawn_date_raw: string | null;
  last_withdrawn_day: string | null;
  last_withdrawn_year: number | null;
  last_reinstated_date_raw?: string | null;
  last_reinstated_day?: string | null;
  strict_match_status: 'matched' | 'unmatched';
  strict_match_method: string | null;
  extended_match_status: 'matched' | 'unmatched' | 'ambiguous';
  extended_match_method: string | null;
  extended_journal_id: string | null;
  extended_sinta_rank: SintaRank;
  identity_status: 'resolved' | 'unresolved';
  sinta_rank: SintaRank;
}

export interface RejectionHistoryRecord {
  journal_id: string;
  identity_status: 'resolved' | 'unresolved';
  source_record_count: number;
  distinct_event_day_count: number;
  distinct_event_year_count: number;
  event_days: string[];
  event_years: number[];
  consecutive_day_gaps: number[];
  source_record_ids: string[];
}

export interface DimJournalRecord {
  journal_id: string;
  display_title: string;
  sinta_rank: SintaRank;
  in_rejected: boolean;
  in_withdrawn: boolean;
  in_sinta: boolean;
}

export interface SintaSnapshotRecord {
  source_record_id: string;
  source_dataset: 'sinta';
  journal_id: string;
  journal_title: string;
  p_issn_raw: string;
  p_issn_normalized: string | null;
  p_issn_quality: IssnQuality;
  e_issn_raw: string;
  e_issn_normalized: string | null;
  e_issn_quality: IssnQuality;
  sinta_rank: SintaRank;
  accreditation_raw: string;
  subject_area: string | null;
  subject_area_inferred?: string | null;
  sinta_url: string;
  website_url?: string | null;
  editor_url?: string | null;
}

export interface IntersectionsPublic {
  upset_aggregates: Array<{
    region: string;
    R: boolean;
    W: boolean;
    S: boolean;
    count: number;
    journal_ids: string[];
  }>;
  unresolved_journal_ids: string[];
}

export interface DataQualityPublic {
  schema_version: string;
  quality_counts: {
    placeholder_source_records: number;
    strict_ambiguous_records: number;
    extended_ambiguous_records: number;
    same_day_rejected_records: number;
    cross_medium_candidate_records: number;
  };
  deterministic_review_samples: {
    placeholder_records: string[];
    same_day_rejected_records: string[];
    cross_medium_candidates: string[];
    strict_matches: string[];
  };
  limitations: string[];
  review_samples_are_source_ids_only: boolean;
}

// Synthetic Types (retained for backward-compatible test fixtures)
export interface SyntheticJournalRecord {
  journal_id: string;
  title: string;
  p_issn_raw: string;
  e_issn_raw: string;
  issn_quality: IssnQuality;
  publisher: string;
  country: string;
  sinta_rank: SintaRank;
  sinta_url?: string;
  editor_url?: string;
  doaj_profile_url?: string;
  public_journal_url?: string;
  total_rejections: number;
  total_withdrawals: number;
  rejection_dates: string[];
  last_withdrawn_date?: string;
  last_reinstated_date?: string;
  subjects: string[];
  subject_inferred?: string;
  match_method: 'strict_issn' | 'extended_issn' | 'unmatched';
}

export interface SyntheticRejectionRecord {
  source_record_id: string;
  journal_id: string;
  journal_title: string;
  p_issn_raw: string;
  e_issn_raw: string;
  date_rejected: string;
  event_year: number;
  publisher: string;
  country: string;
  sinta_rank: SintaRank;
  public_journal_url?: string;
}

export interface SyntheticWithdrawnRecord {
  source_record_id: string;
  journal_id: string;
  journal_title: string;
  p_issn_raw: string;
  e_issn_raw: string;
  last_withdrawn_date: string;
  last_reinstated_date?: string;
  date_applied?: string;
  publisher: string;
  sinta_rank: SintaRank;
  doaj_profile_url?: string;
  public_journal_url?: string;
}

export interface SyntheticSummaryKPIs {
  totalSourceRecords: {
    rejected: number;
    withdrawn: number;
    sinta: number;
  };
  syntheticReconciledJournals: number;
  repeatRejectionCount: number;
  sintaOverlapCount: number;
  asOfDates: {
    rejected: string;
    withdrawn: string;
    sintaSnapshot: string;
  };
}
