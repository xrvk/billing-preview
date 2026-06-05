export type ReportFormat = 'pru' | 'aic'

// Filename prefix used by the legacy Premium Request Usage Report export
// (e.g. "premiumRequestUsageReport_1_<hash>.csv"). Matched case-insensitively.
const PRU_FILENAME_PREFIX = 'premiumrequestusagereport'

// Filename prefix used by the generic GitHub Usage Report export
// (e.g. "usageReport_1_<hash>.csv"). This report does not include the Copilot
// usage columns we need, so it must be rejected before pipeline ingestion.
const GENERIC_USAGE_REPORT_FILENAME_PREFIX = 'usagereport'

function normalizeFileName(fileName: string | null | undefined): string {
  return (fileName ?? '').trim().toLowerCase()
}

// Detect the report format from the uploaded file's name. Falls back to 'aic'
// so the current AIC seat-count logic remains the default for unknown or
// missing filenames.
export function detectReportFormatFromFileName(fileName: string | null | undefined): ReportFormat {
  const normalized = normalizeFileName(fileName)
  if (normalized.startsWith(PRU_FILENAME_PREFIX)) return 'pru'
  return 'aic'
}

// True when the filename matches GitHub's generic account-wide usage report
// (e.g. "usageReport_1_<hash>.csv"), which lacks the Copilot-specific columns
// we require. The PRU and AIC reports share the same suffix but use distinct
// prefixes, so they are excluded here.
export function isGenericUsageReportFileName(fileName: string | null | undefined): boolean {
  const normalized = normalizeFileName(fileName)
  if (!normalized.startsWith(GENERIC_USAGE_REPORT_FILENAME_PREFIX)) return false
  if (normalized.startsWith(PRU_FILENAME_PREFIX)) return false
  // AIUsageReport starts with "ai", not "usage", so it never reaches this point.
  return true
}

export const GENERIC_USAGE_REPORT_ERROR_MESSAGE =
  'This looks like the generic GitHub usage report. Upload the Premium Request '
  + 'Usage Report (premiumRequestUsageReport_*.csv) or the AI Credit Usage Report '
  + '(AIUsageReport_*.csv) instead.'

