// Type contracts for observatory UI (WP2 synthetic foundation)

export type SintaRank = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'NA' | 'unmatched';

export type IssnQuality =
  | 'checksum_valid'
  | 'format_only'
  | 'placeholder'
  | 'invalid_format'
  | 'missing'
  | 'ambiguous';

export type EventKind = 'rejected' | 'withdrawn';

export interface GlobalFilterState {
  searchQuery: string;
  sintaRank: string; // 'all' | SintaRank
  eventKind: string; // 'all' | 'rejected' | 'withdrawn'
  subject: string;   // 'all' | specific subject
  matchingMode: 'strict' | 'extended';
  yearRange: [number, number]; // [2022, 2026]
  metricView: 'records' | 'journals'; // Records vs Unique Reconciled Journals
}

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
  doaj_profile_url?: string; // /toc/... public profile only; never /admin/application/
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
  doaj_profile_url?: string; // Validated /toc/... only
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
