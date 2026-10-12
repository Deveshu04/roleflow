## What and why

<!-- One or two sentences. Link the issue if there is one: Closes #123 -->

## How it was tested

<!-- Commands you ran, forms or job sources you tried. Never paste real personal data or API keys. -->

## Checklist

- [ ] `npm run check` passes (lint, typecheck, tests) and `npm run build` succeeds
- [ ] Changes to the agent's form engine (`lib/agent/actions.ts`, `lib/agent/snapshot.ts`) come with a fixture test in `tests/`
- [ ] No secrets, resumes, screenshots of real people or contents of `data/` are included
- [ ] User-facing safety behaviour (approval gate, demographic guard, URL guard) is unchanged, or the change is explained above
- [ ] Docs updated if behaviour or configuration changed
