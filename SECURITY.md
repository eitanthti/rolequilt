# Security and privacy boundaries

This is an offline fictional demo. Browser scripts contain no network or execution adapter. The supplied server listens only on IPv4 loopback and serves an exact asset allowlist; it rejects write methods, private paths and symlinks. CSP disables connections, forms, frames and external assets. Do not expose it publicly without a separate hosting/security decision.

Configuration text renders as text, not executable HTML. Schema/contract checks reject unknown fields, prototype keys, invalid ownership and oversized structures. Browser histories and drafts are bounded. Browser-local data is unencrypted and accessible to other same-origin scripts; use a dedicated local origin and never enter secrets. Clearing site data removes it. The storage hash is a namespace, not cryptographic isolation.

No credential import, authentication, agent scheduling, tool permissions or spend enforcement exists. Status changes and fixed previews are illustrative. Publication secret scans are heuristic, not proof that arbitrary data is safe. Review every allowed file and all history manually before pushing; keep private configs outside this repository. No automated upload or publication occurs.
