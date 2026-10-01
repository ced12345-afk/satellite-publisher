# Satellite Publisher

> Agentic multi-site publishing system for discovering topics, generating original content and images, and publishing across owned websites.

Satellite Publisher is a sanitised, public demonstration of a production-style
editorial workflow. It treats public RSS and sitemap entries as **topic signals**,
then routes, plans, drafts, reviews and prepares independent content for one or
more destination sites. This repository contains no production feeds, sites,
credentials, article history or server paths.

## Overview

- Monitors public RSS feeds and sitemaps as editorial signals.
- Deduplicates URLs and titles, then scores relevant opportunities.
- Plans and generates an original article draft as JSON.
- Can generate supporting imagery.
- Adapts an approved draft for a configured destination adapter.
- Supports FTP and WordPress REST bridge publishing patterns.
- Logs each workflow step and supports human approval.

## Agentic workflow

`RSS ingestion → topic detection → relevance analysis → content planning → article generation → image generation → destination adaptation → validation → FTP publication → logging`

Human review is a configurable but recommended gate before every remote action.
See the [architecture documentation](docs/architecture.md).

## Architecture

```mermaid
flowchart LR
  RSS[RSS / Sitemap] --> Discovery --> Score[Deduplication & Scoring]
  Score --> Plan[Editorial Planner] --> Draft[Article Draft JSON]
  Draft --> Review[Editorial Review] --> Human[Human Approval]
  Human --> Adapter[Site Adapter] --> Publish[FTP / WordPress]
  Publish --> Monitor[Logs / Monitoring]
```

## OpenAI models and APIs

The production-derived architecture uses:

- **OpenAI Responses API** with `gpt-5.6-terra` for editorial planning, article
  generation and quality review.
- `reasoning.effort` and JSON output mode for predictable workflow hand-offs.
- **OpenAI Images API** with `gpt-image-2` for supporting editorial images.

This project does **not** claim to use web search, tool calling or strict
Structured Outputs. The public demo does not call any external API unless you
explicitly add credentials and disable dry-run in a controlled environment.

## Responsible content discovery

Public RSS feeds are used only as topic-discovery signals. Satellite Publisher
does not republish source articles. Generated content must be original and
independently written, with safeguards against copying or overly close
paraphrasing.

The public implementation passes only a title, URL, optional author/date and a
short excerpt capped at 700 characters. It explicitly instructs generation:

> Do not reproduce source wording or structure. Generate an independent original article based on the topic and verified facts.

Drafts with excessive overlap are routed to `needs_review`.

## Human oversight

The intended operating model is human-in-the-loop: inspect the candidate,
editorial plan, draft, source policy, image and destination before remote
publication. A quality score can support that review; it does not replace it.

## Dry-run mode

`DRY_RUN=true` is the default and blocks FTP, WordPress POSTs, Google Indexing
requests and all other remote changes. It produces a local preview/log only.

```bash
cp .env.example .env
npm run demo
```

The output is written to `previews/demo-output.json`, which is intentionally
ignored by Git.

## Setup

Requires Node.js 20 or later.

```bash
git clone https://github.com/ced12345-afk/satellite-publisher.git
cd satellite-publisher
cp .env.example .env
npm test
npm run demo
```

Do not change `DRY_RUN` to `false` unless you have supplied controlled staging
adapters, reviewed your credentials and added a human approval policy.

## Configuration

`config.example/` contains fictional sites and sources. Copy these files into a
private runtime configuration; never commit production domains, hostnames,
paths, queues or credentials.

The production architecture can optionally use:

- **ScrapingDog API** for SERP enrichment. It is optional in the current main
  workflow and is not necessary for RSS-led editorial discovery.
- RSS and sitemap parsing for public discovery.
- FTP via `curl` or a WordPress REST bridge for approved destination output.
- Google Indexing API and Google Search Console URL Inspection API for optional
  post-publication monitoring.

## Testing

```bash
npm test
npm run lint
```

The test suite uses no real services. It covers invalid RSS, duplicate URLs and
titles, retry handling, empty drafts, source similarity, image/FTP/WordPress
failures, previously published items and dry-run blocking.

## Security

Never commit `.env`, `secrets/`, `credentials/`, `storage/`, logs, previews,
OAuth material, API keys, FTP hosts or passwords. The included `.gitignore`
covers these paths. If a credential is ever committed, rotate it immediately
and remove it from history before making the repository public.

## GitHub Pages

Project documentation is published from [`docs/index.html`](docs/index.html):
<https://ced12345-afk.github.io/satellite-publisher/>

Related implementation page: <https://www.consultant-geo.paris/outil-satellite-publisher>

## Built end-to-end with Codex

Codex was used as the primary coding agent throughout the project lifecycle:
architecture, implementation, refactoring, debugging, workflow orchestration,
documentation, and deployment preparation. Human oversight focused on product
goals, editorial rules, validation, and production decisions.

## License

[MIT](LICENSE)
