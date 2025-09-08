import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Card, CardContent } from "../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { MessageSquare, Compass, Anchor, MapPin, Ship } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Bounty, Status } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Link } from "react-router-dom";

export default function Home() {
  // const { session } = useSession();

  const { user} = useUser() 
  // console.log(user)
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("All Quests")
  const [selectedStatus, setSelectedStatus] = useState<Status>('open')


  // Cleanup function to reset state when component unmounts
  useEffect(() => {
    return () => {
      setBounties([])
      setLoading(true)
    }
  }, [])

  // Memoized fetch function for bounties
  const fetchBounties = useCallback(async () => {
    try {
      console.log('Home: Fetching bounties for status:', selectedStatus)
      setLoading(true)
      
      // Reset state before fetching
      setBounties([])
      
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          sponsor:sponsors(*)
        `)
        .eq('status', selectedStatus)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Home: Raw bounties data:', data)
      console.log('Home: Number of bounties found:', data?.length || 0)

      const updatedBounties = await Promise.all(data.map(async (bounty) => {
        if (bounty.status !== 'completed' && new Date(bounty.end_date) < new Date()) {
          const { error: updateError } = await supabase
            .from('bounties')
            .update({ status: 'completed' })
            .eq('id', bounty.id)

          if (updateError) {
            console.error('Error updating bounty status:', updateError)
            return bounty
          }

          return { ...bounty, status: 'completed' }
        }

        return bounty
      }))

      console.log('Home: Final bounties to set:', updatedBounties)
      setBounties(updatedBounties)
    } catch (error) {
      console.error('Home: Error fetching bounties:', error)
      toast.error('Failed to load bounties')
      setBounties([]) // Reset on error
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, setLoading])
  
  // Fetch bounties
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
    
      // Add debug function to test bounty fetching
      ;(window as any).testBountyFetch = fetchBounties
  }, [selectedStatus])

  const getInitials = (name: string | null) => {
    if (!name) return 'GU'
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
  }

  const categoryFilters = ["All Quests", "Content", "Design", "Development", "Other"]

  const filteredBounties = bounties.filter(bounty => {
    if (selectedCategory === "All Quests") return true
    return bounty.category.toLowerCase() === selectedCategory.toLowerCase()
  })

  // Calculate time remaining
  const getTimeRemaining = (dueDate: string) => {
    const remaining = new Date(dueDate).getTime() - new Date().getTime()
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    return `${days}d`
  }

  return (
    <div className={`min-h-screen bg-theme-primary w-full px-4`}>
      <div className="max-w-7xl mx-auto">
        <main>
          {/* Welcome Card */}
          <Card className={`${theme === 'dark' ? 
            'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-theme-primary' : 
            'bg-[#C1A461] border-2 border-[#C1A461]'} 
            shadow-lg shadow-[#AC8C43]/20 mb-6`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-[#c3a95a]">
                  {user?.avatar_url ? (
                    <AvatarImage
                      src={user?.avatar_url}
                      alt={user?.full_name || 'User avatar'}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  ) : (
                    <AvatarFallback className="bg-theme-accent text-theme-primary">
                      {getInitials(user?.full_name || null)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-theme-primary' : 'text-white'} font-sentient`}>
                    Welcome aboard, Captain {user?.full_name || 'Guest'}
                  </h1>
                  <p className={`${theme === 'dark' ? 'text-theme-primary' : 'text-white/90'}`}>Your next adventure awaits on $ALPH Bounty Lands</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categoryFilters.map((filter) => (
                <Button 
                  key={filter}
                  variant="outline" 
                  className={`rounded-full btn-theme-secondary 
                    ${selectedCategory === filter ? 
                      theme === 'dark' ? 'bg-theme-accent text-theme-primary' : 'bg-amber-100 text-amber-700' 
                      : ''}`}
                  onClick={() => setSelectedCategory(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Quests Card */}
            <Card className={`card-theme-secondary`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className={`w-6 h-6 text-theme-primary`} />
                  <h2 className={`font-bold text-theme-primary`}>Available Quests</h2>
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

                  { <div className="space-y-4">
                      {filteredBounties.map((bounty) => (
                        <Card key={bounty.id} className={`card-theme-secondary`}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex gap-4">
                              <div className={`w-12 h-12 bg-theme-accent rounded-lg flex items-center justify-center`}>
                                <Ship className="text-theme-primary" />
                              </div>
                              <div>
                                <h3 className={`font-medium text-theme-primary`}>{bounty.title}</h3>
                                  {bounty.sponsor?.id ? (
                                    <Link to={`/sponsor/${bounty.sponsor.id}`}>
                                      <div className={`flex items-center gap-1 text-sm text-theme-primary`}>
                                        {/* Use a simplified hover approach */}
                                        <span className="hover:underline transition-all">
                                          {bounty.sponsor?.name || 'Unknown Sponsor'}
                                        </span>
                                        {bounty.sponsor?.is_verified && (
                                          <Badge 
                                            variant="secondary" 
                                            className={`bg-theme-accent text-theme-primary`}
                                          >
                                            <Anchor className="w-3 h-3 mr-1" />
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className={`flex items-center gap-1 text-sm text-theme-primary`}>
                                      Unknown Sponsor
                                    </div>
                                  )}
                                <div className={`flex items-center gap-4 text-sm text-theme-primary mt-1`}>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{bounty.category}</span>
                                  </div>
                                  <span>Due in {getTimeRemaining(bounty.end_date)}</span>
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
                                  <span className={`font-medium text-theme-primary`}>{bounty.reward.amount}</span>
                                </div>
                                <span className={`text-sm text-theme-muted`}>{bounty.reward.token}</span>
                              </div>
                              <Button 
                                variant="outline"
                                className={`btn-theme-secondary`}
                                onClick={() => navigate(`/bounty/${bounty.id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  }
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}