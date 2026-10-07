# Security and privacy boundaries

## Static demo

The static server binds IPv4 loopback, exposes only its exact assets and rejects writes, private paths and symlinks. CSP disables network connections. Fixed previews and local task edits are illustrative; they do not execute work.

Configuration renders through DOM text, never executable HTML. Validation rejects unknown fields, dangerous keys, invalid ownership, unsafe paths and oversized structures. Selected Markdown/text is imported as data, never installed as executable skills. Secrets in free text cannot be reliably classified: do not import them.

Browser storage is unencrypted and accessible to same-origin scripts. Its hash is a namespace, not encryption or access control. Histories are bounded; clearing site data removes local data.

## Optional live origin

A separately approved private launcher can construct the loopback bridge. It serves the app on the same origin and permits protected local requests. Exact Host/Origin/Fetch Metadata checks and an in-memory process-session value protect mutations; no hardcoded secret, URL token or browser-persisted credential is used. Re-pair invalidates old authorization. This is not protection against malicious local processes or a compromised same-origin script. Do not expose the bridge remotely.

Official Codex and Claude Code manage their own logins. The app does not read/copy authentication caches or offer API-key entry. Codex account and usage endpoints must confirm ChatGPT mode and ordinary included usage. Claude Code must report a first-party claude.ai subscription login and API-key source `none`; reported overage or rejected limits disconnect. Other/unknown states fail closed. Only catalog models are selected. No paid/API fallback or credit purchasing is implemented.

Codex uses read-only/on-request/user policies and disables tool network access. Claude Code runs with built-in tools, MCP servers, settings sources, plugins/hooks and slash commands disabled and permission prompts auto-denied; any reported tool, MCP server or tool activity disconnects. This is runtime configuration, not OS isolation: the Claude process itself still reads its own login and configuration. Ordinary writes are restricted, but trusted operations can proceed without prompts and reads are not proven confined to cwd. Native authentication/configuration reads and model-service traffic are distinct from model-visible file/tool access. Global runtime configuration, inherited capabilities and OS permissions still matter. No zero-tools guarantee, TCC modification, Full Disk Access grant, sudo, global permission change or daemon installation is supplied.

One active turn is allowed. Runtime errors, unknown requests, missing approval details, timeout or disconnect fail closed. One-shot native approval choices do not create persistent policy grants. Imported teams register only validated chat context: it cannot grant authority. Their tool approval requests are denied; no trading, outreach or automation is activated. Prompts alone are not OS enforcement.

Private team configuration, executable/workspace paths, persisted threads and message records belong outside this tracked tree. Browser live history and private server persistence are separate stores. Role/thread/history identities are scoped by validated configuration. Review and explicitly approve concrete runtime access before enabling a private launcher.

## Publication

The exact allowlist and history scanner are defensive checks, not proof that arbitrary prose is public-safe. Manually review all allowlisted content and reachable history before any push. Exclude actual teams/agents, credentials, chat histories, screenshots, local state, personal launchers, machine paths and employment/identity context. Publication is never automatic.

Natural-language consultation routing runs only on an explicit user composer submission. A narrow direct-request grammar must resolve one unique name or ID in the selected team; missing, self, duplicate or multiple recipients require an explicit selection. Configured names are escaped literal matching data, never routing instructions. Imported prompts, history and model output are not routed. The existing same-team two-turn coordinator and tool-approval denials apply to both Send and the explicit consultation button. Routing introduces no new runtime or account permissions.
