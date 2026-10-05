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

Choose Import team JSON. The Prepare your team for import section provides a selectable, copyable prompt for your existing assistant. It requests an inventory of authorized team files, missing answers, and one team-config.json, excluding secrets and automatic chat exports. Supporting documents can be listed separately but are not uploaded or parsed. Copy reports success or selects the text with a manual-copy fallback.

Select a JSON file, review the roster and all configuration fields, then click Apply reviewed team. Cancel leaves the current configuration unchanged. No file is uploaded and no remote API exists. Only fictional examples are checked into this repository; imported values stay in runtime/browser-local storage and never change source files.

Schema-valid teams may contain 1–24 roles and up to 160 tasks. JSON is limited to 64 KiB and 12 levels of structural nesting. Up to 8 configurations can be remembered locally. Team/role names and instruction text can be arbitrary within documented field limits. Unknown fields (including credentials) and prototype keys are rejected. Do not import keys, passwords or sensitive data even in free-text fields: browser storage is not encrypted and text cannot be reliably classified as a secret.

The local team selector returns to remembered configurations. Matching configurations retain their separate histories across reloads; the namespace combines team ID and a configuration fingerprint, so revised instructions start a separate state namespace rather than mixing incompatible histories. Browser storage failure falls back to session-only behavior. Clearing this site's browser data removes remembered configurations and histories. Importing configuration does not start agents or connect a model.

Live API connection and agent execution remain unavailable. Configuration is a local browser workflow, not a live agent runtime. A storage namespace is not access control or encryption.

## Publication

publish-files.json is the exact source allowlist. Run npm run check:publish only after a fresh isolated local Git repository is initialized, every allowlisted file is staged and the reviewed initial commit exists. The gate scans working files, index, reachable history and remote configuration; manual private-content review remains necessary. It does not publish anything.

See SECURITY.md and TEST-REPORT.md for limitations. No license has been selected by the owner. Source is visible pending a license decision; no open-source reuse license is granted by this package.
