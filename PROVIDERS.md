# Local subscription runtimes

The optional bridge supports the user's existing official local Codex runtime, authenticated by its own ChatGPT login. Static demo mode remains disconnected. No API-key entry, separate API billing flow, token copying or silent paid fallback exists.

| Route | Status |
|---|---|
| Official local Codex / ChatGPT account | Available through an explicitly approved private launcher; supported account, usage and model checks are required |
| Claude Code | Unavailable; imported preferences are inert metadata |
| Gemini local subscription | Unavailable; no verified bridge route |
| Grok local subscription | Unavailable; no verified bridge route |

Pair and connect registers the selected validated team for chat and connects the existing runtime. Saving provider/model preferences alone does not connect. A nonblank model preference must resolve to the discovered catalog; an unavailable model blocks that send rather than falling back. The runtime panel reports actual connection state and verified role model when available.

ChatGPT account mode and explicit included-usage permission are mandatory. Unknown account/usage states are blocked. Installed-runtime compatibility, account eligibility and limits may vary; no model availability is invented. See SECURITY.md and BRIDGE-PLAN.md for native policy and exposure limits. Imported roles do not authorize external actions or tools.
