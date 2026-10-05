# Release verification

2026-10-05. Copied exactly twelve reviewed fictional source files into a fresh isolated release folder; no previous Git metadata or private files copied.

Base release: 14 tests passed. Local JSON import follow-up: 21 tests passed. Preparation prompt follow-up: 23 tests passed, 0 failed. Covers config validation/unsafe keys/size/ownership, local state isolation and limits, fixed-preview disclosure, corrupted-state recovery, publication allowlist/history/secret patterns, and HTTP asset allowlist/write rejection/CSP. The loopback test initially hit sandbox EPERM; authorized host retry passed all tests. No dependencies installed.

Source review: configuration and messages render through textContent; no browser network/execution adapter or HTML injection; example contains only fictional role/team data. CSP disables external connections. Local state is unencrypted, not a private-data vault. Source syntax and generated-demo consistency checked during final release verification.

Import checks cover malformed/oversize/deep/prototype/credential-field inputs, literal markup, preview/cancel/apply, 1–24 roles, 8 remembered configurations, team history isolation and registry recovery. UI wiring is source-checked; interactive browser import is not claimed tested.

Browser QA: attempted supported in-app browser; unavailable. Browser inventory was empty. Rendered layout, mobile behavior, keyboard interaction and browser persistence are not independently verified in this release. No screenshots claimed.

Publication: exact 24-file manifest; fresh isolated Git initialization; staged and reachable-history gate required before push. Gate results are reported separately by the coordinating task. No push performed: publication was rejected by automatic approval review, and retry is paused pending direct authorization reconciliation. No license chosen; source-visible pending owner decision. GitHub credential availability is checked separately and no token values are reported.

Preparation prompt includes a schema-valid minimal fictional example, exact single-JSON deliverable, authorized-source inventory and missing-input checklist, secret/history exclusions, and configuration/runtime distinction. Copy success and selectable manual fallback wiring source-checked. Browser clipboard behavior remains unverified without a browser.

Skill-file follow-up adds optional relative skills/supportingFiles, bounded folder selection, mapping/content previews, missing-file apply blocking, shared skills and inert role-detail text. Tests cover valid/shared/missing/empty/duplicate/traversal/encoded/URL/binary/executable/credential/HTML payloads, limits, legacy schema/registry migration, cancel/apply/reload and content-scoped history namespaces. Only fictional in-memory fixtures were used. Interactive folder picker remains source-checked rather than browser-tested; no browser is available in this execution context.

Full skill-bundle release suite: 32 passed, 0 failed. No actual private files imported. GitHub existence query was blocked by automatic approval review; no publication attempted.

Providers/model guide release: 37 tests passed, 0 failed. Optional role preferences validate and persist as inert local state; static official console/auth/billing/model references use safe external links. No keys, OAuth, account connections, model discovery or billed calls implemented. Full source/publication audit rerun after staging/commit. Browser UI and account/model availability remain unverified.
