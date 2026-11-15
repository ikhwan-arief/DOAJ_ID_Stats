"""Unit tests for strict SINTA URL parsing, candidate extraction, and multi-candidate safeguards.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import unittest
from observatory.engine import extract_sinta_candidates, parse_strict_sinta_profile


class SintaUrlParsingTests(unittest.TestCase):
    def test_valid_single_sinta_url(self):
        url = "https://sinta.kemdiktisaintek.go.id/journals/profile/4554"
        parsed = parse_strict_sinta_profile(url)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["profile_id"], "4554")
        self.assertEqual(parsed["url"], "https://sinta.kemdiktisaintek.go.id/journals/profile/4554")
        self.assertEqual(parsed["match_status"], "candidate")

    def test_two_pipe_separated_urls(self):
        raw = "https://sinta.kemdiktisaintek.go.id/journals/profile/4554 | https://sinta.kemdiktisaintek.go.id/journals/profile/11467"
        candidates = extract_sinta_candidates(raw)
        self.assertEqual(len(candidates), 2)
        self.assertEqual(candidates[0]["profile_id"], "4554")
        self.assertEqual(candidates[1]["profile_id"], "11467")

    def test_three_or_more_candidate_urls(self):
        raw = "https://sinta.kemdiktisaintek.go.id/journals/profile/9861 | https://sinta.kemdiktisaintek.go.id/journals/profile/103 | https://sinta.kemdiktisaintek.go.id/journals/profile/7362"
        candidates = extract_sinta_candidates(raw)
        self.assertEqual(len(candidates), 3)
        self.assertEqual([c["profile_id"] for c in candidates], ["9861", "103", "7362"])

    def test_duplicate_urls_are_deduplicated(self):
        raw = "https://sinta.kemdiktisaintek.go.id/journals/profile/4554 | https://sinta.kemdiktisaintek.go.id/journals/profile/4554"
        candidates = extract_sinta_candidates(raw)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0]["profile_id"], "4554")

    def test_urls_with_surrounding_whitespace_and_newlines(self):
        url = "   https://sinta.kemdiktisaintek.go.id/journals/profile/11467 \n "
        parsed = parse_strict_sinta_profile(url)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["profile_id"], "11467")

    def test_url_encoded_separators_rejected_by_strict_parser(self):
        malformed = "https://sinta.kemdiktisaintek.go.id/journals/profile/4554%20%7C%20https://sinta.kemdiktisaintek.go.id/journals/profile/11467"
        self.assertIsNone(parse_strict_sinta_profile(malformed))

    def test_invalid_numeric_profile_id(self):
        self.assertIsNone(parse_strict_sinta_profile("https://sinta.kemdiktisaintek.go.id/journals/profile/abc"))
        self.assertIsNone(parse_strict_sinta_profile("https://sinta.kemdiktisaintek.go.id/journals/profile/"))
        self.assertIsNone(parse_strict_sinta_profile("https://sinta.kemdiktisaintek.go.id/journals/profile/123/edit"))

    def test_non_sinta_hostnames(self):
        self.assertIsNone(parse_strict_sinta_profile("https://evil.com/journals/profile/4554"))
        self.assertIsNone(parse_strict_sinta_profile("https://doaj.org/journals/profile/4554"))

    def test_dangerous_protocols(self):
        self.assertIsNone(parse_strict_sinta_profile("javascript:alert(1)"))
        self.assertIsNone(parse_strict_sinta_profile("http://sinta.kemdiktisaintek.go.id/journals/profile/4554"))
        self.assertIsNone(parse_strict_sinta_profile("data:text/html,4554"))

    def test_reported_case_perspektif_hukum_4554_and_11467(self):
        raw = "Perspektif Hukum [https://sinta.kemdiktisaintek.go.id/journals/profile/4554] | Aplikasi Administrasi: Media Analisa Masalah Administrasi [https://sinta.kemdiktisaintek.go.id/journals/profile/11467]"
        candidates = extract_sinta_candidates(raw)
        self.assertEqual(len(candidates), 2)
        # Standalone links
        self.assertEqual(candidates[0]["profile_id"], "4554")
        self.assertEqual(candidates[0]["url"], "https://sinta.kemdiktisaintek.go.id/journals/profile/4554")
        self.assertEqual(candidates[1]["profile_id"], "11467")
        self.assertEqual(candidates[1]["url"], "https://sinta.kemdiktisaintek.go.id/journals/profile/11467")
        # Never concatenated
        self.assertNotIn("|", candidates[0]["url"])
        self.assertNotIn("|", candidates[1]["url"])


if __name__ == "__main__":
    unittest.main()
