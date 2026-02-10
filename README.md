<!-- Hero + badges modeled after Better Shot README style -->
<div align="center">
  <a href="https://discord.gg/zThjstVs"><img alt="Discord" src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white"/></a>
  <a href="https://x.com/code_kartik"><img alt="X (Twitter)" src="https://img.shields.io/badge/X-%231DA1F2.svg?style=for-the-badge&logo=X&logoColor=white"/></a>
  <a href="https://www.buymeacoffee.com/code_kartik"><img alt="Buy Me a Coffee" src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00.svg?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black"/></a>

  <h1>OpenLog</h1>
  <p><strong>An open-source, AI-native release manager for developers.</strong></p>

  <p>
    <a href="https://openlog.vercel.app">Live Demo</a>
    · <a href="https://github.com/PratikRai0101/open-log/issues">Report Bug / Request Feature</a>
  </p>
</div>

---

![openlog-hero](https://github.com/user-attachments/assets/3051266a-5179-440f-a747-7980abd7bac3)

> OpenLog automates changelog writing. Select commits, generate an AI draft, polish in a rich workstation, and publish to GitHub Releases.

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

## Features

- AI-powered changelog generation (Groq / Llama 3.3 — default)
- Live streaming generation with typewriter UI
- Notion-style block editor (BlockNote) with autosave and draft restore
- Smart SemVer bump suggestions (Patch / Minor / Major)
- One-click publish to GitHub Releases
- Copy-to-clipboard for cross-posting

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

Copy `.env.example` to `.env.local` and fill required keys: Clerk, GitHub token, GROQ API key.

Gemini and Kimi integrations are currently disabled; only `GROQ_API_KEY` is required for AI generation.

## Usage

1. Log in with GitHub via Clerk.
2. Select a repository and pick commits.
3. Press `Generate` (or `⌘+Enter`) to stream an AI draft.
4. Edit the draft in the workstation and publish to GitHub Releases.

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

## Contributing

We welcome contributions. Please follow these steps:

1. Fork the project
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes with Conventional Commits (e.g. `feat(editor): add autosave`)
4. Push and open a Pull Request

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
