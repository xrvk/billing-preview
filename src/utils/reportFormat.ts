export type ReportFormat = 'pru' | 'aic'

// Filename prefix used by the legacy Premium Request Usage Report export
// (e.g. "premiumRequestUsageReport_1_<hash>.csv"). Matched case-insensitively.
const PRU_FILENAME_PREFIX = 'premiumrequestusagereport'

// Detect the report format from the uploaded file's name. Falls back to 'aic'
// so the current AIC seat-count logic remains the default for unknown or
// missing filenames.
export function detectReportFormatFromFileName(fileName: string | null | undefined): ReportFormat {
  if (!fileName) return 'aic'
  const normalized = fileName.trim().toLowerCase()
  if (normalized.startsWith(PRU_FILENAME_PREFIX)) return 'pru'
  return 'aic'
}
