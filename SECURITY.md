# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through [GitHub's private vulnerability reporting](https://github.com/Deveshu04/roleflow/security/advisories/new), not in public issues. Include steps to reproduce and the impact you expect. You can expect an acknowledgement within a few days.

## Supported versions

Only the latest release on `main` receives fixes.

## Security model

Roleflow is a **single-user application that runs on your own machine**. It has no accounts or authentication of its own, so its safety depends on the following:

| Concern | How it is handled |
|---|---|
| Network exposure | `npm run dev` and `npm run start` bind to `127.0.0.1` only. Don't expose the app to a network or deploy it publicly: anyone who can reach it can read your resume and drive the browser agent. |
| Cross-site requests | A proxy (`proxy.ts`) rejects API calls whose `Host` isn't localhost (DNS rebinding) or that come from another origin (CSRF), so a website you visit can't start runs or approve submissions. |
| API keys | `OPENAI_API_KEY` is read from `.env.local`, which is git-ignored and never sent to the browser. Only `.env.example` is committed. |
| Personal data | Resumes, parsed profiles, job data, application history and the agent's browser profile live in `data/` (git-ignored, excluded from build output tracing). Resume text and job pages are sent to OpenAI for processing. |
| Credentials | The app never asks for or stores passwords. Sign-ins (LinkedIn, ATS accounts) happen in the agent's own Chrome profile, where you type them yourself. |
| Prompt injection | Job descriptions and web pages are treated as untrusted data in every prompt. The agent can only navigate to public `http(s)` URLs, and submission, demographic answers and URL targets are enforced in code, not only in prompts. |
| Server-side fetches | Pasted job links are fetched only when the host resolves to public addresses, and every redirect hop is re-checked (no `localhost`, private ranges, `file:` and so on). The agent's browser also blocks requests to local and private-network addresses. |
| CAPTCHAs and bot checks | Never bypassed. The run pauses for you instead. |

## Automated checks

Every push and pull request runs:

- gitleaks secret scanning
- `npm audit` on runtime dependencies (fails on high severity)
- dependency review on pull requests
- CodeQL `security-extended` analysis

Dependabot alerts notify the maintainer about vulnerable dependencies. Updates are made deliberately rather than through automated pull requests.

### Known advisory

`mammoth` (the DOCX reader) depends on `argparse@1` → `sprintf-js`, which has a moderate denial-of-service advisory. Only mammoth's command-line entry point uses it, and Roleflow never calls that.
