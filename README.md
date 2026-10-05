# Rolequilt

A local, configurable demo workspace with separate role conversations and a shared task board. The included Sample Studio and Planner, Coordinator, Maker, Reviewer and Scout roles are fictional.

Requires Node.js 20 or newer. No packages or API keys are needed.

```sh
npm test
npm start
```

Open the loopback address printed by the server. To select another port, set ROLEQUILT_PORT. The server exposes only the six demo assets; it has no backend API or write endpoints.

Messages, drafts and task-status edits stay in this browser's localStorage. Fixed preview replies can be disabled and do not analyze messages or run agents. No AI model, background automation, external services or real team is connected. Do not enter sensitive data. Reset affects only the current configuration's local demo state.

## Configuration

The fictional example is config/demo.example.json; its contract is config/team.schema.json. Role names, instructions, prompts and ownership are configuration data. For local customization, edit the example within the schema and run npm run demo:build. Validation limits sizes, IDs and owners; rendering uses DOM text. The checked-in demo must remain fictional for publication. Never commit private configurations, messages or credentials.

External configuration import and API connection are unavailable pending a future scope decision. Configuration is a local development workflow, not a live agent runtime. A storage namespace is not access control or encryption.

## Publication

publish-files.json is the exact source allowlist. Run npm run check:publish only after a fresh isolated local Git repository is initialized, every allowlisted file is staged and the reviewed initial commit exists. The gate scans working files, index, reachable history and remote configuration; manual private-content review remains necessary. It does not publish anything.

See SECURITY.md and TEST-REPORT.md for limitations. No license has been selected by the owner. Source is visible pending a license decision; no open-source reuse license is granted by this package.
