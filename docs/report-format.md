# Copilot Usage Billing CSV Format

The app accepts two schema variants of the usage-based billing CSV export:

1. The **current preview schema** (in effect before June 2026), which surfaces request usage alongside reference `aic_*` columns.
2. The **June 2026+ schema**, which drops `model`, `total_monthly_quota`, `exceeds_quota`, and the `aic_*` columns and adds `repository` and `workflow_path`. AI Credit metering becomes the primary billing unit, so `gross_amount`, `discount_amount`, and `net_amount` on `ai-credits` rows already reflect the included credits applied by GitHub.

## Required columns used by the app

Columns marked **(current only)** are required on the current preview schema and absent from the June schema. Columns marked **(June only)** are required on the June schema. All other columns are required on both.

| Column | Type | Description |
| --- | --- | --- |
| `date` | ISO date (YYYY-MM-DD) | Day of the usage. |
| `username` | string | GitHub username that generated the request. |
| `product` | string | Product name such as `copilot` or `spark`. |
| `sku` | string | SKU identifier for the billed action, such as `copilot_premium_request`, `coding_agent_premium_request`, `copilot_ai_credit`, `coding_agent_ai_credit`, or `spark_ai_credit`. |
| `model` | string | **(current only)** Model name (for example `Claude Sonnet 4.5`, `Claude Opus 4.6`, `GPT-5.2`). Defaults to empty (rendered as `Unlabeled`) when absent. |
| `quantity` | number | Number of billable units for the row. |
| `unit_type` | string | Unit basis for billing. The app processes `requests` and `ai-credits` rows; rows with any other unit type (for example `user-months`, `minutes`, `gigabyte-hours`) are dropped. |
| `applied_cost_per_quantity` | number | Unit price applied for each quantity. |
| `gross_amount` | number | Gross charge before discounts. |
| `discount_amount` | number | Discounts applied to the row. |
| `net_amount` | number | Charge after discounts (`gross_amount - discount_amount`). |
| `exceeds_quota` | boolean | Whether the usage exceeded quota (`True` / `False`). Optional on both schemas. |
| `total_monthly_quota` | number | **(current only)** Monthly quota for the user or plan applicable to the row. Defaults to `0` when absent. |
| `organization` | string | Organization slug associated with the usage. |
| `repository` | string | **(June only)** Repository slug, or empty for non-repository-scoped usage. Ignored by the app. |
| `workflow_path` | string | **(June only)** Workflow path that produced the usage, or empty. Ignored by the app. |
| `cost_center_name` | string | Optional cost center or tagging field. |
| `aic_quantity` | number | **(current only)** Same usage converted to AI Credits. |
| `aic_gross_amount` | number | **(current only)** AI Credit gross cost. |

## Notes
- Header row is single-lined; subsequent rows are usage records. Values are comma-separated, double-quoted where needed.
- Monetary fields are decimals. `aic_quantity` may also be fractional.
- The app streams the file, treats the first row as the header, and counts subsequent data rows without loading the entire file into memory.
- On the current schema, `requests` rows are processed as request/PRU usage while `aic_quantity` and `aic_gross_amount` remain reference/comparison values. On any non-`requests` row, request/PRU gross/discount/net totals are counted as `0`, while AI Credits and AI Credit gross cost are taken from the AI-specific fields (`aic_quantity` / `aic_gross_amount`), with fallback to `quantity` / `gross_amount` only when those AI-specific fields are blank.
- On the June schema, `ai-credits` rows already carry the included-credits discount in `discount_amount`, and `net_amount` is the authoritative AI Credit net charge. The app respects those row-level values and does not re-apply pooled or per-user included-credit allocation to them. Seat-count overrides therefore have no effect on June `ai-credits` rows.
- Header validation distinguishes the schemas by the presence of `total_monthly_quota`: when it is present, the `aic_quantity` and `aic_gross_amount` columns must also be present (older pre-usage-based exports are rejected with an explanatory error). When it is absent, `repository` and `workflow_path` must be present to confirm the June schema.
