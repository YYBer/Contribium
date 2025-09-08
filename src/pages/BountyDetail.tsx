import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Globe, MessageSquare, AlertTriangle, Send } from 'lucide-react'
import { useTheme } from "@/contexts/ThemeContext"
import { useUser } from "@/contexts/UserContext"
import { supabase } from "@/lib/supabase"
import { Bounty } from "@/types/supabase"
import { BountyService } from "@/services/bounty.service"
import { SubmissionDialog } from '../components/SubmissionDialog'
import { TieredRewardDisplay } from '../components/TieredRewardDisplay'
import CommentSection from '../components/CommentSection'
import LoadingPage from "./LoadingPage"
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';

// Helper function to generate tiered rewards
function generateTiers(reward: { amount: number; token: string; usd_equivalent: number }) {
  const totalAmount = reward.amount
  
  // Default tier distribution percentages
  const tierPercentages = [
    { position: 1, percentage: 0.4 },   // 40% for 1st place
    { position: 2, percentage: 0.25 },  // 25% for 2nd place
    { position: 3, percentage: 0.15 },  // 15% for 3rd place
    { position: 4, percentage: 0.10 },  // 10% for 4th place
    { position: 5, percentage: 0.10 },  // 10% for 5th place
  ]
  
  return tierPercentages.map(tier => ({
    position: tier.position,
    amount: Math.round(totalAmount * tier.percentage),
    token: reward.token,
    usd_equivalent: Math.round(reward.usd_equivalent * tier.percentage)
  }))
}

