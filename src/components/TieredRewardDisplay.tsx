import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RewardTier {
  position: number
  amount: number
  token: string
  usd_equivalent: number
}

interface TieredRewardDisplayProps {
  totalReward: {
    amount: number
    token: string
    usd_equivalent: number
  }
  tiers: RewardTier[]
  submissions: number
  timeRemaining: string
  onSubmit: () => void
}

export function TieredRewardDisplay({ 
  totalReward, 
  tiers, 
  submissions, 
  timeRemaining, 
  onSubmit 
}: TieredRewardDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleTiers = isExpanded ? tiers : tiers.slice(0, 3)
  const hasMoreTiers = tiers.length > 3

  const getPositionLabel = (position: number) => {
    if (position === 1) return '1st'
    if (position === 2) return '2nd'
    if (position === 3) return '3rd'
    return `${position}th`
  }

  return (
    <div className="p-4 space-y-4">
      {/* Total Prize Pool */}
      <div>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <span className="text-theme-primary">🏆</span>
          <span className="text-theme-primary">{totalReward.amount} {totalReward.token}</span>
        </div>
        <div className="text-sm text-theme-muted">
          ${totalReward.usd_equivalent} USD Total Prize Pool
        </div>
      </div>

      {/* Prize Tiers */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-theme-primary mb-2">Prize Distribution</div>
        <div className="relative">
          {visibleTiers.map((tier, index) => (
            <div key={tier.position} className="relative flex items-center gap-3 py-2">
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-theme-primary/20 border-2 border-theme-primary">
                  <div className="w-full h-full rounded-full bg-theme-primary"></div>
                </div>
                {/* Connecting line */}
                {index < visibleTiers.length - 1 && (
                  <div className="absolute left-1/2 top-3 w-px h-8 bg-theme-primary/30 -translate-x-1/2"></div>
                )}
              </div>
              
              {/* Prize info */}
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-theme-muted">
                    {getPositionLabel(tier.position)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-theme-primary">{tier.amount}</span>
                  <span className="text-sm text-theme-muted">{tier.token}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show more/less button */}
          {hasMoreTiers && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-3 h-3 rounded-full bg-theme-primary/20 border-2 border-theme-primary">
                <div className="w-full h-full rounded-full bg-theme-primary"></div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-theme-muted hover:text-theme-primary p-0 h-auto"
              >
                <span className="text-sm">
                  {isExpanded ? 'Show less' : `+${tiers.length - 3} more prizes`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-theme-muted">Submissions</span>
          <span className="text-theme-primary font-bold">{submissions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-theme-muted">Remaining</span>
          <div className="flex items-center gap-2 text-theme-primary">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        className="w-full border-[#C1A461]/20 bg-amber-500 hover:bg-amber-600 text-gray-900 dark:text-[#1B2228]"
        onClick={onSubmit}
      >
        Submit
      </Button>
    </div>
  )
}