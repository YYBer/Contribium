import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Info, Plus, X } from 'lucide-react'

interface RewardTier {
  position: number
  amount: number
  token: string
  usd_equivalent: number
}

interface TieredRewardConfigProps {
  totalReward: number
  onRewardChange: (reward: { amount: number; token: string; usd_equivalent: number }) => void
  onTieredRewardToggle: (enabled: boolean) => void
  onTiersChange: (tiers: RewardTier[]) => void
  isTieredReward: boolean
  tiers: RewardTier[]
}

export function TieredRewardConfig({ 
  totalReward, 
  onRewardChange, 
  onTieredRewardToggle, 
  onTiersChange,
  isTieredReward,
  tiers
}: TieredRewardConfigProps) {
  const [localTiers, setLocalTiers] = useState<RewardTier[]>(tiers.length > 0 ? tiers : [
    { position: 1, amount: 0, token: 'USDC', usd_equivalent: 0 },
    { position: 2, amount: 0, token: 'USDC', usd_equivalent: 0 },
    { position: 3, amount: 0, token: 'USDC', usd_equivalent: 0 },
  ])

  const handleTotalRewardChange = (amount: number) => {
    onRewardChange({
      amount,
      token: 'USD',
      usd_equivalent: amount
    })

    // Auto-distribute tiers if tiered rewards are enabled
    if (isTieredReward && amount > 0) {
      const percentages = [0.4, 0.25, 0.15, 0.10, 0.10] // 40%, 25%, 15%, 10%, 10%
      const newTiers = localTiers.map((tier, index) => ({
        ...tier,
        amount: Math.round(amount * (percentages[index] || 0.05)),
        usd_equivalent: Math.round(amount * (percentages[index] || 0.05))
      }))
      setLocalTiers(newTiers)
      onTiersChange(newTiers)
    }
  }

  const handleTierChange = (index: number, amount: number) => {
    const newTiers = [...localTiers]
    newTiers[index] = {
      ...newTiers[index],
      amount,
      usd_equivalent: amount
    }
    setLocalTiers(newTiers)
    onTiersChange(newTiers)
  }

  const addTier = () => {
    const newTier: RewardTier = {
      position: localTiers.length + 1,
      amount: 0,
      token: 'USDC',
      usd_equivalent: 0
    }
    const newTiers = [...localTiers, newTier]
    setLocalTiers(newTiers)
    onTiersChange(newTiers)
  }

  const removeTier = (index: number) => {
    const newTiers = localTiers.filter((_, i) => i !== index)
      .map((tier, i) => ({ ...tier, position: i + 1 }))
    setLocalTiers(newTiers)
    onTiersChange(newTiers)
  }

  const getPositionLabel = (position: number) => {
    if (position === 1) return '1st'
    if (position === 2) return '2nd'
    if (position === 3) return '3rd'
    return `${position}th`
  }

  const totalTierAmount = localTiers.reduce((sum, tier) => sum + tier.amount, 0)

  return (
    <div className="space-y-4">
      {/* Total Reward Amount */}
      <div className="space-y-2">
        <Label htmlFor="total-reward" className="text-theme-primary">
          Total Prize Pool (USD)
        </Label>
        <Input
          id="total-reward"
          type="number"
          value={totalReward || ''}
          onChange={(e) => handleTotalRewardChange(parseFloat(e.target.value) || 0)}
          placeholder="2500"
          className="input-theme input-theme-focus"
          required
          min="1"
          step="1"
        />
      </div>

      {/* Tiered Rewards Toggle */}
      <div className="flex items-center justify-between p-3 bg-theme-accent rounded-lg">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-theme-primary" />
          <div>
            <p className="text-sm font-medium text-theme-primary">Enable Tiered Rewards</p>
            <p className="text-xs text-theme-muted">Create multiple prize tiers (1st, 2nd, 3rd place, etc.)</p>
          </div>
        </div>
        <Switch
          checked={isTieredReward}
          onCheckedChange={onTieredRewardToggle}
        />
      </div>

      {/* Tier Configuration */}
      {isTieredReward && (
        <Card className="border-theme-secondary">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-theme-primary">Prize Tiers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTier}
                className="text-theme-primary border-theme-primary hover:bg-theme-accent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>

            <div className="space-y-3">
              {localTiers.map((tier, index) => (
                <div key={tier.position} className="flex items-center gap-3 p-3 bg-theme-accent/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <div className="w-6 h-6 rounded-full bg-theme-primary text-theme-primary-foreground flex items-center justify-center text-xs font-medium">
                      {tier.position}
                    </div>
                    <span className="text-sm font-medium text-theme-primary">
                      {getPositionLabel(tier.position)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={tier.amount || ''}
                      onChange={(e) => handleTierChange(index, parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="input-theme"
                      min="0"
                      step="1"
                    />
                  </div>
                  
                  <span className="text-sm text-theme-muted min-w-[50px]">USDC</span>
                  
                  {localTiers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTier(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Validation */}
            <div className="flex items-center justify-between p-3 bg-theme-accent rounded-lg">
              <span className="text-sm text-theme-primary">Total Tier Amount:</span>
              <span className={`text-sm font-medium ${
                totalTierAmount === totalReward 
                  ? 'text-green-600' 
                  : totalTierAmount > totalReward 
                    ? 'text-red-600' 
                    : 'text-orange-600'
              }`}>
                {totalTierAmount} / {totalReward} USDC
              </span>
            </div>

            {totalTierAmount !== totalReward && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                {totalTierAmount > totalReward 
                  ? 'Tier amounts exceed total prize pool' 
                  : 'Tier amounts are less than total prize pool'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="flex items-center gap-2 p-3 rounded bg-theme-accent">
        <Info className="h-4 w-4 text-theme-primary" />
        <p className="text-sm text-theme-primary">
          Payment will be made in $ALPH at the USD-equivalent value
        </p>
      </div>
    </div>
  )
}