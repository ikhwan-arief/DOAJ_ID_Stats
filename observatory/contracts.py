"""Authoritative source and public-output allowlist contracts.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class SourceContract:
    dataset: str
    filename: str
    expected_rows: int
    expected_columns: int
    required_columns: frozenset[str]
    p_issn_column: str
    e_issn_column: str


DOAJ_COMMON_COLUMNS = frozenset(
    {
        "Journal title",
        "Journal URL",
        "URL in DOAJ",
        "Journal ISSN (print version)",
        "Journal EISSN (online version)",
        "Publisher",
        "Country of publisher",
        "Subjects",
    }
)

SINTA_COLUMNS = frozenset(
    {
        "Journal Name",
        "Sinta URL",
        "P-ISSN",
        "E-ISSN",
        "Subject Area",
        "Subject Area (Inferred)",
        "Affiliation",
        "Accreditation",
        "Scopus Indexed",
        "Garuda Indexed",
        "Impact",
        "H5-index",
        "Citations 5yr",
        "Citations",
        "Google Scholar URL",
        "Website URL",
        "Editor URL",
    }
)

SOURCE_CONTRACTS = (
    SourceContract(
        dataset="rejected",
        filename="ID_-_Rejected_2026-11-15T01_49_31Z.csv",
        expected_rows=9_308,
        expected_columns=53,
        required_columns=DOAJ_COMMON_COLUMNS | {"Date Rejected"},
        p_issn_column="Journal ISSN (print version)",
        e_issn_column="Journal EISSN (online version)",
    ),
    SourceContract(
        dataset="accepted",
        filename="ID_-_Accepted_2026-11-15T01_46_10Z.csv",
        expected_rows=1_421,
        expected_columns=53,
        required_columns=DOAJ_COMMON_COLUMNS | {"Added on Date", "Last updated Date"},
        p_issn_column="Journal ISSN (print version)",
        e_issn_column="Journal EISSN (online version)",
    ),
    SourceContract(
        dataset="withdrawn",
        filename="ID_-_Last_withdrawn_2026-11-15T03_59_04Z.csv",
        expected_rows=661,
        expected_columns=59,
        required_columns=DOAJ_COMMON_COLUMNS
        | {"Date Applied", "Last Withdrawn Date", "Last Reinstated Date"},
        p_issn_column="Journal ISSN (print version)",
        e_issn_column="Journal EISSN (online version)",
    ),
    SourceContract(
        dataset="sinta",
        filename="sinta_database_final_15112026.csv",
        expected_rows=16_620,
        expected_columns=17,
        required_columns=SINTA_COLUMNS,
        p_issn_column="P-ISSN",
        e_issn_column="E-ISSN",
    ),
    SourceContract(
        dataset="doaj_current",
        filename="doaj_journalcsv_20261115_0020_utf8.csv",
        expected_rows=23_733,
        expected_columns=52,
        required_columns=DOAJ_COMMON_COLUMNS | {"Added on Date", "Last updated Date"},
        p_issn_column="Journal ISSN (print version)",
        e_issn_column="Journal EISSN (online version)",
    ),
)

# Public records are constructed from these fields only. Input dictionaries are
# never copied wholesale and then redacted.
PUBLIC_FIELD_ALLOWLISTS: dict[str, frozenset[str]] = {
    "rejected": frozenset(
        {
            "source_dataset",
            "source_record_id",
            "journal_title",
            "journal_url",
            "p_issn_raw",
            "e_issn_raw",
            "p_issn_normalized",
            "e_issn_normalized",
            "p_issn_quality",
            "e_issn_quality",
            "publisher",
            "country_of_publisher",
            "subjects",
            "event_at_raw",
        }
    ),
    "accepted": frozenset(
        {
            "source_dataset",
            "source_record_id",
            "journal_title",
            "journal_url",
            "p_issn_raw",
            "e_issn_raw",
            "p_issn_normalized",
            "e_issn_normalized",
            "p_issn_quality",
            "e_issn_quality",
            "publisher",
            "country_of_publisher",
            "subjects",
            "added_on_raw",
            "last_updated_raw",
        }
    ),
    "withdrawn": frozenset(
        {
            "source_dataset",
            "source_record_id",
            "journal_title",
            "journal_url",
            "doaj_profile_url",
            "p_issn_raw",
            "e_issn_raw",
            "p_issn_normalized",
            "e_issn_normalized",
            "p_issn_quality",
            "e_issn_quality",
            "publisher",
            "country_of_publisher",
            "subjects",
            "date_applied_raw",
            "last_withdrawn_date_raw",
            "last_reinstated_date_raw",
        }
    ),
    "sinta": frozenset(
        {
            "source_dataset",
            "source_record_id",
            "journal_title",
            "sinta_url",
            "p_issn_raw",
            "e_issn_raw",
            "p_issn_normalized",
            "e_issn_normalized",
            "p_issn_quality",
            "e_issn_quality",
            "subject_area",
            "subject_area_inferred",
            "affiliation",
            "accreditation_raw",
            "scopus_indexed",
            "garuda_indexed",
            "impact",
            "h5_index",
            "citations_5yr",
            "citations",
            "google_scholar_url",
            "website_url",
            "editor_url",
        }
    ),
    "doaj_current": frozenset(
        {
            "source_dataset",
            "source_record_id",
            "journal_title",
            "journal_url",
            "doaj_profile_url",
            "p_issn_raw",
            "e_issn_raw",
            "p_issn_normalized",
            "e_issn_normalized",
            "p_issn_quality",
            "e_issn_quality",
            "publisher",
            "country_of_publisher",
            "subjects",
            "added_on_raw",
            "last_updated_raw",
        }
    ),
}
