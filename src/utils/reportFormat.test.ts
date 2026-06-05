import { describe, expect, it } from 'vitest'
import {
  detectReportFormatFromFileName,
  isGenericUsageReportFileName,
} from './reportFormat'

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

describe('isGenericUsageReportFileName', () => {
  it('flags the generic GitHub usage report export', () => {
    expect(isGenericUsageReportFileName('usageReport_1_c85d334da0944692a1dbd4ac37fdb4e8.csv')).toBe(true)
  })

  it('matches case-insensitively and tolerates whitespace', () => {
    expect(isGenericUsageReportFileName('USAGEREPORT.csv')).toBe(true)
    expect(isGenericUsageReportFileName('  usagereport_2.csv  ')).toBe(true)
  })

  it('does not flag the Premium Request Usage Report', () => {
    expect(isGenericUsageReportFileName('premiumRequestUsageReport_1_abc.csv')).toBe(false)
  })

  it('does not flag the AI Usage Report', () => {
    expect(isGenericUsageReportFileName('AIUsageReport_1_xyz.csv')).toBe(false)
  })

  it('does not flag unrelated filenames', () => {
    expect(isGenericUsageReportFileName('some-other-report.csv')).toBe(false)
    expect(isGenericUsageReportFileName(null)).toBe(false)
    expect(isGenericUsageReportFileName(undefined)).toBe(false)
    expect(isGenericUsageReportFileName('')).toBe(false)
  })
})
