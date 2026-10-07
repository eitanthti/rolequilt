# Local subscription runtimes

The optional bridge drives one of the user's existing official local runtimes, each authenticated by its own subscription login. Static demo mode remains disconnected. No API-key entry, separate API billing flow, token copying or silent paid fallback exists.

| Route | Runtime id | Status |
|---|---|---|
| Official local Codex / ChatGPT account | `openai` | Available through an explicitly approved private launcher; supported account, usage and model checks are required |
| Official local Claude Code / Claude subscription | `anthropic` | Available through an explicitly approved private launcher; subscription login, tool-free session and usage checks are required |
| Gemini local subscription | `google` | Unavailable; no verified bridge route |
| Grok local subscription | `xai` | Unavailable; no verified bridge route |

A private launcher connects one runtime per bridge process: pass the same id to `createRuntimeTransport({runtime})` and `new Engine({runtime})`. A role whose saved preference names a different runtime is blocked rather than silently routed to the connected one.

Pair and connect registers the selected validated team for chat and connects the existing runtime. Saving provider/model preferences alone does not connect. A nonblank model preference must resolve to the runtime's catalog; an unavailable model blocks that send rather than falling back. The runtime panel reports the actual runtime name, connection state and role model when available.

## Codex

ChatGPT account mode and explicit included-usage permission are mandatory. Unknown account/usage states are blocked. Models come from the account's `model/list` catalog.

## Claude Code

`claude auth status --json` must report a logged-in `claude.ai` first-party login with a subscription type; API-key, Bedrock/Vertex/other providers and logged-out states fail closed. Only those subscription facts are kept; email and organization fields are discarded. The child process receives HOME/USER/PATH/TMPDIR/LANG/LC_ALL only, so `ANTHROPIC_*` variables cannot switch it to API billing.

Each role thread is one long-lived `claude -p` stream-json process started with `--tools ""`, `--strict-mcp-config` with an empty server list, `--setting-sources ""`, `--safe-mode`, `--permission-prompts none`, `--disable-slash-commands` and `--no-chrome`, and no `--fallback-model`. The bridge disconnects if the runtime's init event reports any tool, MCP server, a non-`none` API-key source or a different session, and on any tool-use block, permission request or malformed frame. Ephemeral threads use `--no-session-persistence`; with a private thread store, durable threads use the CLI's own session store via `--session-id`/`--resume`.

The CLI has no usage preflight or model-list endpoint. Included usage is assumed only for a verified subscription login; a `rate_limit_event` reporting paid overage or a rejected limit disconnects and blocks further turns. The catalog is the CLI aliases `sonnet`, `opus` and `haiku`, which the runtime resolves to its current models; the resolved model appears in the runtime's init event. Turns request low effort.

Installed-runtime compatibility, account eligibility and limits may vary; no model availability is invented. See SECURITY.md and BRIDGE-PLAN.md for native policy and exposure limits. Imported roles do not authorize external actions or tools.
