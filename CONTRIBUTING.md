Thank you for contributing to OpenLog — this file explains how to get started, run the app locally, and follow our conventions.

1) Getting started
- Clone the repo and install dependencies:

```bash
git clone https://github.com/PratikRai0101/open-log.git
cd open-log
pnpm install
```

- Copy `.env.example` to `.env.local` and fill values required for local development.

2) Development
- Run the dev server:

```bash
pnpm dev
```

- The app uses Clerk for authentication; to test publishing flows you need valid Clerk keys and a GitHub OAuth integration configured in Clerk (see `.env.example` for `GITHUB_OAUTH_TEMPLATE`).

3) Commit message guidelines
- We use Conventional Commits. Example commit messages:

```
feat(editor): add autosave
fix(api): handle empty commits response
docs(readme): clarify env vars
```

4) Branching
- Use descriptive branch names: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.

5) Re-enabling disabled AI providers (Gemini / Kimi)
- These providers are intentionally disabled in the codebase to simplify local development. To re-enable:
  1. Add required env vars (e.g. `GOOGLE_API_KEY` for Gemini) to `.env.local`.
  2. Re-enable the provider in `lib/gemini.ts` (restore client initialization) and in `app/api/generate/route.ts` set `useGemini = true` or allow model selection to choose the provider.
  3. Run the app and test generation flows. Verify streaming behavior and token usage.

6) Tests & formatting
- Format code with the project's configured tools (if present). Add tests where appropriate.

7) Pull requests
- Open a PR against `main`. Include a short description and testing notes. Keep changes small and focused.

If you have questions or need help, open an issue.
