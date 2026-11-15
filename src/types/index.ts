// Production Public-Safe Contracts and Types (WP4 + Unified Upgrade)

export type SintaRank = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'NA' | 'unmatched' | 'ambiguous';

export type CurrentDoajStatus = 'currently_indexed' | 'not_found' | 'requires_review';

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
  currentDoajStatus?: 'all' | CurrentDoajStatus;
}

export interface CurrentDoajSummary {
  total_source_records: number;
  indonesia_source_records: number;
  unique_resolved_journals: number;
  sinta_matched_journals: number;
  doaj_only_journals: number;
  sinta_only_journals: number;
  total_two_set_universe: number;
  ambiguous_records: number;
  rank_coverage_counts: Record<string, number>;
  rank_coverage_percentages: Record<string, number>;
  rejected_journals_current_status: Record<string, number>;
  withdrawn_journals_current_status: Record<string, number>;
}

export interface DistributionStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p90: number;
  iqr: number;
}

export interface TimeToAcceptanceStats {
  rejection_to_acceptance_journal: DistributionStats;
  rejection_to_acceptance_episodes: DistributionStats;
  rejection_to_acceptance_bands: Record<string, number>;
  withdrawal_to_acceptance_journal: DistributionStats;
  withdrawal_to_acceptance_episodes: DistributionStats;
  withdrawal_to_acceptance_bands: Record<string, number>;
  rejection_recurrence_intervals: DistributionStats;
  rejection_recurrence_bands: Record<string, number>;
}

export interface SintaLifecycleMatrixCell {
  count: number;
  percentage: number;
}

export interface SintaLifecycleMatrixRow {
  total_sinta_journals: number;
  currently_indexed: SintaLifecycleMatrixCell;
  historical_rejected: SintaLifecycleMatrixCell;
  historical_accepted: SintaLifecycleMatrixCell;
  historical_withdrawn: SintaLifecycleMatrixCell;
  repeated_rejections: SintaLifecycleMatrixCell;
  verified_r_to_a: SintaLifecycleMatrixCell;
  verified_a_to_w: SintaLifecycleMatrixCell;
  verified_w_to_a: SintaLifecycleMatrixCell;
  verified_a_w_a: SintaLifecycleMatrixCell;
  withdrawn_and_currently_indexed: SintaLifecycleMatrixCell;
}

export interface AnnualAcceptedCohort {
  source_records: number;
  unique_journals: number;
  prior_rejected: number;
  prior_withdrawn: number;
  currently_indexed: number;
}

export interface FirstRejectionCohort {
  cohort_journals: number;
  with_later_accepted: number;
  currently_indexed: number;
  with_later_withdrawn: number;
  repeated_rejections: number;
  median_days_to_accepted: number | null;
}

export interface TopLifecyclePathway {
  pathway: string;
  count: number;
}

export interface LifecycleSummary {
  rejected_journals_total: number;
  accepted_journals_total: number;
  withdrawn_journals_total: number;
  current_indexed_journals_total: number;
  rejected_and_accepted_journals: number;
  rejected_and_withdrawn: number;
  rejected_and_currently_indexed: number;
  accepted_and_currently_indexed: number;
  accepted_and_withdrawn: number;
  withdrawn_and_currently_indexed: number;
  rejected_accepted_and_indexed: number;
  rejection_frequency_outcomes: Record<
    string,
    {
      total: number;
      currently_indexed: number;
      accepted_overlap: number;
      withdrawn_overlap: number;
      verified_r_to_a?: number;
    }
  >;
  // Advanced Analytics
  verified_r_to_a_journals?: number;
  verified_r_to_a_episodes?: number;
  rejections_before_acceptance_distribution?: Record<string, number>;
  verified_a_to_w_journals?: number;
  verified_w_to_a_journals?: number;
  verified_w_to_a_episodes?: number;
  verified_a_w_a_journals?: number;
  last_historical_event_crosstab?: Record<string, Record<string, number>>;
  top_lifecycle_pathways?: TopLifecyclePathway[];
  time_to_acceptance_stats?: TimeToAcceptanceStats;
  sinta_lifecycle_matrix?: Record<string, SintaLifecycleMatrixRow>;
  annual_accepted_cohorts?: Record<string, AnnualAcceptedCohort>;
  first_rejection_cohorts?: Record<string, FirstRejectionCohort>;
}

