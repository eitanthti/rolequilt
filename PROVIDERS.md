# Local subscription runtime choices

Design requirement: use the user's own local subscription-backed runtime, with no API-key onboarding, separate API billing recommendation or silent paid fallback. Rolequilt is still disconnected; no account/model check or bridge is implemented.

| Route | Current app status |
|---|---|
| Official local Codex signed in through its own ChatGPT login | First candidate; inert preference only; eligibility and specific access approval required |
| Official local Claude Code | Unavailable pending verified supported integration and consent; installation/desktop login is insufficient |
| Gemini local subscription | Unavailable; no verified route established for this app |
| Grok local subscription | Unavailable; another integration's OAuth support does not establish a Rolequilt route |

[Official Codex authentication guidance](https://developers.openai.com/codex/auth) describes vendor-managed login. [Claude login restrictions](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account) must be respected; do not borrow tokens or impersonate clients. These links are static guidance, not connection features. Account eligibility, subscription limits and model availability remain unverified by this UI.

Keep credentials in the official runtime's own protected authentication store. This app has no credential input and must never extract/copy login tokens. A future approved local bridge must refuse API fallback and unavailable providers, and distinguish plan usage from API billing. It must not promise zero file/tool access without an enforceable vendor/runtime boundary. See LOCAL-RUNTIME-DESIGN.md. No license selected.
