<div align="center">

</div>

# 🚢 OpenLog

**An open-source, AI-native release manager for developers.**

[Live Demo](https://www.google.com/url?sa=E&source=gmail&q=https://openlog.vercel.app) · [Report Bug](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/PratikRai0101/open-log/issues) · [Request Feature](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/PratikRai0101/open-log/issues)


## Table of contents

* [Background](https://www.google.com/search?q=%23background)
* [Why OpenLog?](https://www.google.com/search?q=%23why-openlog)
* [Features](https://www.google.com/search?q=%23features)
* [AI Generation](https://www.google.com/search?q=%23ai-generation)
* [Editor Experience](https://www.google.com/search?q=%23editor-experience)
* [Publishing Workflow](https://www.google.com/search?q=%23publishing-workflow)


* [Install & Local Setup](https://www.google.com/search?q=%23install--local-setup)
* [Requirements](https://www.google.com/search?q=%23requirements)
* [Environment Variables](https://www.google.com/search?q=%23environment-variables)
* [Build from source](https://www.google.com/search?q=%23build-from-source)


* [Usage](https://www.google.com/search?q=%23usage)
* [Quick Start](https://www.google.com/search?q=%23quick-start)
* [Keyboard Shortcuts](https://www.google.com/search?q=%23keyboard-shortcuts)


* [Roadmap](https://www.google.com/search?q=%23roadmap)
* [Contributing](https://www.google.com/search?q=%23contributing)
* [License](https://www.google.com/search?q=%23license)
* [Star history](https://www.google.com/search?q=%23star-history)

## Background

Writing changelogs is a chore. Developers often resort to dumping raw, unreadable commit messages into GitHub Releases. **OpenLog** solves this by pulling your commits, feeding them to top-tier LLMs to generate human-readable notes, and providing a beautiful workstation to polish the output before shipping.

## Why OpenLog?

| The Old Way 🐌 | The OpenLog Way 🚀 |
| --- | --- |
| Manually reading through 50+ commit messages | **Select All → Generate** in 2 seconds |
| Copy-pasting raw `git log` output | **AI categorizes** into Features, Fixes, & Chores |
| Writing Markdown in a plain text box | **Rich-text, Notion-style** BlockNote editor |
| Switching tabs to GitHub to create a release | **One-Click Publish** directly from the workstation |

## Features

### AI Generation

* **Multi-Model Support**: Choose between Google Gemini (Streaming), Groq (Llama 3.3 for speed), and Moonshot Kimi2 (High Quality).
* **Real-time Streaming**: Watch your release notes generate live with a custom streaming UI.
* **Custom Tones (Vibe Check)**: Generate notes in Professional, Startup Hype, Pirate, or Minimalist tones.

### Editor Experience

* **Notion-Style Editing**: Powered by `BlockNote` for a rich, block-based writing experience.
* **Split-Panel UI**: A professional "Floating Cards" layout separating commit selection from the writing canvas.
* **Auto-Save**: Never lose your work. Drafts are continuously saved to your local storage.
* **Dark Mode Native**: A sleek "Midnight" aesthetic with subtle grid backgrounds and brand-colored accents.

### Publishing Workflow

* **One-Click Deploy**: Push your finalized release notes directly to GitHub Releases.
* **Smart SemVer**: Automatically fetches your latest GitHub tag and suggests the next Patch, Minor, or Major version.
* **Clipboard Copy**: One-click copy for cross-posting to Discord, Slack, or Twitter.

## Install & Local Setup

Want to run OpenLog locally or self-host it? Follow these steps.

### Requirements

* **Node.js**: 18+
* **pnpm** (recommended)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

```

# GitHub Integration


GITHUB_ACCESS_TOKEN=your_github_personal_access_token

# AI Providers (You only need the ones you plan to use)


GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MOONSHOT_API_KEY=your_moonshot_api_key
```
### Build from source

```bash
git clone [https://github.com/PratikRai0101/open-log.git](https://github.com/PratikRai0101/open-log.git)
cd open-log

```

pnpm install

pnpm dev
```
Visit `http://localhost:3000` to see the application.

## Usage

### Quick Start

1. Log in using your GitHub account via Clerk.
2. Navigate to a connected repository in your workspace.
3. Select the commits you want to include in your release notes from the left sidebar.
4. Hit **Generate** (or use `CMD+ENTER`) to stream the AI draft.
5. Edit the draft using the rich-text workstation.
6. Click **Publish** to create a live GitHub Release.

### Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Search Commits | `⌘K` |
| Navigate Commits | `J` / `K` |
| Select Commit | `Space` |
| Generate Draft | `⌘ + Enter` |
| Toggle Edit/Preview | `⌘E` |

## Roadmap

* [x] GitHub OAuth Integration
* [x] Multi-Model AI Generation (Gemini, Groq, Moonshot)
* [x] BlockNote Rich Text Editor
* [x] Smart Semantic Versioning
* [x] Direct GitHub Releases Publishing
* [ ] **Discord/Slack Webhooks:** Broadcast release notes to your team instantly.
* [ ] **Linear/Jira Integration:** Link commits to issue tickets automatically.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is distributed under the MIT License. Built with 🖤 by Pratik Rai.

## Star history

<a href="https://www.star-history.com/#PratikRai0101/open-log&type=date&legend=top-left">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&theme=dark&legend=top-left" />
<source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&legend=top-left" />
<img alt="Star History Chart" src="https://api.star-history.com/svg?repos=PratikRai0101/open-log&type=date&legend=top-left" />
</picture>
</a>
