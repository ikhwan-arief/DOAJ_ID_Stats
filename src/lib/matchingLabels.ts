/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 *
 * Centralized presentation utility for reader-friendly, accessible English matching
 * and lifecycle presentation labels.
 */

export type PrimaryEventType = 'Rejected' | 'Accepted' | 'Withdrawn';

/**
 * Maps technical matching method codes to clear English labels.
 */
export function formatMatchingMethod(method: string | null | undefined): string {
  if (!method) return 'No match evaluated';

  switch (method) {
    case 'e_to_e':
      return 'Matched by Online ISSN';
    case 'p_to_p':
    case 'p_to_p_fallback':
      return 'Matched by Print ISSN';
    case 'e_to_p':
      return 'Matched using Online to Print ISSN';
    case 'p_to_e':
      return 'Matched using Print to Online ISSN';
    case 'e_to_p+p_to_e':
      return 'Matched using Cross-Medium ISSNs';
    case 'no_usable_issn':
      return 'No usable or valid ISSN in source';
    default:
      // Graceful fallback for any unknown code
      return method.replace(/_/g, ' ');
  }
}

/**
 * Maps technical match status codes to plain-language status descriptions.
 */
export function formatMatchStatus(status: string | null | undefined): string {
  if (!status) return 'Not Evaluated';

  switch (status.toLowerCase()) {
    case 'matched':
      return 'Journal identity matched';
    case 'unmatched':
      return 'No matching journal found';
    case 'ambiguous':
      return 'Multiple possible matches';
    default:
      return status;
  }
}

/**
 * Maps matching mode codes to friendly descriptions.
 */
export function formatMatchingMode(mode: 'strict' | 'extended'): string {
  return mode === 'extended' ? 'Expanded ISSN matching' : 'Standard ISSN matching';
}

/**
 * Explanatory helper for SINTA accreditation matching vs DOAJ indexing.
 */
export function getMatchingExplanation(status: string | null | undefined, method?: string | null | undefined): string {
  if (status === 'matched') {
    return `Cross-referenced with national SINTA database via ${formatMatchingMethod(method)}.`;
  }
  if (status === 'ambiguous') {
    return 'Multiple candidate journals share these identifier attributes; manual editorial review required.';
  }
  return 'Not cross-referenced in the national SINTA census. Note: This reflects national accreditation cross-matching, not DOAJ indexing status or journal legitimacy.';
}

/**
 * Lifecycle Presentation Utilities
 * Formats current DOAJ indexing observations vs historical events.
 */

export function formatCurrentDoajStatusBadge(status: string | null | undefined): {
  label: string;
  badgeClass?: string;
  style?: React.CSSProperties;
} {
  if (status === 'currently_indexed') {
    return {
      label: 'Currently Indexed',
      badgeClass: 'badge-sinta',
      style: { backgroundColor: 'var(--dark-green)', color: 'var(--white)', fontWeight: 600 },
    };
  }
  if (status === 'requires_review') {
    return {
      label: 'Identity Requires Review',
      badgeClass: 'badge-neutral',
      style: { backgroundColor: 'var(--ochre)', color: 'var(--warm-black)', fontWeight: 600 },
    };
  }
  // Not found or undefined
  return {
    label: '—',
    badgeClass: 'badge-neutral',
    style: { color: 'var(--dark-grey)' },
  };
}
