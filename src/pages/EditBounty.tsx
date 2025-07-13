import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/UserContext"
import { useTheme } from "@/contexts/ThemeContext"
import { toast } from 'react-hot-toast'
import { Category, Bounty } from "@/types/supabase"

interface FormData {
  title: string
  description: string | null
  category: Category
  requirements: string | null
  reward: {
    amount: number
    token: string
    usd_equivalent: number
  }
  submission_guidelines: string | null
  max_submissions: number
  start_date: string
  end_date: string
  review_timeframe: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number | null
  tags: string[]
  status: 'open' | 'completed'
}

const INITIAL_FORM_DATA: FormData = {
  title: "",
  description: "",
  category: 'development',
  requirements: "",
  reward: {
    amount: 0,
    token: "USD",
    usd_equivalent: 0
  },
  submission_guidelines: "",
  max_submissions: 10,
  start_date: new Date().toISOString().split('T')[0],
  end_date: "",
  review_timeframe: 7,
  difficulty_level: 'intermediate',
  estimated_hours: null,
  tags: [],
  status: 'open'
}

export default function EditBounty() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)


  // Fetch existing bounty data if editing
  useEffect(() => {
    const fetchBounty = async () => {
      if (!id) return

      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('bounties')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          console.log('Fetched bounty data:', data)
          // Map database fields to form structure
          setFormData({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'development',
            requirements: data.requirements || '',
            reward: {
              amount: data.reward?.amount || 0,
              token: data.reward?.token || 'USD',
              usd_equivalent: data.reward?.usd_equivalent || data.reward?.amount || 0
            },
            submission_guidelines: data.submission_guidelines || '',
            max_submissions: data.max_submissions || 10,
            start_date: data.start_date ? data.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
            end_date: data.end_date ? data.end_date.split('T')[0] : '',
            review_timeframe: data.review_timeframe || 7,
            difficulty_level: data.difficulty_level || 'intermediate',
            estimated_hours: data.estimated_hours || null,
            tags: data.tags || [],
            status: data.status || 'open'
          })
        }
      } catch (error) {
        console.error('Error fetching bounty:', error)
        toast.error("Failed to load bounty details")
        navigate('/sponsor/dashboard')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchBounty()
  }, [id])

  // Check if user is authorized to edit this bounty
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user?.id || !id) return

      try {
        // Get the bounty and check if the current user is the sponsor
        const { data: bounty, error: bountyError } = await supabase
          .from('bounties')
          .select('sponsor_id')
          .eq('id', id)
          .single()

        if (bountyError) {
          console.error('Error checking bounty ownership:', bountyError)
          toast.error("Failed to verify bounty ownership")
          navigate('/sponsor/dashboard')
          return
        }

        // Get the sponsor profile for this user
        const { data: sponsor, error: sponsorError } = await supabase
          .from('sponsors')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (sponsorError) {
          console.error('Error checking sponsor profile:', sponsorError)
          toast.error("You must be a sponsor to edit bounties")
          navigate('/sponsor/dashboard')
          return
        }

        // Check if this sponsor owns the bounty
        if (bounty.sponsor_id !== sponsor.id) {
          toast.error("You can only edit your own bounties")
          navigate('/sponsor/dashboard')
          return
        }
      } catch (error) {
        console.error('Authorization check failed:', error)
        toast.error("Authorization check failed")
        navigate('/sponsor/dashboard')
      }
    }

    checkAuthorization()
  }, [user, id, navigate])

  const handleChange = (
    field: keyof FormData | 'reward.amount' | 'reward.token' | 'reward.usd_equivalent', 
    value: any
  ) => {
    setFormData(prev => {
      if (field === 'reward.amount') {
        const amount = Number(value)
        return { 
          ...prev, 
          reward: { 
            ...prev.reward, 
            amount,
            usd_equivalent: amount // For now, assume 1:1 conversion
          } 
        }
      }
      if (field === 'reward.token') {
        return { ...prev, reward: { ...prev.reward, token: value } }
      }
      if (field === 'reward.usd_equivalent') {
        return { ...prev, reward: { ...prev.reward, usd_equivalent: Number(value) } }
      }
      return { ...prev, [field]: value }
    })
  }

  const validateForm = () => {
    const requiredFields: (keyof FormData)[] = ['title', 'category', 'end_date']
    const emptyFields = requiredFields.filter(field => !formData[field])

    if (emptyFields.length > 0) {
      toast.error(`Please fill in: ${emptyFields.join(', ')}`)
      return false
    }

    if (!formData.reward.amount || formData.reward.amount <= 0) {
      toast.error("Please enter a valid reward amount")
      return false
    }

    const endDate = new Date(formData.end_date)
    const startDate = new Date(formData.start_date)
    if (endDate <= startDate) {
      toast.error("End date must be after start date")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      if (id) {
        // Update existing bounty
        const { error } = await supabase
          .from('bounties')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error
        toast.success("Bounty updated successfully!")
      } else {
        // Create new bounty
        const { error } = await supabase
          .from('bounties')
          .insert([{
            ...formData,
            submissions_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        toast.success("Bounty published successfully!")
      }

      navigate('/sponsor/dashboard')
    } catch (error) {
      console.error('Error saving bounty:', error)
      toast.error(id ? "Failed to update bounty" : "Failed to publish bounty")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className={`min-h-screen bg-theme-primary flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C1A461]" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-theme-primary p-4 flex items-center justify-center`}>
      <Card className={`w-full max-w-2xl card-theme`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={`text-theme-primary text-2xl font-semibold`}>
            {id ? 'Edit Bounty' : 'Publish Bounty'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className={`text-theme-muted hover:text-theme-primary hover:bg-[#C1A461]/10`}
            onClick={() => navigate('/sponsor/dashboard')}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-theme-primary">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input 
              placeholder="Bounty Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`input-theme`}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-theme-primary">
              Description
            </Label>
            <Textarea
              placeholder="Describe the bounty requirements and deliverables"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`input-theme min-h-[120px]`}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label className="text-theme-primary">
              Requirements
            </Label>
            <Textarea
              placeholder="Specific requirements and criteria for completion"
              value={formData.requirements || ''}
              onChange={(e) => handleChange('requirements', e.target.value)}
              className={`input-theme min-h-[80px]`}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-theme-primary">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: Category) => handleChange('category', value)}
            >
              <SelectTrigger className={`input-theme`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className={`card-theme`}>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-theme-primary">
                Reward Amount <span className="text-red-500">*</span>
              </Label>
              <Input 
                type="number"
                min="0"
                step="0.1"
                placeholder="Amount"
                value={formData.reward.amount}
                onChange={(e) => handleChange('reward.amount', e.target.value)}
                className={`input-theme`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-theme-primary">
                Token <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.reward.token}
                onValueChange={(value) => handleChange('reward.token', value)}
              >
                <SelectTrigger className={`input-theme`}>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className={`card-theme`}>
                  {/* <SelectItem value="ALPH">ALPH</SelectItem> */}
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-theme-primary">Start Date</Label>
              <Input 
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={`input-theme`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-theme-primary">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input 
                type="date"
                value={formData.end_date}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className={`input-theme`}
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-theme-primary">Max Submissions</Label>
              <Input 
                type="number"
                min="1"
                value={formData.max_submissions}
                onChange={(e) => handleChange('max_submissions', Number(e.target.value))}
                className={`input-theme`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-theme-primary">Review Timeframe (days)</Label>
              <Input 
                type="number"
                min="1"
                value={formData.review_timeframe}
                onChange={(e) => handleChange('review_timeframe', Number(e.target.value))}
                className={`input-theme`}
              />
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label className="text-theme-primary">Difficulty Level</Label>
            <Select
              value={formData.difficulty_level}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => handleChange('difficulty_level', value)}
            >
              <SelectTrigger className={`input-theme`}>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent className={`card-theme`}>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submission Guidelines */}
          <div className="space-y-2">
            <Label className="text-theme-primary">Submission Guidelines</Label>
            <Textarea
              placeholder="Instructions for how to submit work for this bounty"
              value={formData.submission_guidelines || ''}
              onChange={(e) => handleChange('submission_guidelines', e.target.value)}
              className={`input-theme min-h-[80px]`}
            />
          </div>

          {/* Status (only for editing) */}
          {id && (
            <div className="space-y-2">
              <Label className="text-theme-primary">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'open' | 'completed') => 
                  handleChange('status', value)
                }
              >
                <SelectTrigger className={`input-theme`}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className={`card-theme`}>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            className="w-full bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (id ? "Updating..." : "Publishing...") : (id ? "Update Bounty" : "Publish Bounty")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}