# Rolequilt

Generic local infrastructure for configurable AI-team conversations and a shared task board. The bundled Sample Studio and its five roles are fictional. Private teams, credentials, conversations and machine-specific launch configuration belong outside this repository.

Requires Node.js 20 or newer. No npm dependencies or API keys are required.

## Static demo

```sh
npm test
npm start
```

Open the loopback URL printed by the server; ROLEQUILT_PORT selects another port. This route serves an exact asset allowlist with no bridge API and CSP `connect-src 'none'`. Messages, drafts and task-status edits stay in browser localStorage. Fixed preview replies are explicitly illustrative and can be disabled. They never analyze messages or run agents.

## Import a team

Choose **Import team JSON**, review the fields and apply explicitly. The preparation prompt helps an existing assistant inventory authorized files and missing answers. Importing does not connect an account or grant capabilities.

The contract is `config/team.schema.json`; `config/demo.example.json` is a fictional example. Teams contain 1–24 roles and up to 160 tasks. JSON is limited to 64 KiB. Optional `skills` and `supportingFiles` are portable relative paths to selected Markdown/text. Skills end in `SKILL.md`; supporting files use `.md` or `.txt`. A folder bundle has `team-config.json` at its root and all declared references present. Preview shows text and mappings before Apply; missing references block it. Limits: 64 files, 128 KiB per supporting file, 1 MiB total. No ZIP, executable import or URL fetch.

Up to eight configurations are remembered locally, bounded to 4 MiB including bundled text. Configurations and supporting-file contents have separate browser state namespaces. Cancel preserves the current team. Storage failure is reported as session-only. Browser storage is unencrypted; never import credentials or sensitive records. Clearing site data removes local browser state.

## Optional local live UI

`npm start` stays a demo. Live mode requires a separately reviewed private launcher using the exported modules:

- `bridge/process.cjs`: runtime process factories; `createRuntimeTransport({runtime})` selects official local Codex (`openai`) or Claude Code (`anthropic`).
- `bridge/claude.cjs`: tool-free Claude Code CLI adapter behind the same coordinator interface.
- `bridge/engine.cjs`: account/model checks, thread coordination and native approvals; its `runtime` option must match the process factory.
- `bridge/server.cjs`: protected loopback server; `app:true` serves the polished UI.

The private launcher supplies the existing official executable, user-selected workspace, reviewed team bundle and private history/thread persistence callbacks. Keep that launcher and its outputs outside Git. Review the native read/write/command scope before setting activation confirmation; imported instructions are never authorization. This package does not install Codex or Claude Code, log in, install a daemon, change macOS permissions or provide a hosted service.

Run an existing reviewed launcher in your own Terminal:

```sh
npm run start:live -- /absolute/path/to/private-launch.cjs
```

Keep Terminal open; closing it or pressing Ctrl+C stops the foreground service. The launcher prints exit status. Tool-managed background-session lifetime is not guaranteed.

On the live origin, choose **Pair and connect this team**. Pairing preserves a selected imported team and its unsent drafts, registers validated role context for chat only, and connects the existing local subscription runtime. A default private bundle is loaded only when the fictional demo is selected. The model picker is populated from the account's catalog. Type and Send when the runtime is ready. An optional saved per-role model must match that catalog; unavailable choices never silently fall back. Saving a preference does not connect or change an active turn.

Replies stream to the initiating role. Threads and persisted records are scoped to the validated team configuration. A private thread store can resume durable threads; without one, threads are ephemeral. History persistence is supplied by the private launcher. Browser reload or expired sessions expose the Pair recovery action and retain local drafts/history. Pairing a new session invalidates the old one and disconnects its old runtime. Only one turn runs at a time; duplicate pending sends are rejected. Explicit Demo mode remains available. Live errors never generate mock replies.

Supported runtimes are official local Codex in ChatGPT account mode and official local Claude Code signed in with a Claude subscription. Codex included usage must be explicitly permitted by its rate-limit response; Claude Code disconnects on reported overage or rejected limits. Unknown/blocked usage fails closed. Account/model checks occur before turns, and low effort is used for conversation. Claude Code chat runs with every tool, MCP server and settings source disabled. No API-key auth, paid fallback, reset-credit purchase, token copying or OAuth implementation is provided. Gemini and Grok preferences are unavailable metadata, not connections. Vendor eligibility, limits and live protocol compatibility depend on the installed runtime.

Native policies remain read-only, on-request approval and user review, with tool network access disabled. These do not guarantee every trusted command prompts or that reads are confined to the working directory. Imported-team tool approval requests are denied; imported teams cannot activate trading, outreach or automation. See SECURITY.md, PROVIDERS.md and BRIDGE-PLAN.md for limits.

## Verification and publication boundary

```sh
npm test
npm run check:browser
npm run check:publish
```

The optional rendered check requires an already-installed Chrome executable (macOS default, or ROLEQUILT_BROWSER). It uses an isolated temporary profile, a fabricated team and mock engine. It tests pairing, Send, reload and failure recovery; it installs nothing and makes no live model request.

`publish-files.json` is the exact allowlist. The publication gate checks working files, staged content, all reachable Git history and remote configuration. Pattern scans are heuristic and still require manual private-data review. None of these commands pushes or publishes. No license has been selected; no open-source reuse license is granted by this package.

In live mode, write a request in the message box, choose a teammate, and click **Consult selected teammate**. The recipient answers in its own thread, then the initiating role receives that real reply and responds. The panel shows sender, recipient, request, reply and progress. Ordinary **Send** also routes direct user requests such as “Please ask Review Partner to review this” or “Can you talk with reviewer about this?” when one exact teammate name or ID matches the selected team. Unknown, duplicated, multiple or unclear recipients retain the draft and show a teammate choice without dispatching. General questions, quoted commands and narrative mentions remain ordinary chat. Recognition is deliberately narrow; use the explicit picker for other wording. Both paths run at most two turns. Cancel stops the exchange. Teams cannot be switched during a relay, and a new pairing/reload cancels active work rather than continuing it silently. Role histories retain the requests and actual responses. No background conversations or extra tool permissions are granted.

Automatic routing examines only the current submitted user composer text. Imported role instructions, model replies and prior messages never initiate relays. Name matching treats configured names as literal data and never expands permissions. The initiating role retains the original user request, and each role retains its actual runtime responses; lengthy internal relay context uses a clearly marked bounded history preview.
