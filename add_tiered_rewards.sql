-- Add tiered rewards support to bounties table
-- This allows bounties to have multiple reward tiers instead of just one reward

-- Add column to enable/disable tiered rewards
ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS is_tiered_reward boolean DEFAULT false;

-- Add column to store tier configurations
ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS reward_tiers jsonb DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.bounties.is_tiered_reward IS 'Whether this bounty uses tiered rewards (1st, 2nd, 3rd place, etc.)';
COMMENT ON COLUMN public.bounties.reward_tiers IS 'Array of reward tiers with position, amount, token, and usd_equivalent for each tier';

-- Example of reward_tiers structure:
-- [
--   {"position": 1, "amount": 1000, "token": "USDC", "usd_equivalent": 1000},
--   {"position": 2, "amount": 750, "token": "USDC", "usd_equivalent": 750},
--   {"position": 3, "amount": 450, "token": "USDC", "usd_equivalent": 450},
--   {"position": 4, "amount": 200, "token": "USDC", "usd_equivalent": 200},
--   {"position": 5, "amount": 100, "token": "USDC", "usd_equivalent": 100}
-- ]

-- Update existing bounties to have tiered rewards disabled by default
UPDATE public.bounties 
SET is_tiered_reward = false 
WHERE is_tiered_reward IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bounties_tiered_reward ON public.bounties (is_tiered_reward);