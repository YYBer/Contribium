import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-hot-toast'
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/UserContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'

interface FormData {
  name: string
  description: string
  website_url: string
  twitter_handle: string
}

interface PhotoFile {
  file: File
  preview: string
}

export function CreateSponsorProfile() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [useFallback, setUseFallback] = useState(false)  // Track if we need to use fallback
  const [photoFiles, setPhotoFiles] = useState<PhotoFile[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    website_url: "",
    twitter_handle: ""
  })


  // Check if user already has a sponsor profile
  useEffect(() => {
    const checkSponsorProfile = async () => {
      console.log("Checking sponsor profile, user:", user)
      
      // If no user, we're either not logged in or still loading
      if (!user) {
        console.log("No user found, setting checking to false after delay")
        // After a reasonable delay, assume not logged in rather than keep loading
        setTimeout(() => {
          setChecking(false)
        }, 1500)
        return
      }
      
      // Set a max timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log("Forced timeout for sponsor check")
        setChecking(false)
      }, 5000)
      
      try {
        console.log("Querying Supabase for sponsor profile with user ID:", user.id)
        const { data, error } = await supabase
          .from('sponsors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
          
        clearTimeout(timeoutId)
          
        if (error) {
          console.error("Error checking sponsor profile:", error)
          if (error.code === 'PGRST116') {
            console.log("No profile found, which is expected for new sponsors")
          } else {
            toast.error("Error checking your sponsor profile: " + error.message)
          }
        } else if (data) {
          console.log("Found existing sponsor profile:", data)
          toast.success("Redirecting to your sponsor dashboard")
          setTimeout(() => {
            window.location.href = `/sponsor/dashboard`
          }, 1000)
          return
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error("Exception checking sponsor profile:", error)
      } finally {
        clearTimeout(timeoutId)
        console.log("Setting checking to false")
        setChecking(false)
      }
    }
    
    checkSponsorProfile()
  }, [user, navigate])

  // Photo upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload a valid image file (JPG, PNG, or GIF)`)
        return false
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 5MB`)
        return false
      }
      
      return true
    })

    // Check total photos limit (5 photos max)
    const currentCount = photoFiles.length
    const newFiles = validFiles.slice(0, 5 - currentCount)
    
    if (validFiles.length > newFiles.length) {
      toast.error('Maximum 5 photos allowed')
    }

    // Create preview URLs and add to state
    const newPhotos: PhotoFile[] = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setPhotoFiles(prev => [...prev, ...newPhotos])
  }, [photoFiles, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB in bytes
  })

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => {
      const newPhotos = [...prev]
      // Revoke the preview URL to free memory
      URL.revokeObjectURL(newPhotos[index].preview)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return []
    
    try {
      const uploadPromises = photoFiles.map(async (photoFile) => {
        const fileExt = photoFile.file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `sponsor-${user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { data, error: uploadError } = await supabase.storage
          .from('sponsor-photos')
          .upload(fileName, photoFile.file, {
            contentType: photoFile.file.type,
            upsert: true
          })
          
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('sponsor-photos')
          .getPublicUrl(fileName)
        
        return publicUrl
      })

      const photoUrls = await Promise.all(uploadPromises)
      return photoUrls
      
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Failed to upload photos. Please try again.')
      throw error
    }
  } 

  // Fallback method using direct fetch
  const createSponsorWithFetch = async () => {
    if (!user?.id) return
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      toast.error("Missing Supabase configuration")
      return
    }

    try {
      setLoading(true)
      console.log("Creating sponsor profile using direct fetch for user:", user.id)
      
      // Upload photos first
      let profilePhotos: string[] = []
      try {
        profilePhotos = await uploadPhotos()
      } catch (photoError) {
        console.error('Photo upload failed:', photoError)
        // Continue without photos, don't fail the entire process
        toast.error('Photo upload failed, but profile will be created without photos')
      }
      
      const sponsorData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        website_url: formData.website_url || null,
        twitter_handle: formData.twitter_handle || null,
        logo_url: user.avatar_url,
        profile_photos: profilePhotos.length > 0 ? profilePhotos : null,
        is_verified: false,
        total_bounties_count: 0,
        total_projects_count: 0,
        total_reward_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Create a controller for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // Direct fetch request to Supabase 
      const response = await fetch(`${supabaseUrl}/rest/v1/sponsors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sponsorData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response from API:', response.status, errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log("Sponsor profile created successfully with fetch:", data)
      
      toast.success("Sponsor profile created successfully!")
      navigate(`/sponsor/dashboard`)
    } catch (error: any) {
      console.error('Error creating sponsor with fetch:', error)
      
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please check your internet connection and try again.")
      } else {
        toast.error(error.message || "Failed to create sponsor profile")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = createSponsorWithFetch;

  if (checking) {
    return (
      <Card className={`card-theme`}>
        <CardContent className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C1A461] border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  // Add a check for when the user isn't logged in
  if (!user) {
    return (
      <Card className={`card-theme`}>
        <CardHeader>
          <CardTitle className="text-theme-primary">Create Sponsor Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-theme-primary">Please sign in to create a sponsor profile.</p>
          <Button 
            className="w-full bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`card-theme`}>
      <CardHeader>
        <CardTitle className="text-theme-primary">Create Sponsor Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-theme-primary">Organization Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`input-theme`}
              placeholder="Your organization or project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-theme-primary">Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`input-theme`}
              placeholder="Brief description of your organization or project"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-theme-primary">Website URL</Label>
            <Input
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className={`input-theme`}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-theme-primary">Twitter Handle</Label>
            <Input
              value={formData.twitter_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, twitter_handle: e.target.value }))}
              className={`input-theme`}
              placeholder="@username"
            />
          </div>
          
          {/* Photo Upload Section */}
          <div className="space-y-4">
            <Label className="text-theme-primary">
              Profile Photos 
              <span className="text-theme-muted text-sm ml-2">(Optional - Max 5 photos, 5MB each)</span>
            </Label>
            
            {/* Photo Upload Dropzone */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? 'border-theme-primary bg-theme-accent/20' 
                  : 'border-theme-secondary hover:border-theme-accent'}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-theme-muted" />
              <p className="text-theme-primary mb-1">
                {isDragActive 
                  ? 'Drop photos here...' 
                  : 'Click to upload or drag and drop photos'
                }
              </p>
              <p className="text-sm text-theme-muted">
                PNG, JPG, GIF up to 5MB each • {5 - photoFiles.length} photos remaining
              </p>
            </div>

            {/* Photo Previews */}
            {photoFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoFiles.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-theme-secondary"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {Math.round(photo.file.size / 1024)}KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button 
          className="w-full bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Sponsor Profile"}
        </Button>
      </CardContent>
    </Card>
  )
}