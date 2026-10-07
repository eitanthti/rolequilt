# Rolequilt

A local, configurable demo workspace with separate role conversations and a shared task board. The included Sample Studio and Planner, Coordinator, Maker, Reviewer and Scout roles are fictional.

Requires Node.js 20 or newer. No packages or API keys are needed.

```sh
npm test
npm start
```

Open the loopback address printed by the server. To select another port, set ROLEQUILT_PORT. The server exposes only the seven demo assets; it has no backend API or write endpoints.

Messages, drafts and task-status edits stay in this browser's localStorage. Fixed preview replies can be disabled and do not analyze messages or run agents. No AI model, background automation, external services or real team is connected. Do not enter sensitive data. Reset affects only the current configuration's local demo state.

## Configuration

The fictional example is config/demo.example.json; its contract is config/team.schema.json. Role names, instructions, prompts and ownership are configuration data. For local customization, edit the example within the schema and run npm run demo:build. Validation limits sizes, IDs and owners; rendering uses DOM text. The checked-in demo must remain fictional for publication. Never commit private configurations, messages or credentials.

## Import your team locally

Choose Import team JSON. The Prepare your team for import section provides a selectable, copyable prompt for your existing assistant. It requests an inventory of authorized team files, missing answers, and one team-config.json, excluding secrets and automatic chat exports. The prompt supports a single JSON or a selected folder containing referenced Markdown/text; files are read locally and never uploaded. Copy reports success or selects the text with a manual-copy fallback.

Select a JSON file, review the roster and all configuration fields, then click Apply reviewed team. Cancel leaves the current configuration unchanged. No file is uploaded and no remote API exists. Only fictional examples are checked into this repository; imported values stay in runtime/browser-local storage and never change source files.

Schema-valid teams may contain 1–24 roles and up to 160 tasks. JSON is limited to 64 KiB and 12 levels of structural nesting. Up to 8 configurations can be remembered locally, with a 4 MiB serialized registry limit including bundled text. Team/role names and instruction text can be arbitrary within documented field limits. Unknown fields (including credentials) and prototype keys are rejected. Do not import keys, passwords or sensitive data even in free-text fields: browser storage is not encrypted and text cannot be reliably classified as a secret.

The local team selector returns to remembered configurations. Matching configurations retain their separate histories across reloads; the namespace combines team ID and a configuration fingerprint, so revised instructions start a separate state namespace rather than mixing incompatible histories. Browser storage failure falls back to session-only behavior. Clearing this site's browser data removes remembered configurations and histories. Importing configuration does not start agents or connect a model.

Live API connection and agent execution remain unavailable. Configuration is a local browser workflow, not a live agent runtime. A storage namespace is not access control or encryption.

## Publication

publish-files.json is the exact source allowlist. Run npm run check:publish only after a fresh isolated local Git repository is initialized, every allowlisted file is staged and the reviewed initial commit exists. The gate scans working files, index, reachable history and remote configuration; manual private-content review remains necessary. It does not publish anything.

See SECURITY.md and TEST-REPORT.md for limitations. No license has been selected by the owner. Source is visible pending a license decision; no open-source reuse license is granted by this package.

## Skill-file folder bundles

Single JSON remains supported when there are no file references. Optionally add `skills` and `supportingFiles` arrays to each role. Skills use portable relative paths ending exactly `SKILL.md`; supporting files use `.md` or `.txt`. Each array permits 0–16 paths. A skill can be shared by several roles. Example fields:

```json
"skills": ["skills/planning/SKILL.md"],
"supportingFiles": ["skills/planning/notes.md"]
```

Select one folder using the folder picker:

```text
team-bundle/
  team-config.json
  skills/planning/SKILL.md
  skills/planning/notes.md
```

The JSON sits at the folder root. Every declared reference must resolve to a nonempty selected file; missing references are listed and Apply stays disabled. Preview shows role-to-file mapping, filenames, UTF-8 sizes and selectable file contents before explicit Apply. Cancel leaves the active team unchanged. Applied text is available in each role's details under text-only sections; it is not installed, followed or activated. Different file contents get a separate history namespace. Matching bundles restore their own local histories.

