import { appLinks } from '../../config/links'

type PromotionalDataDisclaimerProps = {
  scope?: 'individual' | 'organization'
  excluded?: boolean
  className?: string
}

export function PromotionalDataDisclaimer({
  scope = 'individual',
  excluded = false,
  className = '',
}: PromotionalDataDisclaimerProps) {
  const href = scope === 'organization'
    ? appLinks.promotionalAmountsDocs
    : appLinks.flexAllotmentDocs
  const message = scope === 'organization'
    ? (excluded
      ? 'Promotional amounts are excluded from this simulation.'
      : 'Promotional amounts are used in this simulation.')
    : (excluded
      ? 'Flex allotment is excluded from this simulation.'
      : 'Flex allotment is used in this simulation.')
  const linkText = scope === 'organization'
    ? 'Learn more about promotional amounts.'
    : 'Learn more about flex allotment.'

  return (
    <p className={`m-0 mt-1 text-[12px] text-fg-muted leading-normal ${className}`.trim()}>
      {message}{` `}
      <a
        href={href}
        className="text-fg-accent no-underline hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkText}
      </a>
    </p>
  )
}