export default function BountyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const { user } = useUser()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Cleanup function to reset state when component unmounts or id changes
  useEffect(() => {
    return () => {
      setBounty(null)
      setLoading(true)
      setImageError(false)
      setIsSubmitDialogOpen(false)
    }
  }, [id])

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBounty = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Reset state before fetching
      setBounty(null)
      setImageError(false)
      
      // Make sure to fetch sponsor details by using the join syntax
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          sponsor:sponsors(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Verify sponsor data is available
      if (!data.sponsor) {
        console.warn('Sponsor data not retrieved with bounty:', data.id)
      }
      
      setBounty(data)
    } catch (error) {
      console.error('Error fetching bounty:', error)
      toast.error("Failed to load bounty details")
      setBounty(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  // Fetch bounty data including sponsor details
  useEffect(() => {
    fetchBounty()
    
    // Add debug function to window for testing
    if (id) {
      (window as any).debugSubmissionCount = () => BountyService.debugSubmissionCount(id)
    }
  }, [fetchBounty, id])

  // Refetch data when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      // Refetch data when the page becomes visible again
      if (!document.hidden && id) {
        fetchBounty()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [fetchBounty])

  const handleSubmitOpen = () => {
    if (!user) {
      toast.error("Please sign in to submit")
      navigate('/auth', { state: { returnPath: `/bounty/${id}` } })
      return
    }
    
    // Make sure bounty has sponsor data before opening dialog
    if (!bounty?.sponsor) {
      toast.error("Sponsor information is missing. Please refresh the page.")
      return
    }
    
    setIsSubmitDialogOpen(true)
  }

  const handleSubmissionComplete = async () => {
    if (!id) return

    try {
      // Add a longer delay to ensure submission count update completes
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Refreshing bounty data after submission...')
      
      // Refresh bounty data after submission
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          sponsor:sponsors(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      console.log('Updated bounty data:', data)
      console.log('Submission count:', data.current_submissions)
      
      setBounty(data)
      // toast.success("Your submission has been received!")
      toast.success("Your submission has been received!", {
        duration: 4000,
        icon: '🎉',
        // Additional styling to make it even more beautiful
        style: {
          padding: '16px 24px',
          fontWeight: '500',
        },
      })
    } catch (error) {
      console.error('Error refreshing bounty:', error)
    }
  }

  const timeRemaining = () => {
    if (!bounty?.end_date) return "N/A"
    
    try {
      const now = new Date()
      const deadline = new Date(bounty.end_date)
      
      if (isNaN(deadline.getTime())) {
        return "Invalid date"
      }
      
      const diff = deadline.getTime() - now.getTime()
      
      if (diff < 0) {
        return "Expired"
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${days}d:${hours}h:${minutes}m`
    } catch (error) {
      console.error('Error calculating time remaining:', error)
      return "Error"
    }
  }

  const handleContactClick = () => {
    const twitterHandle = bounty?.sponsor?.twitter_handle
    const url = twitterHandle ? `https://x.com/${twitterHandle}` : 'https://x.com/'
    window.open(url, '_blank')
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!bounty) {
    return (
      <div className={`min-h-screen bg-theme-primary flex items-center justify-center text-theme-primary`}>
        Bounty not found
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-theme-primary`}>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className={`bg-theme-primary border-theme-primary`}>
              <TieredRewardDisplay
                totalReward={bounty.reward}
                tiers={bounty.is_tiered_reward && bounty.reward_tiers ? bounty.reward_tiers : generateTiers(bounty.reward)}
                submissions={bounty.current_submissions}
                timeRemaining={timeRemaining()}
                onSubmit={handleSubmitOpen}
              />
            </Card>

            <Card className={`bg-theme-primary border-theme-primary`}>
              <CardContent className="p-4">
                <h3 className={`font-bold text-theme-primary mb-3`}>SKILLS NEEDED</h3>
                <div className="flex flex-wrap gap-2">
                  {[bounty.category].map((skill) => (
                    <Badge 
                      key={skill}
                      variant="secondary" 
                      className="bg-[#C1A461]/20 text-[#C1A461]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-theme-primary border-theme-primary`}>
              <CardContent className="p-4">
                <h3 className={`font-bold text-theme-primary mb-3`}>CONTACT</h3>
                <Button 
                  className="bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
                  onClick={handleContactClick}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Contact Sponsor
                </Button>
              </CardContent>
            </Card>

          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex items-center">
              {bounty.sponsor && (
                (bounty.sponsor.profile_photos && bounty.sponsor.profile_photos.length > 0) ||
                bounty.sponsor.logo_url
              ) && !imageError ? (
                <img 
                  className="mr-2 h-12 w-12 rounded-md object-cover md:h-16 md:w-16" 
                  alt={bounty.sponsor.name || 'Sponsor'} 
                  src={
                    bounty.sponsor.profile_photos && bounty.sponsor.profile_photos.length > 0 
                      ? bounty.sponsor.profile_photos[0] 
                      : bounty.sponsor.logo_url || ''
                  }
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="mr-2 h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center md:h-16 md:w-16">
                  <span className="text-gray-500 dark:text-gray-300 font-semibold">
                    {bounty.sponsor?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-start gap-1">
                <div className="flex gap-1">
                  <div className="flex md:hidden">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-700 dark:text-[#C1A461]">
                      {bounty.title}
                    </h1>
                  </div>
                  <div className="hidden md:flex">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-700 dark:text-[#C1A461] sm:text-xl">
                      {bounty.title}
                    </h1>
                  </div>
                </div>
                <div className="flex md:hidden">
                  <div className="flex items-center gap-2">
                    {bounty.sponsor && bounty.sponsor.id ? (
                      <Link to={`/sponsor/${bounty.sponsor.id}`}>
                        <p className="text-sm font-medium text-slate-500 hover:underline">
                          by {bounty.sponsor.name || 'Unknown Sponsor'}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-slate-500">
                        by Unknown Sponsor
                      </p>
                    )}
                    <span className="text-slate-400">•</span>
                    <p className="text-sm text-slate-400">{bounty.current_submissions} submissions</p>
                  </div>
                </div>
                <div className="hidden md:flex">
                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                    <div className="flex items-center gap-1">
                      {bounty.sponsor && bounty.sponsor.id ? (
                        <Link to={`/sponsor/${bounty.sponsor.id}`}>
                          <p className="max-w-[200px] overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-500 hover:underline">
                            by {bounty.sponsor.name || 'Unknown Sponsor'}
                          </p>
                        </Link>
                      ) : (
                        <p className="max-w-[200px] overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-500">
                          by Unknown Sponsor
                        </p>
                      )}
                    </div>
                    <span className="font-medium text-[#E2E8EF]">|</span>
                    <div className="flex">
                      <div className="flex items-center gap-1">
                        <svg className="size-3 fill-slate-400" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3.57848 9.37923C3.57848 9.91177 4.26916 10.1209 4.56456 9.67779L7.80495 4.81721C8.04341 4.45952 7.787 3.98041 7.35711 3.98041H4.77457V0.973754C4.77457 0.441218 4.08389 0.232096 3.78849 0.675193L0.548099 5.53578C0.30964 5.89347 0.566053 6.37258 0.99594 6.37258H3.57848V9.37923Z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-400">Bounty</p>
                      </div>
                    </div>
                    <span className="font-medium text-[#E2E8EF] hidden sm:flex">|</span>
                    <div className="hidden sm:flex">
                      <div className="flex items-center gap-1 rounded-full py-1 text-xs font-medium whitespace-nowrap sm:gap-2 sm:text-sm text-green-600">
                        <div className="relative flex items-center justify-center">
                          <div className="flex items-center justify-center rounded-full" style={{width: '3px', height: '3px', backgroundColor: 'rgb(154, 230, 180)', opacity: 0.8, animation: '1250ms ease 0s infinite normal none running pulse'}}></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-1" style={{backgroundColor: 'rgb(22, 163, 74)'}}></div>
                        </div>
                        <p className="hidden sm:flex">
                          {bounty.status === 'open' ? 'Submissions Open' : 'Submissions Closed'}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-[#E2E8EF]">|</span>
                    <div className="flex items-center gap-0.5">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="rounded-full text-sm font-medium whitespace-nowrap text-slate-400">Global</span>
                    </div>
                    <span className="font-medium text-[#E2E8EF] hidden sm:flex">|</span>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 fill-slate-600 text-slate-500" />
                        <p className="text-sm text-slate-400">{bounty.current_submissions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className={`bg-theme-primary border-b border-theme-primary w-full justify-start rounded-none p-0 h-auto`}>
                {["Details"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className={`rounded-none border-b-2 border-transparent data-[state=active]:border-[#C1A461] data-[state=active]:bg-transparent text-theme-muted data-[state=active]:text-theme-primary px-4 py-2`}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="py-6 space-y-8">
                <section>
                  <h2 className={`text-lg font-bold text-theme-primary mb-4 font-sentient`}>About The Bounty</h2>
                  <p className={`text-theme-secondary`}>
                    {bounty.description}
                  </p>
                </section>

                <section>
                  <h2 className={`text-lg font-bold text-theme-primary mb-4 font-sentient`}>Requirements</h2>
                  {typeof bounty.requirements === 'string' ? (
                    <p className={`text-theme-secondary`}>{bounty.requirements}</p>
                  ) : (
                    <ul className={`space-y-2 text-theme-secondary`}>
                      {Array.isArray(bounty.requirements) ? 
                        (bounty.requirements as string[]).map((req, index) => (
                          <li key={index}>{req}</li>
                        )) : 
                        <li>No requirements specified</li>
                      }
                    </ul>
                  )}
                </section>

                <section>
                  <h2 className={`text-lg font-bold text-theme-primary mb-4 font-sentient`}>Reward</h2>
                  <p className={`text-theme-secondary`}>
                    {bounty.reward.amount} {bounty.reward.token}
                  </p>
                </section>

                <section>
                  <h2 className={`text-lg font-bold text-theme-primary mb-4 font-sentient`}>Timeline</h2>
                  <p className={`text-theme-secondary`}>
                    End Date: {new Date(bounty.end_date).toLocaleDateString()}
                  </p>
                </section>

                <section>
                  <div className={`flex items-center gap-2 mb-4 text-theme-primary`}>
                    <div className="flex-1">
                    <CommentSection
                      bountyId={bounty.id}
                      sponsorId={bounty.sponsor_id}
                      user={user}
                      theme={theme}
                    />
                    </div>
                  </div>
                </section>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Submit Dialog */}
      {bounty && user && (
        <SubmissionDialog 
          bounty={bounty}
          userId={user.id}
          isOpen={isSubmitDialogOpen}
          onClose={() => setIsSubmitDialogOpen(false)}
          onSubmissionComplete={handleSubmissionComplete}
        />
      )}
    </div>
  )
}