Folder limits: 64 files, 128 KiB per supporting text file, 64 KiB root JSON, 1 MiB total. No ZIP extraction or dependencies. Absolute/URL/traversal/percent-encoded/backslash paths, hidden/reserved/unsafe names, duplicate case-normalized paths, other file extensions, invalid UTF-8/control-byte content, shebang scripts and common credential patterns are rejected. Credential detection is heuristic: never include secrets in prose. Only explicitly selected files are read; unsupported extra files block the bundle rather than being silently ignored. Some browsers lack folder selection; JSON-only import still works, but referenced skills cannot be imported without a supported folder picker.

Imported configs/files stay in this browser's runtime/localStorage, never in source/demo fixtures or repository history. Storage is unencrypted and may fill; session-only status is shown when persistence fails. No fetch, external upload, account access, executable import or live tool/skill execution exists.

## Local subscription runtime preferences

The intended connection design uses the user's own local subscription-backed vendor runtime. No separate API billing onboarding, API-key entry or silent paid fallback is offered. Rolequilt remains disconnected and has no bridge, login flow or model execution.

Providers & models allows an inert preference for the local Codex/ChatGPT candidate plus an optional unverified model ID (max120 safe characters). Claude Code, Gemini and Grok routes are unavailable because supported local subscription integration for this app has not been established. Historical/imported preferences for those providers are preserved as unavailable metadata; they never activate a connection. Optional role.modelPreference remains schema-compatible, but selecting unsupported live routes is not permitted. No model catalog is fetched or availability verified.

A local installation/login does not establish third-party eligibility or zero tool/file exposure. Any future connection requires specific approval after documented runtime capabilities, usage limits and data exposure are known. Authentication stays inside the official runtime; this app must never read/copy vendor token files. See PROVIDERS.md and LOCAL-RUNTIME-DESIGN.md. Imported skill text remains inert data, not activated capabilities. Deployment and integration design remain open.

## Optional local live UI

The bridge can serve this polished app on one protected loopback origin when constructed with `app:true`. It stays separate from `npm start`, which remains a static demo. Private orchestration supplies the official executable, selected workspace, reviewed team bundle, history persistence and optional durable thread store; none belongs in this public package.

On the live origin, choose **Pair and load private team**, then **Connect local Codex**. Live Codex is the default chat mode there. Pick an account-discovered model and a role, then send normally; replies stream to that role and persist through the private server callback. Explicit Demo mode uses only the original local preview handler. A disconnected or failed live request never produces a mock reply. Pair again after reload to invalidate the old session and restore private history. The first connection/resume has setup latency; subsequent turns reuse the warm process and role thread. Catalog-supported low effort is used for conversation; actual latency varies. Native approvals are displayed with one-shot choices. Existing ChatGPT authentication and included-usage checks are mandatory; API auth or unknown included usage blocks turns.

The live handler/runtime path has been tested with a benign actual message. Rendered browser interaction remains unverified. Local session protection does not defend against malicious local processes.

### Keep the local service under your control

Run `npm run start:live -- /absolute/path/to/private-launch.cjs` in your own Terminal and keep that window open. This runs the existing private launcher in the foreground; it does not install a daemon, start at login, change OS permissions or publish anything. Closing the terminal or pressing Ctrl+C stops it. A refused localhost connection means the service must be checked/restarted, not that browser pairing failed. Tool-managed background sessions may disappear; their lifetime is not promised. The launcher prints startup failures and exit status in the terminal. Keep private launch configuration outside this repository.

`npm run check:browser` optionally runs a bounded rendered Chrome check against a fabricated team/mock runtime, using an isolated temporary profile. It requires an already-installed Chrome executable (macOS default path, or ROLEQUILT_BROWSER); it installs nothing and makes no live model request. Static previews remain intentionally offline. The live origin shows unpaired/connecting/connected/error state and enables Send only when ready.

Pair and connect this team preserves an already imported team and its drafts. It registers that team's validated role context for chat only, then connects the existing subscription runtime; it never activates imported automation or external actions. Team/thread/history identity is scoped to the validated team configuration. Imported-team tool approval requests are denied. Session errors stop polling and expose the recovery action; reload or expired-session recovery does not reset stored configuration or unsent text.
