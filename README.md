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
