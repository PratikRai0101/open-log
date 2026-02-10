<!-- Hero + badges modeled after Better Shot README style -->
<div align="center">
  <a href="https://www.linkedin.com/in/pratikrai0101/"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white"/></a>
  <a href="https://x.com/PratikRai0101"><img alt="X (Twitter)" src="https://img.shields.io/badge/X-%231DA1F2.svg?style=for-the-badge&logo=X&logoColor=white"/></a>
  <a><img alt="Buy Me a Coffee" src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00.svg?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black"/></a>

  <h1>OpenLog</h1>
  <p><strong>An open-source, AI-native release manager for developers.</strong></p>

  <p>
    <a href="https://open-log.vercel.app">Live Demo</a>
    · <a href="https://github.com/PratikRai0101/open-log/issues">Report Bug / Request Feature</a>
  </p>
</div>

---

![openlog-hero](/public/hero-screenshot.png)

> OpenLog automates changelog writing. Select commits, generate an AI draft (Groq), polish in a rich BlockNote workstation, and publish to GitHub Releases.

## Table of contents

- [Background](#background)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Star history](#star-history)

## Background

Maintaining clear release notes is repetitive and error-prone. OpenLog pulls commits, groups them semantically, and uses a model (Groq by default) to produce concise, user-friendly changelogs you can edit and publish.

## Features (implemented)

- AI-powered changelog generation (Groq / Llama 3.3) — server-side generation and streaming
- Streaming-friendly client with progressive "typewriter" reveal and skeleton loading
- BlockNote rich editor for editing generated drafts (WYSIWYG) with autosave and explicit "Restore Draft" CTA
- Commit selection UI with persisted selection per-repo
- Smart SemVer suggestions (fetch latest GitHub tag and suggest Patch/Minor/Major)
- One-click publish to GitHub Releases from the workstation
- Lightweight Model selector (Groq enabled); other models are intentionally disabled in code

## Install

Download and run locally:

```bash
git clone https://github.com/PratikRai0101/open-log.git
cd open-log
pnpm install
pnpm dev

# Visit http://localhost:3000
```

### Requirements

- Node.js 18+
- pnpm (recommended)

### Environment

Copy `.env.example` to `.env.local` and fill required keys. Currently required env vars:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key (auth)
- `CLERK_SECRET_KEY` — Clerk server key (auth)
 - `GROQ_API_KEY` — Groq provider API key (AI generation, required)
 - `GITHUB_OAUTH_TEMPLATE` — OAuth template name used by Clerk (defaults to `oauth_github` in `.env.example`)
 - `GITHUB_ACCESS_TOKEN` — optional: a personal or machine token used server-side to fetch release metadata when present (not required for publish which uses Clerk OAuth)

Other provider keys (Gemini / Kimi) are intentionally disabled by default and are not required. See CONTRIBUTING.md for how to re-enable provider paths.

## Usage

1. Log in with GitHub via Clerk.
2. Select a connected repository in the workspace and pick commits to include.
3. Press `Generate` (or `⌘+Enter`) to stream an AI draft (Groq).
4. Edit the draft using the BlockNote editor. Drafts are autosaved locally; use "Restore Draft" to recover.
5. Click `Publish` to create a GitHub Release for the selected repo.

### Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Search Commits | `⌘K` |
| Navigate Commits | `J` / `K` |
| Select Commit | `Space` |
| Generate Draft | `⌘ + Enter` |
| Toggle Edit/Preview | `⌘E` |

## Development

- `pnpm dev` — Run the app locally
- Components that are heavy (Editor, ModelSelector) are dynamically imported to reduce initial bundle size.

Local dev notes:

- Authentication: the app uses Clerk for auth. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local` to enable full end-to-end flows that require publishing.
- Publishing: the workstation uses the GitHub OAuth token issued to the signed-in user (via Clerk) to create releases. The server-side `GITHUB_ACCESS_TOKEN` is only used as an optional server-side fallback for metadata lookups (e.g. fetching the latest release tag).

See `CONTRIBUTING.md` for development conventions (Conventional Commits, branch naming, and testing).

## Contributing

Thanks for considering a contribution — see `CONTRIBUTING.md` for the full guide (commit format, branch naming, and local development steps).

## License

MIT — built with ❤️ by Pratik Rai.

## Star history

<a href="https://www.star-history.com/#PratikRai0101/open-log&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&theme=dark&legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&legend=top-left" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&legend=top-left" />
  </picture>
</a>