export interface SummaryPublic {
  schema_version: string;
  as_of: {
    doaj_export_utc: string;
    sinta_snapshot: string;
    doaj_current_snapshot?: string;
  };
  source_record_counts: {
    rejected: number;
    withdrawn: number;
    sinta: number;
    accepted?: number;
    doaj_current_total?: number;
    doaj_current_indonesia?: number;
  };
  identity_counts: {
    rejected_resolved_journals: number;
    withdrawn_resolved_journals: number;
    sinta_journals: number;
    accepted_resolved_journals?: number;
    current_doaj_unique_journals?: number;
    unresolved_doaj_source_records: number;
    unresolved_current_doaj_records?: number;
  };
  current_doaj_summary?: CurrentDoajSummary;
  lifecycle_summary?: LifecycleSummary;
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

export interface FactAcceptedRecord {
  source_record_id: string;
  source_dataset: 'accepted';
  journal_id: string | null;
  journal_title: string;
  journal_url?: string | null;
  p_issn_raw: string;
  p_issn_normalized: string | null;
  p_issn_quality: IssnQuality;
  e_issn_raw: string;
  e_issn_normalized: string | null;
  e_issn_quality: IssnQuality;
  added_on_raw?: string | null;
  added_day?: string | null;
  added_year?: number | null;
  last_updated_raw?: string | null;
  last_updated_day?: string | null;
  last_updated_year?: number | null;
  decision_date_verified: boolean;
  strict_match_status: 'matched' | 'unmatched';
  strict_match_method: string | null;
  extended_match_status: 'matched' | 'unmatched' | 'ambiguous';
  extended_match_method: string | null;
  extended_journal_id: string | null;
  extended_sinta_rank: SintaRank;
  identity_status: 'resolved' | 'unresolved';
  sinta_rank: SintaRank;
  current_doaj_status?: CurrentDoajStatus;
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
  current_doaj_status?: CurrentDoajStatus;
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
  current_doaj_status?: CurrentDoajStatus;
}

export interface FactDoajCurrentRecord {
  source_dataset: 'doaj_current';
  source_record_id: string;
  journal_id: string;
  identity_status: 'resolved' | 'unresolved';
  journal_title: string;
  journal_url?: string | null;
  doaj_profile_url?: string | null;
  p_issn_raw: string;
  e_issn_raw: string;
  p_issn_normalized: string | null;
  e_issn_normalized: string | null;
  p_issn_quality: IssnQuality;
  e_issn_quality: IssnQuality;
  publisher?: string | null;
  country_of_publisher?: string | null;
  subjects?: string[];
  added_on_raw?: string | null;
  last_updated_raw?: string | null;
  sinta_match_status: 'matched' | 'unmatched' | 'ambiguous';
  sinta_match_method: string | null;
  extended_match_status: 'matched' | 'unmatched' | 'ambiguous';
  extended_match_method: string | null;
  extended_journal_id: string | null;
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
  in_accepted?: boolean;
  in_withdrawn: boolean;
  in_sinta: boolean;
  in_current_doaj?: boolean;
  current_doaj_status?: CurrentDoajStatus;
  current_doaj_profile_url?: string | null;
  current_doaj_publisher?: string | null;
  lifecycle_pathway?: string;
  last_historical_event?: string;
  has_verified_r_to_a?: boolean;
  has_verified_a_to_w?: boolean;
  has_verified_w_to_a?: boolean;
  has_verified_a_w_a?: boolean;
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
  venn_regions?: Array<{
    region: string;
    R: boolean;
    W: boolean;
    S: boolean;
    count: number;
  }>;
  upset_aggregates: Array<{
    region: string;
    R: boolean;
    W: boolean;
    S: boolean;
    count: number;
    journal_ids: string[];
  }>;
  unresolved_journal_ids: string[];
  current_sinta_venn?: Array<{
    region: 'D' | 'S' | 'DS';
    in_doaj: boolean;
    in_sinta: boolean;
    count: number;
  }>;
}

export interface DataQualityPublic {
  schema_version: string;
  quality_counts: {
    placeholder_source_records: number;
    strict_ambiguous_records: number;
    extended_ambiguous_records: number;
    same_day_rejected_records: number;
    cross_medium_candidate_records: number;
    current_doaj_total_source_records?: number;
    current_doaj_indonesia_records?: number;
    current_doaj_non_indonesia_filtered?: number;
    current_doaj_ambiguous_records?: number;
    total_resolved_historical_journals?: number;
    journals_with_multiple_dated_events?: number;
    journals_with_fully_orderable_history?: number;
    journals_with_verified_transitions?: number;
    journals_with_snapshot_confirmation?: number;
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
