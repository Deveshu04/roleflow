# Contributing to Roleflow

Thanks for helping improve Roleflow! This guide covers how to set up the project and what a pull request needs before it can be merged.

## Ground rules

- **Never commit secrets or personal data.** That covers `.env.local`, anything in `data/`, real resumes, and screenshots or logs that show real people. Use fictional data and `example.com` addresses in tests and docs.
- **Keep the safety guarantees.** The approval gate before submit, the demographic guard, the URL guard and the "never invent facts" rules are product features. Changes that weaken them need a strong reason in the PR description.
- **Respect the sites you automate.** Don't add code that bypasses CAPTCHAs, bot detection or rate limits, or that creates accounts automatically.

## Setup

```bash
git clone https://github.com/Deveshu04/roleflow.git
cd roleflow
npm install
npx playwright install chromium     # browser used by the test suite
cp .env.example .env.local          # add your OPENAI_API_KEY
npm run dev                         # http://127.0.0.1:3000
```

You only need the API key and Google Chrome for manual end-to-end runs. The automated tests don't call OpenAI.

## Making a change

1. Fork the repo and create a branch from `main` (for example `fix/lever-location`).
2. Keep the change focused. Small PRs are reviewed faster.
3. Run the checks locally:

   ```bash
   npm run check    # lint + typecheck + tests
   npm run build
   ```

4. Open a pull request using the template. Describe what changed, why, and how you tested it.

## What CI enforces

A pull request can only be merged when all of these pass and a maintainer has approved it:

| Check | What it runs |
|---|---|
| Lint, typecheck & test (Node 22, 24) | `eslint`, `next typegen && tsc --noEmit`, Playwright engine tests |
| Production build | `next build` |
| Secret scan & dependency audit | gitleaks over the full history, `npm audit --omit=dev --audit-level=high` |
| Dependency review | blocks newly added dependencies with high-severity advisories |
| CodeQL | static security analysis (`security-extended`) |

## Code style

- TypeScript in strict mode. Prefer small, well-named functions over comments.
- Comments are for the non-obvious *why*, in one line. Don't narrate what the code does.
- Server code lives in `lib/`; route handlers in `app/api/` stay thin.
- Code that runs inside web pages (see `lib/agent/snapshot.ts`) must be plain JavaScript with no build-time helpers.

## Tests

`tests/` holds fast, deterministic tests for the agent's form engine. They use fixture pages modelled on real application forms, so no network or API key is needed.

If you change how fields are read or filled (`lib/agent/snapshot.ts` or `lib/agent/actions.ts`), add a fixture that reproduces the form pattern. `tests/agent-engine.spec.ts` has examples, including Lever's location type-ahead.

## Adding a job source or ATS

- **New job source:** add a fetcher in `lib/jobs/` that returns `Job` objects, then wire it into `lib/jobs/search.ts`.
- **New ATS:** teach `fetchAtsJob` in `lib/jobs/ats.ts` to read the posting from the provider's public API, and add the host to the URL pattern in `lib/jobs/web.ts`.
- **New application-form pattern** (a custom dropdown, for example): extend the form engine and add a fixture test as described above.

## Reporting bugs and ideas

Use the issue templates. Report security problems privately as described in [SECURITY.md](SECURITY.md).

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) and that you'll follow the [Code of Conduct](CODE_OF_CONDUCT.md).
