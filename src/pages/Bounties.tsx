import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Compass, Search, Anchor, MapPin, Ship, Filter } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Bounty, Status } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom';

export function Bounties() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedStatus, setSelectedStatus] = useState<Status>('open')
  const [searchQuery, setSearchQuery] = useState('')

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBounties = useCallback(async () => {
    try {
      setLoading(true)
      
      // Clear existing bounties before fetching
      setBounties([])
      
      // Fetch all bounties and calculate their real-time status
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          sponsor:sponsors(id, name, is_verified)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate real-time status for each bounty and filter
      const currentTime = new Date()
      const filteredBounties = (data || []).filter((bounty) => {
        const dueDate = new Date(bounty.end_date as string)
        const calculatedStatus = dueDate >= currentTime ? 'open' : 'completed'
        
        return calculatedStatus === selectedStatus
      })
      
      setBounties(filteredBounties || [])
    } catch (error) {
      console.error('Error fetching bounties:', error)
      toast.error('Failed to load bounties')
      setBounties([]) // Reset bounties on error
    } finally {
      setLoading(false)
    }
  }, [selectedStatus])

  // Refetch data when component mounts or status changes
  useEffect(() => {
    fetchBounties()
  }, [fetchBounties])

  // Refetch data when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      // Refetch data when the page becomes visible again
      if (!document.hidden) {
        fetchBounties()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [fetchBounties])

  const categoryFilters = ["All", "Content", "Design", "Development", "Other"]

  const filteredBounties = bounties.filter(bounty => {
    const matchesCategory = selectedCategory === "All" || 
      bounty.category.toLowerCase() === selectedCategory.toLowerCase()
    
    const matchesSearch = searchQuery === '' || 
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.sponsor?.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const getTimeRemaining = (dueDate: string) => {
    const remaining = new Date(dueDate).getTime() - new Date().getTime()
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    
    if (selectedStatus === 'completed' || remaining < 0) {
      const expiredDays = Math.abs(days)
      return expiredDays === 0 ? 'Today' : `${expiredDays}d ago`
    }
    
    return days === 0 ? 'Today' : `${days}d`
  }

  return (
    <div className="min-h-screen bg-theme-primary w-full px-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary font-sentient">Bounty Board</h1>
            <p className="text-theme-muted">Discover and complete bounties to earn rewards</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-theme-muted" />
              <Input
                placeholder="Search bounties..."
                className="pl-9 input-theme"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categoryFilters.map((filter) => (
                <Button 
                  key={filter}
                  variant="outline" 
                  className={`rounded-full btn-theme-secondary
                    ${selectedCategory === filter ? 'bg-theme-accent text-theme-accent' : ''}`}
                  onClick={() => setSelectedCategory(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Bounties List */}
        <Card className="card-theme-secondary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-theme-primary" />
                <h2 className="font-bold text-theme-primary">Available Bounties</h2>
              </div>
              <span className="text-theme-muted">{filteredBounties.length} bounties</span>
            </div>

            <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Status)} className="w-full">
              <TabsList className={`grid w-full max-w-[400px] grid-cols-2 mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#AC8C43]'}`}>
                {["open", "completed"].map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab as Status}
                    className={`${theme === 'dark' ? 'data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900' : 'data-[state=active]:bg-[#C1A461] data-[state=active]:text-white text-white/70'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 loading-spinner" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBounties.length === 0 ? (
                    <div className="text-center py-8 text-theme-muted">
                      No bounties found
                    </div>
                  ) : (
                    filteredBounties.map((bounty) => (
                      <Card key={bounty.id} className="card-theme-secondary">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 bg-theme-accent rounded-lg flex items-center justify-center">
                              <Ship className="text-theme-primary" />
                            </div>
                            <div>
                              <h3 
                                className="font-medium text-theme-primary hover:underline cursor-pointer transition-all"
                                onClick={() => navigate(`/bounty/${bounty.id}`)}
                              >
                                {bounty.title}
                              </h3>
                              {bounty.sponsor?.id ? (
                                    <Link to={`/sponsor/${bounty.sponsor.id}`}>
                                      <div className="flex items-center gap-1 text-sm text-theme-secondary">
                                        <span className="hover:underline transition-all">
                                          {bounty.sponsor?.name || 'Unknown Sponsor'}
                                        </span>
                                        {bounty.sponsor?.is_verified && (
                                          <Badge 
                                            variant="secondary" 
                                            className="badge-theme-primary"
                                          >
                                            <Anchor className="w-3 h-3 mr-1" />
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className="flex items-center gap-1 text-sm text-theme-secondary">
                                      Unknown Sponsor
                                    </div>
                                  )}
                              <div className="flex items-center gap-4 text-sm text-theme-muted mt-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{bounty.category}</span>
                                </div>
                                <span>{selectedStatus === 'completed' ? 'Expired' : 'Due in'} {getTimeRemaining(bounty.end_date)}</span>
                                {bounty.current_submissions > 0 && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{bounty.current_submissions}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <span className="text-theme-primary">◈</span>
                                <span className="font-medium text-theme-primary">{bounty.reward.amount} {bounty.reward.token}</span>
                              </div>
                              <span className="text-sm text-theme-muted">${bounty.reward.usd_equivalent}</span>
                            </div>
                            <Button 
                              variant="outline"
                              className="btn-theme-secondary"
                              onClick={() => navigate(`/bounty/${bounty.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}