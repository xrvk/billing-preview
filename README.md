# xrvk's Billing Preview

> **Unofficial fork.** This project is an independent, community-maintained derivative of the open source [GitHub Copilot Billing Preview](https://github.com/github/copilot-billing-preview) project (MIT-licensed, Copyright GitHub, Inc.). It is not affiliated with, endorsed by, or sponsored by GitHub, Inc. "GitHub" and "GitHub Copilot" are trademarks of GitHub, Inc., used here only descriptively to identify the billing CSV format this tool inspects. See [NOTICE](./NOTICE) for the full attribution.

A browser app for previewing and comparing GitHub Copilot usage-based billing reports. Upload your CSV billing reports to explore requests, costs, AI Credits, and trends across users, organizations, models, and cost centers.

**Live app:** <https://xrvk.github.io/billing-preview/>

## Why this fork?

A hosted, lightly-extended build of the upstream tool, focused on schema coverage and a leaner UX. See the full diff against upstream here: [`github/copilot-billing-preview...xrvk/billing-preview`](https://github.com/github/copilot-billing-preview/compare/main...xrvk:billing-preview:main).

- **June 2026+ AIC schema support.** Parses the new usage report layout (no `model`, no `aic_*` columns, new `repository` and `workflow_path` columns) alongside the current preview schema. No code changes upstream yet.
- **Cost Management rebuilt around the documented universal budget lever.** Drops the speculative carveouts and simulation; adds a single ULB control that matches what GitHub actually exposes today.
- **Bookmarkable seat counts via `?cb=` / `?ce=` URL params.** Skip the manual seat-count entry on every visit. If your license counts haven't changed, bookmark the URL with your CB/CE numbers and the confirmation screen is pre-filled or skipped on return.
- **PRU UI auto-hides when reports have no PRU data.** June reports drop request-based metering, so request columns, cards, and charts disappear instead of showing zeros.
- **Copilot Code Review broken out as its own product.** Surfaces code-review-model usage separately from Chat and other Copilot products in the breakdowns.
- **Fixed new-report seat-counting inputs.** Recognizes `total_monthly_quota` values of 1900/3000 (CB) and 3900/7000 (CE) so license tier and seat counts are inferred correctly on newer reports.

## Features

- Parse GitHub Copilot usage billing CSV reports in the browser
- Compare request-based and usage-based billing signals
- Explore usage and cost trends by user, organization, model, product, and cost center
- Review AI Credit usage, included credits, and cost management views

## Scope and limitations

- This app is a preview and planning tool, not a source of record for billing.
- CSV files are processed locally in your browser. Do not upload real billing reports to public issues, pull requests, or discussions.
- The app expects GitHub Copilot billing report CSVs in either the current preview format or the June 2026+ format, both documented in [docs/report-format.md](docs/report-format.md).
- Billing calculations may change as GitHub Copilot usage-based billing evolves.

## Requirements

### Prerequisites

- Node.js 20.19.0+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

### Hosting your own copy

You can deploy a private instance of this app to any static host (GitHub Pages, Netlify, Vercel, an S3 bucket, etc.). The build output in `dist/` is a fully static SPA.

### URL parameters for seat counts (advanced)

For organization-scope reports the app shows a "Review licensed seat counts" screen after upload so you can add seats that aren't represented in the CSV. Technical users can prefill or bypass this screen with query parameters on the page URL:

| Param | Value | Effect |
| --- | --- | --- |
| `cb` | non-negative integer | Copilot Business seat count |
| `ce` | non-negative integer | Copilot Enterprise seat count |

Example: `https://<your-app-url>/?cb=120&ce=40`

The confirmation screen is **only** bypassed when both `cb` and `ce` are present, both parse as non-negative integers, and both are at least the historical counts derived from the CSV. Otherwise the screen still appears (with any provided value prefilled) so partial input or below-default values surface as a normal validation error.

To prevent stale URLs from silently misapplying to a different upload, the values are blanked (`?cb=&ce=`) after each upload while the keys themselves remain visible. Each upload must supply fresh values, so refreshing the page or re-uploading without editing the URL won't reapply the previous run's counts.

## License

This project is licensed under the terms of the MIT open source license. The upstream copyright notice is preserved in the [LICENSE](./LICENSE) file, along with the attribution for this fork.

## Trademark and attribution

See [NOTICE](./NOTICE) for the full trademark and attribution statement. In short: "GitHub" and "GitHub Copilot" are trademarks of GitHub, Inc. This project is independent and unofficial.

## Support

This is a personal open source fork. Use GitHub issues on this repository to report bugs and request improvements. Do not attach billing CSV files or screenshots that contain sensitive billing information.
