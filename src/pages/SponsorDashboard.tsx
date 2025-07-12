import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CircleDollarSign, Plus, BarChart3, Edit, ExternalLink, ArrowLeft, Eye, CheckCircle, XCircle, Copy, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast';
import type { Bounty, Sponsor, BountySubmission } from '@/types/supabase'
import LoadingPage from '../pages/LoadingPage'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SponsorSubmissionDialog } from '../components/SponsorSubmissionDialog'

export default function SponsorDashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user } = useUser()
  
  // States
  const [loading, setLoading] = useState(true)
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<BountySubmission[]>([])
  const [allSubmissions, setAllSubmissions] = useState<BountySubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'bounties' | 'submissions'>('overview')
  const [selectedSubmission, setSelectedSubmission] = useState<BountySubmission | null>(null)
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  // const [showWalletCopied, setShowWalletCopied] = useState(false)
  // const [rewardAmount, setRewardAmount] = useState<string>(
    // selectedSubmission?.reward?.amount?.toString() || ""
  // );


  // Fetch sponsor data
  useEffect(() => {
    const fetchSponsorData = async () => {
      try {
        setLoading(true)
        if (!user?.id) return

        // Fetch sponsor profile
        const { data: sponsorData, error: sponsorError } = await supabase
          .from('sponsors')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (sponsorError) throw sponsorError
        setSponsor(sponsorData)

        // Fetch bounties
        const { data: bountiesData, error: bountiesError } = await supabase
          .from('bounties')
          .select('*')
          .eq('sponsor_id', sponsorData.id)
          .order('created_at', { ascending: false })

        if (bountiesError) throw bountiesError
        setBounties(bountiesData || [])

        // Fetch all submissions for this sponsor
        try {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('bounty_submissions')
            .select('*')
            .eq('sponsor_id', sponsorData.id)  // Use sponsor_id directly
            .order('created_at', { ascending: false })
            
          if (submissionsError) {
            console.error('Error fetching submissions:', submissionsError)
            setAllSubmissions([])
          } else {
            console.log(`Found ${submissionsData?.length || 0} total submissions for sponsor ${sponsorData.id}`)
            setAllSubmissions(submissionsData || [])
          }
        } catch (error) {
          console.error('Error processing submissions:', error)
          setAllSubmissions([])
        }

      } catch (error) {
        console.error('Error fetching sponsor data:', error)
        toast.error('Failed to load sponsor data')
      } finally {
        setLoading(false)
      }
    }

    fetchSponsorData()
  }, [user])

  // Fetch submissions for a specific bounty
  const fetchSubmissions = async (bountyId: string) => {
    try {
      setLoadingSubmissions(true)
      
      // Fetch submissions for this bounty without joining with users
      const { data, error } = await supabase
      .from('bounty_submissions')
      .select(`
        *,
        user:users(id, username, wallet_address, avatar_url)
      `)
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching submissions:', error)
        toast.error('Failed to load submissions')
        setSubmissions([])
      } else {
        console.log(`Found ${data?.length || 0} submissions for bounty ${bountyId}`)
        setSubmissions(data || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load submissions')
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Handle bounty selection
  const handleSelectBounty = (bounty: Bounty) => {
    setSelectedBounty(bounty)
    
    // Debug info
    console.log(`Selected bounty: ${bounty.id} - ${bounty.title}`)
    console.log(`This bounty has ${bounty.current_submissions} submissions according to the bounty record`)
    
    // We can either:
    // 1. Fetch submissions from the database
    fetchSubmissions(bounty.id)
    
    // 2. Or filter from already loaded submissions (as a fallback)
    const bountySubmissions = allSubmissions.filter(sub => sub.bounty_id === bounty.id)
    console.log(`Found ${bountySubmissions.length} submissions in already loaded data`)
    
    // If there's a major discrepancy, we'll use the database fetch to be sure
    if (Math.abs(bounty.current_submissions - bountySubmissions.length) > 2) {
      console.log("Discrepancy between expected and found submissions - fetching fresh data")
    } else if (bountySubmissions.length > 0) {
      // Use already loaded data as it seems accurate
      setSubmissions(bountySubmissions)
    }
    
    setActiveTab('submissions')
  }

  // Handle submission status update with transaction hash
  const handleStatusUpdate = async (submissionId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      console.log(`Updating submission ${submissionId} status to ${newStatus}`);
      
      // Prepare update object
      const updateData: any = {
        status: newStatus,
        feedback: feedback || null,
        review_started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
      
      // Only include transaction hash for accepted submissions
      if (newStatus === 'accepted' && transactionHash.trim()) {
        updateData.transaction_hash = transactionHash.trim()
      }
      
      // Update the submission status
      const { data, error } = await supabase
        .from('bounty_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select();

      if (error) {
        console.error('Error updating submission status:', error);
        toast.error(`Failed to ${newStatus} submission: ${error.message}`);
        return;
      }

      console.log(`Successfully updated submission status:`, data);
      
      // Close the dialog
      setShowSubmissionDetails(false);
      setSelectedSubmission(null);
      setFeedback('');
      setTransactionHash('');

      // Refresh the submission data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('bounty_submissions')
        .select(`
          *,
          user:users(id, username, full_name, avatar_url, wallet_address)
        `)
        .eq('id', submissionId)
        .single();

      if (!refreshError && refreshedData) {
        const updatedSubmission = {
          ...refreshedData,
          user_username: refreshedData.user?.username || '',
          user_full_name: refreshedData.user?.full_name || '',
          user_avatar_url: refreshedData.user?.avatar_url || '',
          user_wallet_address: refreshedData.user?.wallet_address || ''
        };
        
        setSubmissions(prev => 
          prev.map(sub => 
            sub.id === submissionId ? updatedSubmission : sub
          )
        );
        
        setAllSubmissions(prev => 
          prev.map(sub => 
            sub.id === submissionId ? updatedSubmission : sub
          )
        );
      }

      // Show success message
      toast.success(`Submission ${newStatus} successfully`);
      
      // Refresh submissions after a short delay
      setTimeout(() => {
        if (selectedBounty) {
          fetchSubmissions(selectedBounty.id);
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Error updating submission status:', error);
      toast.error(`Failed to ${newStatus} submission: ${error.message || 'Unknown error'}`);
    }
  }

  // View a specific submission
  const viewSubmission = (submission: BountySubmission) => {
    setSelectedSubmission(submission)
    setShowSubmissionDetails(true)
    
    // Reset form fields
    setFeedback(submission.feedback || '')
    setTransactionHash(submission.transaction_hash || '')
  }

  // Handle editing a bounty
  const handleEditBounty = (bountyId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    navigate(`/editbounty/${bountyId}`)
  }

  // Handle viewing a bounty
  const handleViewBounty = (bountyId: string) => {
    navigate(`/bounty/${bountyId}`)
  }

  // Get bounty title by ID
  const getBountyTitle = (bountyId: string) => {
    // First check in our loaded bounties
    const bounty = bounties.find(b => b.id === bountyId)
    if (bounty?.title) return bounty.title
    
    // If not found, check if the submission has bounty info attached
    const submission = allSubmissions.find(s => s.bounty_id === bountyId)
    if (submission?.bounty_name) return submission.bounty_name
    
    // Try to extract from submission title
    const submissionWithTitle = allSubmissions.find(s => 
      s.bounty_id === bountyId && s.title && s.title.includes('for')
    )
    if (submissionWithTitle?.title) {
      const parts = submissionWithTitle.title.split('for')
      if (parts.length > 1) return parts[1].trim()
    }
    
    // If nothing worked, return generic
    return 'Unknown Bounty'
  }

  // Copy wallet address to clipboard
  // const copyWalletAddress = (address: string) => {
  //   navigator.clipboard.writeText(address)
  //   setShowWalletCopied(true)
    
  //   setTimeout(() => {
  //     setShowWalletCopied(false)
  //   }, 2000)
    
  //   toast.success("Wallet address copied to clipboard")
  // }

// Function to save reward amount
  // const saveRewardAmount = async (submissionId: string): Promise<void> => {
  //   if (!rewardAmount.trim()) {
  //     toast.error("Please enter a reward amount");
  //     return;
  //   }
    
  //   try {
  //     const { error } = await supabase
  //       .from('bounty_submissions')
  //       .update({ 
  //         reward: {
  //           ...(selectedSubmission?.reward || {}),
  //           amount: parseFloat(rewardAmount),
  //           usd_equivalent: parseFloat(rewardAmount)
  //         }
  //       })
  //       .eq('id', submissionId);

  //     if (error) throw error;
      
  //     toast.success("Reward amount saved successfully");
      
  //     // Update the local submission data
  //     setSubmissions(prev => 
  //       prev.map(sub => 
  //         sub.id === submissionId 
  //           ? { 
  //               ...sub, 
  //               reward: {
  //                 ...(sub.reward || {}),
  //                 amount: parseFloat(rewardAmount),
  //                 usd_equivalent: parseFloat(rewardAmount)
  //               }
  //             } 
  //           : sub
  //       )
  //     );
      
  //     setAllSubmissions(prev => 
  //       prev.map(sub => 
  //         sub.id === submissionId 
  //           ? { 
  //               ...sub, 
  //               reward: {
  //                 ...(sub.reward || {}),
  //                 amount: parseFloat(rewardAmount),
  //                 usd_equivalent: parseFloat(rewardAmount)
  //               }
  //             } 
  //           : sub
  //       )
  //     );
      
  //   } catch (error: any) {
  //     console.error('Error saving reward amount:', error);
  //     toast.error(`Failed to save reward amount: ${error.message || 'Unknown error'}`);
  //   }
  // };
  // Save transaction hash without changing status
  // const saveTransactionHash = async (submissionId: string) => {
  //   if (!transactionHash.trim()) {
  //     toast.error("Please enter a transaction hash")
  //     return
  //   }
    
  //   try {
  //     const { error } = await supabase
  //       .from('bounty_submissions')
  //       .update({ transaction_hash: transactionHash.trim() })
  //       .eq('id', submissionId)

  //     if (error) throw error
      
  //     toast.success("Transaction hash saved successfully")
      
  //     // Update the local submission lists
  //     setSubmissions(prev => 
  //       prev.map(sub => 
  //         sub.id === submissionId 
  //           ? { ...sub, transaction_hash: transactionHash.trim() } 
  //           : sub
  //       )
  //     )
      
  //     setAllSubmissions(prev => 
  //       prev.map(sub => 
  //         sub.id === submissionId 
  //           ? { ...sub, transaction_hash: transactionHash.trim() } 
  //           : sub
  //       )
  //     )
      
  //   } catch (error: any) {
  //     console.error('Error saving transaction hash:', error)
  //     toast.error(`Failed to save transaction hash: ${error.message || 'Unknown error'}`)
  //   }
  // }

  const refreshSubmissions = async () => {
    if (!sponsor) return

    try {
      const { data, error } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('sponsor_id', sponsor.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error refreshing submissions:', error)
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sponsor-secondary">No sponsor profile found.</p>
          <Button
            onClick={() => navigate('/sponsor')}
            className="btn-sponsor-primary"
          >
            Create Sponsor Profile
          </Button>
        </div>
      </div>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Get status color
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      case 'in_review':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-yellow-500/20 text-yellow-500';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Header */}
      <section className="gradient-sponsor-hero text-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold font-sentient">Sponsor Dashboard</h1>
              <p className="text-xl text-white/90">{sponsor.name}</p>
              <p className="text-white/70">Manage your bounties, projects, and submissions</p>
            </div>
            <Button
              onClick={() => navigate('/postlisting')}
              className="bg-white text-sponsor-primary hover:bg-white/90 font-medium px-6 py-3 text-lg shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Listing
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 -mt-6">

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
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
                    ${sponsor.total_reward_amount.toLocaleString()}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-white border-b border-sponsor-primary/20 w-full justify-start rounded-none p-0 h-auto shadow-sm">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-3 border-transparent data-[state=active]:border-sponsor-primary data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-sponsor-primary px-6 py-4 font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="bounties"
              className="rounded-none border-b-3 border-transparent data-[state=active]:border-sponsor-primary data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-sponsor-primary px-6 py-4 font-medium"
            >
              Bounties
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="rounded-none border-b-3 border-transparent data-[state=active]:border-sponsor-primary data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-sponsor-primary px-6 py-4 font-medium"
            >
              Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Bounties */}
              <Card className="card-sponsor">
                <CardHeader className="border-b border-sponsor-primary/20">
                  <CardTitle className="text-sponsor-secondary font-sentient text-xl">Recent Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  {bounties.length === 0 ? (
                    <p className="text-gray-600">No bounties found</p>
                  ) : (
                    <div className="space-y-4">
                      {bounties.slice(0, 5).map((bounty) => (
                        <div
                          key={bounty.id}
                          className="p-4 border border-sponsor-primary/20 rounded-lg cursor-pointer hover:border-sponsor-primary hover:bg-sponsor-primary/5 transition-all duration-200 relative"
                          onClick={() => handleViewBounty(bounty.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-sponsor-secondary">{bounty.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    bounty.status === 'open' ? 'badge-sponsor-success' :
                                    bounty.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' :
                                    'badge-sponsor-accent'
                                  }
                                >
                                  {bounty.status}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {bounty.current_submissions} submissions
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-sponsor-primary hover:bg-sponsor-primary/10"
                                onClick={(e) => handleEditBounty(bounty.id, e)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-sponsor-accent hover:bg-sponsor-accent/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/bounty/${bounty.id}`);
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Submissions */}
              <Card className="card-sponsor">
                <CardHeader className="border-b border-sponsor-primary/20">
                  <CardTitle className="text-sponsor-secondary font-sentient text-xl">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {allSubmissions.length === 0 ? (
                    <p className="text-gray-600">No submissions found</p>
                  ) : (
                    <div className="space-y-4">
                      {allSubmissions.slice(0, 5).map((submission) => (
                        <div
                          key={submission.id}
                          className="p-4 border border-sponsor-primary/20 rounded-lg cursor-pointer hover:border-sponsor-accent hover:bg-sponsor-accent/5 transition-all duration-200 relative"
                          onClick={() => viewSubmission(submission)}
                        >
                          <div className="flex justify-between items-start">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={submission.user_avatar_url || undefined} />
                                <AvatarFallback className="bg-sponsor-primary text-white">
                                  {submission.user_username ? getInitials(submission.user_username) : 'AN'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium text-sponsor-secondary">
                                  {submission.user_username || 'Anonymous User'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {getBountyTitle(submission.bounty_id)}
                                </p>
                              </div>
                            </div>
                          </div>
                            <Badge 
                              variant="outline" 
                              className={getStatusBadgeClass(submission.status)}
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bounties" className="mt-6">
            <div className="space-y-4">
              {bounties.length === 0 ? (
                <Card className="card-theme">
                  <CardContent className="p-8 text-center">
                    <p className="text-theme-muted">No bounties found. Create your first bounty to get started.</p>
                    <Button
                      onClick={() => navigate('/postlisting')}
                      className="mt-4 btn-theme-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Bounty
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                bounties.map((bounty) => (
                  <Card
                    key={bounty.id}
                    className="card-theme hover:border-theme-accent cursor-pointer relative"
                    onClick={() => handleSelectBounty(bounty)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-theme-primary">{bounty.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={
                                bounty.status === 'open' ? 'bg-green-500/20 text-green-500' :
                                bounty.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-blue-500/20 text-blue-500'
                              }
                            >
                              {bounty.status}
                            </Badge>
                            <Badge variant="outline" className="badge-theme-primary">
                              {bounty.category}
                            </Badge>
                            <Badge variant="outline" className="badge-theme-secondary">
                              {bounty.difficulty_level}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-4">
                              <p className="text-sm text-theme-muted">
                                {bounty.current_submissions} submissions
                              </p>
                              <p className="text-sm text-theme-muted">
                                Due: {formatDate(bounty.end_date)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-theme-primary">
                              {bounty.reward.amount} {bounty.reward.token}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="btn-theme-secondary"
                            onClick={(e) => handleEditBounty(bounty.id, e)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="btn-theme-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bounty/${bounty.id}`);
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            {selectedBounty ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="btn-theme-secondary"
                      onClick={() => setSelectedBounty(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to all submissions
                    </Button>
                    <h2 className="text-xl font-medium text-theme-primary">
                      Submissions for: {selectedBounty.title}
                    </h2>
                  </div>
                  <Badge className="badge-theme-primary">
                    {submissions.length} Submissions
                  </Badge>
                </div>
                
                {loadingSubmissions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-theme-accent" />
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <Card 
                        key={submission.id} 
                        className="card-sponsor hover:border-sponsor-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => viewSubmission(submission)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={submission.user_avatar_url || undefined} />
                                <AvatarFallback className="bg-theme-accent text-theme-primary">
                                  {getInitials(submission.user_username || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-theme-primary">
                                    {submission.title || 'Untitled Submission'}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={getStatusBadgeClass(submission.status)}
                                  >
                                    {submission.status}
                                  </Badge>
                                  {submission.transaction_hash && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-theme-muted">
                                  Submitted on {formatDate(submission.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-theme-primary hover-theme"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(submission.submission_url, '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-theme-primary hover-theme"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="card-theme">
                    <CardContent className="p-8 text-center">
                      <p className="text-theme-muted">No submissions yet for this bounty.</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              // All Submissions view
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-medium text-theme-primary">All Submissions</h2>
                  <Badge className="badge-theme-primary">
                    {allSubmissions.length} Total
                  </Badge>
                </div>
                
                {allSubmissions.length === 0 ? (
                  <Card className="card-theme">
                    <CardContent className="p-8 text-center">
                      <p className="text-theme-muted">
                        No submissions found. Create bounties to start receiving submissions.
                      </p>
                      <Button
                        onClick={() => setActiveTab('bounties')}
                        variant="outline"
                        className="mt-4 btn-theme-secondary"
                      >
                        Go to Bounties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {allSubmissions.map((submission) => (
                      <Card 
                        key={submission.id} 
                        className="card-sponsor hover:border-sponsor-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => viewSubmission(submission)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <Link to={`/profile/${submission.user_username}`}>
                                <Avatar>
                                  <AvatarImage src={submission.user_avatar_url || undefined} />
                                  <AvatarFallback className="bg-theme-accent text-theme-primary">
                                    {submission.user_username?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-theme-primary">
                                    {submission.title || 'Untitled Submission'}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={getStatusBadgeClass(submission.status)}
                                  >
                                    {submission.status}
                                  </Badge>
                                  {submission.transaction_hash && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-theme-muted">
                                  <span className="font-medium">{submission.bounty_name || "Unknown Bounty"}</span> - 
                                  Submitted on {formatDate(submission.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-theme-primary hover-theme"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(submission.submission_url, '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-theme-primary hover-theme"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Detail Dialog */}
      <SponsorSubmissionDialog
        isOpen={showSubmissionDetails}
        onClose={() => setShowSubmissionDetails(false)}
        submission={selectedSubmission}
        onStatusUpdate={handleStatusUpdate}
        onRefresh={refreshSubmissions}
      />
    </div>
  )
}