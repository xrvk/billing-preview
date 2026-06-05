# xrvk's Billing Preview

> **Unofficial fork.** This project is an independent, community-maintained derivative of the open source [GitHub Copilot Billing Preview](https://github.com/github/copilot-billing-preview) project (MIT-licensed, Copyright GitHub, Inc.). It is not affiliated with, endorsed by, or sponsored by GitHub, Inc. "GitHub" and "GitHub Copilot" are trademarks of GitHub, Inc., used here only descriptively to identify the billing CSV format this tool inspects. See [NOTICE](./NOTICE) for the full attribution.

A browser app for previewing and comparing GitHub Copilot usage-based billing reports. Upload your CSV billing reports to explore requests, costs, AI Credits, and trends across users, organizations, models, and cost centers.

This fork tracks the upstream project and adds:

- Support for the June 2026+ usage report schema (no `model`, `total_monthly_quota`, or `aic_*` columns; new `repository` and `workflow_path` columns).
- Cost Management UI rebuilt around the documented universal budget lever.
- `cb` / `ce` URL parameters to prefill or skip the seat-count confirmation screen.

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
