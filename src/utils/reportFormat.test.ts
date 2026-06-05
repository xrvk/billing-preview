import { describe, expect, it } from 'vitest'
import { detectReportFormatFromFileName } from './reportFormat'

describe('detectReportFormatFromFileName', () => {
  it('returns pru for premiumRequestUsageReport filenames', () => {
    expect(detectReportFormatFromFileName('premiumRequestUsageReport_1_abc.csv')).toBe('pru')
  })

  it('matches the prefix case-insensitively', () => {
    expect(detectReportFormatFromFileName('PREMIUMREQUESTUSAGEREPORT.csv')).toBe('pru')
    expect(detectReportFormatFromFileName('premiumrequestusagereport_2.csv')).toBe('pru')
  })

  it('tolerates leading and trailing whitespace', () => {
    expect(detectReportFormatFromFileName('  premiumRequestUsageReport.csv  ')).toBe('pru')
  })

  it('returns aic for AIUsageReport filenames', () => {
    expect(detectReportFormatFromFileName('AIUsageReport_1_xyz.csv')).toBe('aic')
  })

  it('falls back to aic for unknown filenames', () => {
    expect(detectReportFormatFromFileName('some-other-report.csv')).toBe('aic')
  })

  it('falls back to aic for null, undefined, or empty filenames', () => {
    expect(detectReportFormatFromFileName(null)).toBe('aic')
    expect(detectReportFormatFromFileName(undefined)).toBe('aic')
    expect(detectReportFormatFromFileName('')).toBe('aic')
  })

  it('does not match filenames where the prefix appears mid-name', () => {
    expect(detectReportFormatFromFileName('copy_of_premiumRequestUsageReport.csv')).toBe('aic')
  })
})
