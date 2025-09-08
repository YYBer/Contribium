import { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Github, Twitter, Linkedin, Globe, MessageCircle, Loader2 } from 'lucide-react'
import { User } from '../types/supabase'
import { UserService } from '../services/user.service'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { useToast } from '../components/ui/use-toast'
import { Web3Interest, WorkExperience } from '../types/supabase'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getAllCountries } from '../constants/countries'
import { 
  SKILLS_BY_CATEGORY, 
  type SkillCategory, 
  type SkillOption 
} from '../constants/skills'


interface FormData {
  username: string
  firstName: string
  lastName: string
  bio: string
  walletAddress: string
  githubUrl: string
  twitterUrl: string
  linkedinUrl: string
  telegramUrl: string
  websiteUrl: string
  currentEmployer: string
  web3Interests: Web3Interest[]
  workExperience: WorkExperience
  location: string
}

interface FormErrors {
  [key: string]: string
}

interface SelectedSkills extends Record<SkillCategory, string[]> {}

// Removed unused COUNTRIES constant - using getAllCountries() from constants/countries instead

const WEB3_INTERESTS = [
  { value: 'defi' as Web3Interest, label: 'DeFi' },
  { value: 'nft' as Web3Interest, label: 'NFTs' },
  { value: 'dao' as Web3Interest, label: 'DAOs' },
  { value: 'other' as Web3Interest, label: 'Other' }
]

