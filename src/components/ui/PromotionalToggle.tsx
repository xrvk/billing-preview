import { InfoTip } from '../InfoTip'

export type PromotionalToggleProps = {
  includePromotional: boolean
  onChange: (includePromotional: boolean) => void
  disabled?: boolean
  className?: string
}

// Header-mounted toggle that controls whether the simulation applies
// promotional amounts (per-seat included AI credits for Business/Enterprise
// plans and flex allotment for individual plans). Default is on.
//
// When off, the pipeline runs as if no promotional credits were available, so
// totals reflect the worst-case bill without the current promotional period.
export function PromotionalToggle({
  includePromotional,
  onChange,
  disabled = false,
  className = '',
}: PromotionalToggleProps) {
  const trackOn = 'bg-bg-success-emphasis'
  const trackOff = 'bg-neutral-emphasis'
  const trackBase = 'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2'
  const thumbBase = 'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform mt-[2px]'

  return (
    <div className={`flex items-center gap-2 text-sm text-white ${className}`.trim()}>
      <button
        type="button"
        role="switch"
        aria-checked={includePromotional}
        aria-label={includePromotional ? 'Including promotional amounts' : 'Excluding promotional amounts'}
        onClick={() => onChange(!includePromotional)}
        disabled={disabled}
        className={`${trackBase} ${includePromotional ? trackOn : trackOff} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`.trim()}
      >
        <span
          aria-hidden="true"
          className={`${thumbBase} ${includePromotional ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
        />
      </button>
      <span className="text-white/90 max-sm:hidden">Include promotional amounts</span>
      <span className="text-white/90 sm:hidden" aria-hidden="true">Promo</span>
      <InfoTip
        text="Promotional amounts are the per-seat included AI credits GitHub currently provides with Business and Enterprise seats, and the flex allotment included with individual plans. Turn this off to simulate a bill without those credits. Note: rows that ship a pre-allocated discount from GitHub cannot be un-discounted client side."
      />
    </div>
  )
}
