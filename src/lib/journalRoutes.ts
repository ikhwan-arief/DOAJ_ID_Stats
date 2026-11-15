/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 *
 * Deterministic ISSN resolution and canonical profile route mapping.
 */

import type {
  DimJournalRecord,
  SintaSnapshotRecord,
  FactDoajCurrentRecord,
  FactRejectedRecord,
  FactWithdrawnRecord,
  FactAcceptedRecord,
} from '../types/index.ts';

const ISSN_PATTERN = /^[0-9]{4}-[0-9]{3}[0-9Xx]$/;

/**
 * Validates 8-character hyphenated ISSN format and Modulus 11 checksum.
 */
export function isValidIssnChecksum(issn: string | null | undefined): boolean {
  if (!issn || typeof issn !== 'string') return false;
  const trimmed = issn.trim().toUpperCase();
  if (!ISSN_PATTERN.test(trimmed)) return false;

  const raw = trimmed.replace('-', '');
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const char = raw[i];
    const val = char === 'X' ? 10 : parseInt(char, 10);
    if (isNaN(val)) return false;
    sum += val * (8 - i);
  }
  return sum % 11 === 0;
}

export interface JournalIdentityIndex {
  // Map of unique checksum-valid ISSN -> single journal_id
  issnToUniqueJournal: Map<string, string>;
  // Map of ambiguous ISSN -> list of candidate journal_ids
  ambiguousIssns: Map<string, string[]>;
  // Map of journal_id -> canonical slug (unique e-issn, unique p-issn, or fallback "id:journal_id")
  journalToCanonicalSlug: Map<string, string>;
}

/**
 * Builds the deterministic bidirectional index from resolved public journal datasets.
 */
export function buildJournalIdentityIndex(
  journals: DimJournalRecord[],
  sintas: Map<string, SintaSnapshotRecord> | null,
  doajCurrent: FactDoajCurrentRecord[] | null,
  rejections: FactRejectedRecord[] | null,
  withdrawns: FactWithdrawnRecord[] | null,
  accepted: FactAcceptedRecord[] | null
): JournalIdentityIndex {
  const issnToJournals = new Map<string, Set<string>>();
  const journalEIssn = new Map<string, string>();
  const journalPIssn = new Map<string, string>();

  function recordIssn(journalId: string, issn: string | null | undefined, quality: string | null | undefined, isE: boolean) {
    if (!journalId || !issn || quality !== 'checksum_valid' || !isValidIssnChecksum(issn)) return;
    const norm = issn.trim().toUpperCase();
    if (!issnToJournals.has(norm)) {
      issnToJournals.set(norm, new Set<string>());
    }
    issnToJournals.get(norm)!.add(journalId);

    if (isE && !journalEIssn.has(journalId)) {
      journalEIssn.set(journalId, norm);
    } else if (!isE && !journalPIssn.has(journalId)) {
      journalPIssn.set(journalId, norm);
    }
  }

  // Harvest in order of authoritative metadata
  if (doajCurrent) {
    for (const r of doajCurrent) {
      recordIssn(r.journal_id, r.e_issn_normalized, r.e_issn_quality, true);
      recordIssn(r.journal_id, r.p_issn_normalized, r.p_issn_quality, false);
    }
  }

  if (sintas) {
    for (const [jid, s] of sintas.entries()) {
      recordIssn(jid, s.e_issn_normalized, s.e_issn_quality, true);
      recordIssn(jid, s.p_issn_normalized, s.p_issn_quality, false);
    }
  }

  if (rejections) {
    for (const r of rejections) {
      if (r.journal_id) {
        recordIssn(r.journal_id, r.e_issn_normalized, r.e_issn_quality, true);
        recordIssn(r.journal_id, r.p_issn_normalized, r.p_issn_quality, false);
      }
    }
  }

  if (withdrawns) {
    for (const w of withdrawns) {
      if (w.journal_id) {
        recordIssn(w.journal_id, w.e_issn_normalized, w.e_issn_quality, true);
        recordIssn(w.journal_id, w.p_issn_normalized, w.p_issn_quality, false);
      }
    }
  }

  if (accepted) {
    for (const a of accepted) {
      if (a.journal_id) {
        recordIssn(a.journal_id, a.e_issn_normalized, a.e_issn_quality, true);
        recordIssn(a.journal_id, a.p_issn_normalized, a.p_issn_quality, false);
      }
    }
  }

  const issnToUniqueJournal = new Map<string, string>();
  const ambiguousIssns = new Map<string, string[]>();

  for (const [issn, jids] of issnToJournals.entries()) {
    if (jids.size === 1) {
      issnToUniqueJournal.set(issn, Array.from(jids)[0]);
    } else {
      ambiguousIssns.set(issn, Array.from(jids));
    }
  }

  const journalToCanonicalSlug = new Map<string, string>();
  for (const j of journals) {
    const e = journalEIssn.get(j.journal_id);
    const p = journalPIssn.get(j.journal_id);

    // Rule 1: Use unique e-ISSN
    if (e && issnToUniqueJournal.has(e) && issnToUniqueJournal.get(e) === j.journal_id) {
      journalToCanonicalSlug.set(j.journal_id, e);
    }
    // Rule 2: Fallback to unique p-ISSN
    else if (p && issnToUniqueJournal.has(p) && issnToUniqueJournal.get(p) === j.journal_id) {
      journalToCanonicalSlug.set(j.journal_id, p);
    }
    // Rule 3: Public-safe fallback identifier
    else {
      // Use "id:" prefix to cleanly distinguish from ISSN format
      journalToCanonicalSlug.set(j.journal_id, `id:${j.journal_id}`);
    }
  }

  return {
    issnToUniqueJournal,
    ambiguousIssns,
    journalToCanonicalSlug,
  };
}

/**
 * Returns the canonical shareable hash path for a journal identity.
 */
export function getJournalProfileRoute(
  journalId: string,
  index?: JournalIdentityIndex | null
): string {
  if (index) {
    const slug = index.journalToCanonicalSlug.get(journalId);
    if (slug) {
      return `#/journal/${slug}`;
    }
  }
  return `#/journal/id:${journalId}`;
}
