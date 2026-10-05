# Official provider setup references

Research checked October 5, 2026; source links supplied by the coordinating research task. Account access/model availability not tested. These are setup-only references, not implemented connections.

## OpenAI / GPT

API access uses a Platform key and API billing separate from ChatGPT subscriptions. Eligible local/open-source integrations may support Sign in with ChatGPT plan usage; paid/remote apps require approval. Neither flow is implemented here, and no past chats are imported.

- [Provider console/setup](https://platform.openai.com/api-keys)
- [Authentication](https://developers.openai.com/api/reference/overview)
- [Model catalog](https://developers.openai.com/api/reference/resources/models/methods/list)
- [Billing](https://platform.openai.com/account/billing/overview)
- [Eligible Sign in with ChatGPT integrations](https://developers.openai.com/siwc/token-sharing-open-source)

## Anthropic / Claude

Use Claude API/Console access with API billing separate from consumer subscriptions. Third-party tools use API authentication; do not borrow Claude Code subscription tokens. Account access and model availability must be checked in the console.

- [Provider console/setup](https://platform.claude.com/settings/keys)
- [Authentication](https://platform.claude.com/docs/en/manage-claude/authentication)
- [Model catalog](https://platform.claude.com/docs/en/api/models/list)
- [Billing](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console)
- [Subscription token restrictions](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account)

## Google / Gemini

Use AI Studio to select/create/import a Cloud project and prepare an API key; review project quotas and Cloud Billing. A Google AI subscription is not automatic unlimited API allowance; developer credits may be separate. Project OAuth exists, but this app implements neither OAuth nor API authentication.

- [Provider console/setup](https://ai.google.dev/gemini-api/docs/api-key)
- [Authentication](https://ai.google.dev/gemini-api/docs/oauth?hl=en)
- [Model catalog](https://ai.google.dev/api/models)
- [Billing](https://ai.google.dev/gemini-api/docs/billing/)
- [AI Studio project/key setup](https://ai.google.dev/gemini-api/docs/api-key)

## xAI / Grok

Use the xAI console to prepare a team API key and review API credits/billing. Selected integrations support subscription OAuth (for example Kilo); a generally supported Rolequilt OAuth flow has not been established. No account connection is implemented here.

- [Provider console/setup](https://console.x.ai/home)
- [Authentication](https://docs.x.ai/developers/quickstart)
- [Model catalog](https://docs.x.ai/developers/rest-api-reference/inference/models)
- [Billing](https://docs.x.ai/console/billing)
- [Selected subscription OAuth integration](https://x.ai/news/grok-kilocode)

No API-key/token fields exist in this UI. All preferences remain unverified and disconnected. Do not import credential values into configurations or skill text. A future secure runtime needs provider authentication, model-catalog queries, access controls and spend limits; no such backend is included. No license decision has been made.