export const EditProfile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, refreshUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkills>({
    frontend: user?.frontend_skills || [],
    backend: user?.backend_skills || [],
    blockchain: user?.blockchain_skills || [],
    design: user?.design_skills || [],
    content: user?.content_skills || []
  })

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    bio: user?.bio || '',
    walletAddress: user?.wallet_address || '',
    githubUrl: user?.github_url || '',
    twitterUrl: user?.twitter_url || '',
    linkedinUrl: user?.linkedin_url || '',
    telegramUrl: user?.telegram_url || '',
    websiteUrl: user?.website_url || '',
    currentEmployer: user?.current_employer || '',
    web3Interests: user?.web3_interests || [],
    workExperience: user?.work_experience || '0-2',
    location: user?.location || '',
  })

  // Update form data and skills when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        bio: user.bio || '',
        walletAddress: user.wallet_address || '',
        githubUrl: user.github_url || '',
        twitterUrl: user.twitter_url || '',
        linkedinUrl: user.linkedin_url || '',
        telegramUrl: user.telegram_url || '',
        websiteUrl: user.website_url || '',
        currentEmployer: user.current_employer || '',
        web3Interests: user.web3_interests || [],
        workExperience: user.work_experience || '0-2',
        location: user.location || '',
      })
      
      setSelectedSkills({
        frontend: user.frontend_skills || [],
        backend: user.backend_skills || [],
        blockchain: user.blockchain_skills || [],
        design: user.design_skills || [],
        content: user.content_skills || []
      })
    }
  }, [user])

  // Safety net: Reset loading state if it's been loading too long
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Profile update taking too long, resetting loading state')
        setIsLoading(false)
        toast({
          title: "Warning",
          description: "Profile update is taking longer than expected. Please try again.",
          variant: "destructive"
        })
      }, 60000) // 60 second timeout
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, toast])

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'username':
        if (!value) return 'Username is required'
        if (!/^[a-zA-Z0-9_]{1,20}$/.test(value)) {
          return 'Username must be 1-20 characters and can only contain letters, numbers, and underscores'
        }
        break
    }
    return ''
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Removed handleFileChange as it's replaced by the dropzone functionality

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please refresh and try again.",
        variant: "destructive"
      })
      return
    }
  
    console.log('Starting profile update process...')
    setIsLoading(true)
  
    try {
      console.log('Form data being submitted:', formData)
      console.log('Selected skills:', selectedSkills)
      
      // Check username availability if it changed
      if (formData.username !== user.username) {
        console.log('Checking username availability for:', formData.username)
        try {
          const isAvailable = await UserService.isUsernameAvailable(formData.username)
          console.log('Username availability result:', isAvailable)
          if (!isAvailable) {
            toast({
              title: "Error",
              description: "Username is already taken",
              variant: "destructive"
            })
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error('Error checking username availability:', error)
          toast({
            title: "Error",
            description: "Failed to check username availability. Please try again.",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }
      }

      if (formData.walletAddress !== user.wallet_address) {
        console.log('Checking wallet address availability for:', formData.walletAddress)
        try {
          const isAvailable = await UserService.isWalletAddressAvailable(formData.walletAddress, user.id)
          console.log('Wallet address availability result:', isAvailable)
          if (!isAvailable) {
            toast({
              title: "Error",
              description: "Wallet address is already registered",
              variant: "destructive"
            })
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error('Error checking wallet address availability:', error)
          toast({
            title: "Error",
            description: "Failed to check wallet address availability. Please try again.",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }
      }  
  
      let avatarUrl = user.avatar_url
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
        // Add error check for avatar upload
        if (!avatarUrl) {
          setIsLoading(false)
          return
        }
      }
  
      // Validate required fields before update
      if (!formData.username?.trim() || !formData.firstName?.trim() || !formData.lastName?.trim() || !formData.walletAddress?.trim()) {
        console.log('Validation failed - missing required fields:', {
          username: formData.username?.trim(),
          firstName: formData.firstName?.trim(),
          lastName: formData.lastName?.trim(),
          walletAddress: formData.walletAddress?.trim()
        })
        toast({
          title: "Error",
          description: "Please fill in all required fields (Username, First Name, Last Name, Wallet Address)",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
  
      const updates: Partial<User> = {
        username: formData.username?.trim(),
        first_name: formData.firstName?.trim(),
        last_name: formData.lastName?.trim(),
        bio: formData.bio?.trim() || null,
        wallet_address: formData.walletAddress?.trim(),
        github_url: formData.githubUrl?.trim() || null,
        twitter_url: formData.twitterUrl?.trim() || null,
        linkedin_url: formData.linkedinUrl?.trim() || null,
        telegram_url: formData.telegramUrl?.trim() || null,
        website_url: formData.websiteUrl?.trim() || null,
        current_employer: formData.currentEmployer?.trim() || null,
        web3_interests: formData.web3Interests || [],
        work_experience: formData.workExperience,
        location: formData.location || null,
        frontend_skills: selectedSkills.frontend || [],
        backend_skills: selectedSkills.backend || [],
        blockchain_skills: selectedSkills.blockchain || [],
        design_skills: selectedSkills.design || [],
        content_skills: selectedSkills.content || [],
        avatar_url: avatarUrl || undefined,
        updated_at: new Date().toISOString()
      }
      
      // Remove empty/null values to avoid issues
      Object.keys(updates).forEach(key => {
        const typedKey = key as keyof Partial<User>
        const value = updates[typedKey]
        if (value === '' || value === null || value === undefined) {
          delete updates[typedKey]
        }
      })
  
      console.log('Updating profile with:', updates)
  
      // Add timeout to prevent infinite hanging
      const updatePromise = UserService.updateProfile(user.id, updates)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile update timeout - please try again')), 30000) // 30 second timeout
      })
      
      const updatedUser = await Promise.race([updatePromise, timeoutPromise]) as User
      console.log('Update response:', updatedUser)
      
      if (!updatedUser) {
        throw new Error('Failed to update profile: No response from server')
      }
  
      console.log('Refreshing user context...')
      try {
        await refreshUser()
        console.log('User context refreshed successfully')
      } catch (refreshError) {
        console.error('Error refreshing user context:', refreshError)
        // Don't fail the whole operation if refresh fails
        toast({
          title: "Warning",
          description: "Profile updated but failed to refresh data. Please refresh the page.",
          variant: "destructive"
        })
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
  
      // Navigate to the updated profile
      setTimeout(() => {
        console.log('Navigating to profile:', updatedUser.username || formData.username)
        navigate(`/profile/${updatedUser.username || formData.username}`)
      }, 1000) // Small delay to ensure toast is seen
  
    } catch (error) {
      console.error('Error updating profile:', error)
      
      // Provide more specific error handling
      let errorMessage = "Failed to update profile"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      console.log('Profile update process completed')
      setIsLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
  
    // Validate file type explicitly
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPG, PNG, or GIF)",
        variant: "destructive"
      })
      return
    }
  
    // Size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive"
      })
      return
    }
  
    try {
      // Create a preview
      const preview = URL.createObjectURL(file)
      setAvatarPreview(preview)
      setAvatarFile(file)
    } catch (error) {
      console.error('Error handling file:', error)
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      })
    }
  }, [toast])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
  })

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null
    
    try {
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          contentType: avatarFile.type,
          upsert: true
        })
        
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
  
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      return publicUrl
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      })
      return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen transition-theme bg-theme-primary w-full px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="card-theme transition-theme">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-theme-primary font-sentient transition-theme">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Personal Info */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-theme-primary transition-theme">PERSONAL INFO</h2>
              
              <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarPreview || user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{formData.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div 
                    {...getRootProps()} 
                    className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors
                      ${isDragActive 
                        ? 'border-theme-primary bg-theme-accent' 
                        : 'border-theme-secondary'} 
                      hover:border-theme-accent cursor-pointer`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-theme-muted" />
                      <p className="text-theme-primary font-medium">
                        {isDragActive 
                          ? 'Drop the image here'
                          : 'Click to choose or drag and drop image'
                        }
                      </p>
                      <p className="text-sm text-theme-muted">
                        Maximum size 5 MB - PNG, JPG, GIF
                      </p>
                      {avatarFile && (
                        <p className="text-sm text-theme-primary font-medium">
                          Selected: {avatarFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <Label htmlFor="username">Username *</Label>
                  <Input 
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`input-theme placeholder:text-theme-muted/50 ${errors.username ? 'border-red-500' : ''}`}
                    placeholder="Enter your username"
                    required
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username}</p>
                  )}
                </div>

                {/* First and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`input-theme placeholder:text-theme-muted/50 ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="Enter your first name"
                      required
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`input-theme placeholder:text-theme-muted/50 ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Enter your last name"
                      required
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <Label htmlFor="bio">Your One-Line Bio</Label>
                  <Textarea 
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="input-theme placeholder:text-theme-muted/50"
                    placeholder="Tell us about yourself in one line"
                  />
                </div>

                {/* Wallet Address */}
                <div className="space-y-1">
                  <Label htmlFor="walletAddress">Your Alephium Wallet Address *</Label>
                  <Input 
                    id="walletAddress"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    className={`input-theme placeholder:text-theme-muted/50 ${errors.walletAddress ? 'border-red-500' : ''}`}
                    placeholder="Enter your Alephium wallet address"
                    required
                  />
                  {errors.walletAddress && (
                    <p className="text-red-500 text-sm">{errors.walletAddress}</p>
                  )}
                </div>

                {/* Social Links */}
                <section className="space-y-6">
                  <h2 className="text-lg font-semibold text-theme-primary">SOCIALS</h2>
                  <div className="space-y-4">
                    {[
                      { icon: Github, name: "githubUrl", placeholder: "github.com/", value: formData.githubUrl },
                      { icon: Twitter, name: "twitterUrl", placeholder: "x.com/", value: formData.twitterUrl },
                      { icon: Linkedin, name: "linkedinUrl", placeholder: "linkedin.com/in/", value: formData.linkedinUrl },
                      { icon: MessageCircle, name: "telegramUrl", placeholder: "t.me/", value: formData.telegramUrl },
                      { icon: Globe, name: "websiteUrl", placeholder: "https://", value: formData.websiteUrl },
                    ].map((social) => (
                      <div key={social.name} className="space-y-1">
                        <div className="relative">
                          <social.icon className="w-5 h-5 absolute left-3 top-2.5 text-theme-muted" />
                          <Input 
                            name={social.name}
                            value={social.value}
                            onChange={handleInputChange}
                            className={`input-theme placeholder:text-theme-muted/50 pl-10 ${errors[social.name] ? 'border-red-500' : ''}`}
                            placeholder={social.placeholder}
                          />
                        </div>
                        {errors[social.name] && (
                          <p className="text-red-500 text-sm">{errors[social.name]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Work Section */}
                <section className="space-y-6">
                  <h2 className="text-lg font-semibold text-theme-primary">WORK</h2>
                  <div className="space-y-4">
                    {/* Web3 Interests */}
                    <div>
                      <Label>What areas of Web3 are you most interested in?</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {WEB3_INTERESTS.map((interest) => {
                          const isSelected = formData.web3Interests.includes(interest.value)
                          return (
                            <Badge
                              key={interest.value}
                              variant="outline"
                              className={`cursor-pointer border-theme-primary hover:border-theme-accent transition-theme
                                ${isSelected ? 'bg-theme-accent text-theme-primary' : 'text-theme-muted'}`}
                              onClick={() => {
                                const currentInterests = formData.web3Interests
                                const newInterests = isSelected
                                  ? currentInterests.filter(i => i !== interest.value)
                                  : [...currentInterests, interest.value]
                                setFormData(prev => ({
                                  ...prev,
                                  web3Interests: newInterests
                                }))
                              }}
                            >
                              {interest.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>

                    {/* Work Experience */}
                    <div>
                      <Label>Work Experience</Label>
                      <Select value={formData.workExperience} onValueChange={(value) => handleSelectChange('workExperience', value)}>
                        <SelectTrigger className="input-theme">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent className="card-theme">
                          <SelectItem value="0-1">0 to 1 Year</SelectItem>
                          <SelectItem value="2-5">2 to 5 Years</SelectItem>
                          <SelectItem value="5+">more than 5 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div>
                      <Label>Location</Label>
                      <Select value={formData.location} onValueChange={(value) => handleSelectChange('location', value)}>
                        <SelectTrigger className="input-theme">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="card-theme h-48 overflow-y-auto">
                          {getAllCountries().map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Current Employer */}
                    <div>
                      <Label>Current Employer</Label>
                      <Input 
                        name="currentEmployer"
                        value={formData.currentEmployer}
                        onChange={handleInputChange}
                        className="input-theme placeholder:text-theme-muted/50"
                        placeholder="Enter your current employer"
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <Label className="flex items-center gap-2">
                        Skills
                        <span className="text-theme-muted text-sm">
                          Select your skills to receive relevant opportunities
                        </span>
                      </Label>
                      <div className="space-y-4 mt-4">
                        {(Object.entries(SKILLS_BY_CATEGORY) as [SkillCategory, SkillOption[]][]).map(([category, options]) => (
                          <div key={category}>
                            <h3 className="text-sm font-medium text-theme-primary mb-2">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {options.map((skill) => {
                                const isSelected = selectedSkills[category].includes(skill.value);
                                return (
                                  <Badge
                                    key={skill.value}
                                    variant="outline"
                                    className={`cursor-pointer border-theme-primary hover:border-theme-accent
                                      ${isSelected ? 'bg-theme-accent' : ''}`}
                                    onClick={() => {
                                      setSelectedSkills(prev => ({
                                        ...prev,
                                        [category]: isSelected
                                          ? prev[category].filter(s => s !== skill.value)
                                          : [...prev[category], skill.value]
                                      }))
                                    }}
                                  >
                                    {skill.label}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Submit Button */}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-theme-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Profile
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}