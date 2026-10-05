# Local subscription connection: blocked pending capability/consent

This is a static design record, not an enabled backend. Use each user's official local runtime and its own subscription login only. No API-key fallback, token copying, vendor-client impersonation or GUI workaround. No auth/server/model session was started for this package.

## Protocol feasibility

The inspected public Codex app-server protocol (CLI 0.159.0) exposes sandbox, approval policy, config overrides, runtime roots and dynamicTools. Thread/turn start parameters have no verified top-level global tools-empty/tool-choice-none contract. Dynamic tools are additional definitions; an empty array does not establish removal of built-in tools. readOnly is a sandbox policy, not a promise of no reads or command execution. never is an approval policy, not disabling tools. Empty environments applies conditionally to environment access and may have turn overrides; it does not prove removal of local file/command tools. Public config overrides are open-ended and do not independently prove enforced semantics.

Feature disabling for shell/execution, search, images, apps, hooks, memory, multi-agent or MCP is partial defense unless independently documented and enforced as a complete no-tools boundary. No tested zero-files/zero-commands/external-tools mode is established. Ordinary successful chat is not evidence of isolation. Therefore a zero-model-access connection must remain blocked.

## Minimum exposure to decide before connection

The official runtime must internally read its own authentication/configuration and contact the vendor model service to use the subscription. That internal runtime access is distinct from giving credential content to the model. A model must at least receive the user-approved prompt/role text and return a response. Native coding-agent capabilities can potentially read workspace files and execute sandbox-permitted commands unless a stronger verified boundary removes them. MCP/plugins/settings/instructions can enlarge exposure. Exact residual scope needs a supported design and verification, not an inferred blanket permission.

No new access is approved here. If zero tools is mandatory, stop until a supported enforced route exists. If a bounded workspace capability is proposed instead, specify the exact prompt/files, working directory, tools, commands, network destinations, retention and usage limits, then obtain explicit approval for that concrete exposure. Do not infer permission from an existing login or imported skill. Do not alter the user's global config or credentials to achieve isolation.
