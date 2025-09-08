import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExternalLink, MessageSquare, Globe, CircleDollarSign, BarChart3 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { Sponsor, Bounty } from '@/types/supabase'

export default function SponsorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme } = useTheme()
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bounties' | 'about'>(() => {
    const tab = searchParams.get('tab')
    return (tab === 'about' || tab === 'bounties') ? tab : 'bounties'
  })


  // Handle tab changes and sync with URL
  const handleTabChange = (newTab: 'bounties' | 'about') => {
    setActiveTab(newTab)
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', newTab)
    setSearchParams(newSearchParams, { replace: true })
  }

  // Sync tab state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const tab = searchParams.get('tab')
    const validTab = (tab === 'about' || tab === 'bounties') ? tab : 'bounties'
    if (validTab !== activeTab) {
      setActiveTab(validTab)
    }
  }, [searchParams, activeTab])

  // Reset state when component unmounts or id changes
  useEffect(() => {
    return () => {
      setSponsor(null)
      setBounties([])
      setLoading(true)
    }
  }, [id])

  useEffect(() => {
    const fetchSponsorData = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Reset state before fetching
        setSponsor(null)
        setBounties([])
        
        // Fetch sponsor profile
        const { data: sponsorData, error: sponsorError } = await supabase
          .from('sponsors')
          .select('*')
          .eq('id', id)
          .single()

        if (sponsorError) throw sponsorError
        setSponsor(sponsorData as unknown as Sponsor)

        // Fetch bounties
        const { data: bountiesData, error: bountiesError } = await supabase
          .from('bounties')
          .select('*')
          .eq('sponsor_id', id)
          .order('created_at', { ascending: false })

        if (bountiesError) throw bountiesError
        setBounties((bountiesData || []) as unknown as Bounty[])

      } catch (error) {
        console.error('Error fetching sponsor data:', error)
        toast.error('Failed to load sponsor profile')
        // Reset state on error
        setSponsor(null)
        setBounties([])
      } finally {
        setLoading(false)
      }
    }

    fetchSponsorData()
  }, [id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTimeRemaining = (dueDate: string) => {
    const remaining = new Date(dueDate).getTime() - new Date().getTime()
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    
    if (remaining < 0) {
      const expiredDays = Math.abs(days)
      return expiredDays === 0 ? 'Ended today' : `Ended ${expiredDays}d ago`
    }
    
    return days === 0 ? 'Ends today' : `${days}d remaining`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sponsor-primary" />
      </div>
    )
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sponsor-secondary">Sponsor not found.</p>
          <Button
            onClick={() => navigate('/bounties')}
            className="btn-sponsor-primary"
          >
            Back to Bounties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Header with gradient */}
      <div className="h-64 gradient-sponsor-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        {sponsor.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <img 
              src={sponsor.logo_url} 
              alt={sponsor.name} 
              className="max-h-full object-contain"
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 -mt-32">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-end gap-6">
              <Avatar className="w-40 h-40 border-6 border-white rounded-full bg-white shadow-2xl">
                <AvatarImage src={sponsor.logo_url || undefined} />
                <AvatarFallback className="text-3xl text-sponsor-primary bg-sponsor-primary/10">
                  {sponsor.name?.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-sponsor-secondary font-sentient">
                    {sponsor.name}
                  </h1>
                  {sponsor.is_verified && (
                    <Badge className="badge-sponsor-success text-base px-3 py-1">Verified</Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg mt-2">
                  {sponsor.description || 'A sponsor on the Alephium platform'}
                </p>
                
                {/* Social Links */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {sponsor.website_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="btn-sponsor-outline-primary"
                      onClick={() => window.open(sponsor.website_url!, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </Button>
                  )}
                  {sponsor.twitter_handle && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="btn-sponsor-outline-accent"
                      onClick={() => window.open(`https://x.com/${sponsor.twitter_handle}`, '_blank')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                  )}
                  {sponsor.github_handle && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="btn-sponsor-outline-primary"
                      onClick={() => window.open(`https://github.com/${sponsor.github_handle}`, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  )}
                  {sponsor.discord_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="btn-sponsor-outline-accent"
                      onClick={() => window.open(sponsor.discord_url!, '_blank')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Discord
                    </Button>
                  )}
                </div>
              </div>
            </div>
{/*             
            <div className="flex flex-wrap gap-3 mt-2">
              {sponsor.website_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${borderColor} ${textColor} ${hoverBg}`}
                  onClick={() => window.open(sponsor.website_url!, '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </Button>
              )}
              {sponsor.twitter_handle && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${borderColor} ${textColor} ${hoverBg}`}
                  onClick={() => window.open(`https://twitter.com/${sponsor.twitter_handle}`, '_blank')}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              )}
              {sponsor.github_handle && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${borderColor} ${textColor} ${hoverBg}`}
                  onClick={() => window.open(`https://github.com/${sponsor.github_handle}`, '_blank')}
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              )}
              {sponsor.discord_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${borderColor} ${textColor} ${hoverBg}`}
                  onClick={() => window.open(sponsor.discord_url!, '_blank')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discord
                </Button>
              )}
            </div> */}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-sponsor group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sponsor-primary rounded-xl flex items-center justify-center group-hover:bg-sponsor-secondary transition-all duration-300">
                    <CircleDollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Total Bounties</p>
                    <h3 className="text-3xl font-bold text-sponsor-secondary">
                      {sponsor.total_bounties_count}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-sponsor group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sponsor-accent rounded-xl flex items-center justify-center group-hover:bg-sponsor-accent/90 transition-all duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Total Projects</p>
                    <h3 className="text-3xl font-bold text-sponsor-secondary">
                      {sponsor.total_projects_count}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-sponsor group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sponsor-secondary rounded-xl flex items-center justify-center group-hover:bg-sponsor-primary transition-all duration-300">
                    <CircleDollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Total Rewards</p>
                    <h3 className="text-3xl font-bold text-sponsor-secondary">
                      {formatCurrency(sponsor.total_reward_amount)}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Content */}
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'bounties' | 'about')}>
            <TabsList className="bg-white border-b border-sponsor-primary/20 w-full justify-start rounded-none p-0 h-auto shadow-sm">
              <TabsTrigger
                value="bounties"
                className="rounded-none border-b-3 border-transparent data-[state=active]:border-sponsor-primary data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-sponsor-primary px-6 py-4 font-medium"
              >
                Active Bounties
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-none border-b-3 border-transparent data-[state=active]:border-sponsor-primary data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-sponsor-primary px-6 py-4 font-medium"
              >
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bounties" className="pt-8">
              {bounties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No active bounties at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {bounties.map((bounty) => (
                    <Card 
                      key={bounty.id} 
                      className="card-sponsor cursor-pointer hover:border-sponsor-primary hover:shadow-xl transition-all duration-300"
                      onClick={() => navigate(`/bounty/${bounty.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-medium text-sponsor-secondary">{bounty.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge variant="outline" className="badge-sponsor-primary">
                                {bounty.category}
                              </Badge>
                              {bounty.tags && bounty.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="mt-4 text-gray-600 line-clamp-2">
                              {bounty.description}
                            </p>
                            <div className="flex items-center gap-6 mt-4">
                              <span className="text-gray-600">
                                Due in {getTimeRemaining(bounty.end_date)}
                              </span>
                              <span className="text-gray-600">
                                {bounty.current_submissions} submissions
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end ml-6">
                            <div className="flex items-center gap-1 text-2xl font-bold">
                              <span className="text-sponsor-primary">◈</span>
                              <span className="text-sponsor-primary">{bounty.reward.amount}</span>
                            </div>
                            <span className="text-gray-600">{bounty.reward.token}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-4 btn-sponsor-outline-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/bounty/${bounty.id}`);
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="pt-8">
              <Card className="card-sponsor">
                <CardHeader className="border-b border-sponsor-primary/20">
                  <CardTitle className="text-sponsor-secondary font-sentient text-2xl">About {sponsor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-6">
                  {sponsor.description ? (
                    <div>
                      <h3 className="text-lg font-medium text-sponsor-secondary mb-3">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{sponsor.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600">No additional information available about this sponsor.</p>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium text-sponsor-secondary mb-4">Sponsor Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sponsor-primary font-medium">Joined</p>
                        <p className="text-gray-600">
                          {new Date(sponsor.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sponsor-primary font-medium">Status</p>
                        <div className="flex items-center gap-2">
                          <Badge className={sponsor.is_verified ? 
                            "badge-sponsor-success" : 
                            "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                          }>
                            {sponsor.is_verified ? 'Verified' : 'Pending Verification'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sponsor-primary font-medium">Total Bounties</p>
                        <p className="text-gray-600">{sponsor.total_bounties_count}</p>
                      </div>
                      <div>
                        <p className="text-sponsor-primary font-medium">Total Projects</p>
                        <p className="text-gray-600">{sponsor.total_projects_count}</p>
                      </div>
                      <div>
                        <p className="text-sponsor-primary font-medium">Total Reward Amount</p>
                        <p className="text-gray-600">{formatCurrency(sponsor.total_reward_amount)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-sponsor-secondary mb-4">Contact & Social</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sponsor.website_url && (
                        <div>
                          <p className="text-sponsor-primary font-medium">Website</p>
                          <a 
                            href={sponsor.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-sponsor-primary flex items-center gap-1 transition-colors"
                          >
                            {sponsor.website_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {sponsor.twitter_handle && (
                        <div>
                          <p className="text-sponsor-primary font-medium">Twitter</p>
                          <a 
                            href={`https://x.com/${sponsor.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-sponsor-accent flex items-center gap-1 transition-colors"
                          >
                            @{sponsor.twitter_handle}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {sponsor.github_handle && (
                        <div>
                          <p className="text-sponsor-primary font-medium">GitHub</p>
                          <a 
                            href={`https://github.com/${sponsor.github_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-sponsor-primary flex items-center gap-1 transition-colors"
                          >
                            @{sponsor.github_handle}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {sponsor.discord_url && (
                        <div>
                          <p className="text-sponsor-primary font-medium">Discord</p>
                          <a 
                            href={sponsor.discord_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-sponsor-accent flex items-center gap-1 transition-colors"
                          >
                            Join Discord
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}