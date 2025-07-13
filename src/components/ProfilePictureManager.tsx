import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Trash2, Save } from 'lucide-react'

interface ProfilePictureManagerProps {
  sponsor: {
    id: string
    profile_photos: string[] | null
    name: string
    description: string | null
    website_url: string | null
    twitter_handle: string | null
  }
  onUpdate: (updatedSponsor: Partial<ProfilePictureManagerProps['sponsor']>) => void
}

interface PhotoFile {
  file: File
  preview: string
}

export function ProfilePictureManager({ sponsor, onUpdate }: ProfilePictureManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newPhotoFiles, setNewPhotoFiles] = useState<PhotoFile[]>([])
  
  // Form fields for sponsor info
  const [description, setDescription] = useState(sponsor.description || '')
  const [websiteUrl, setWebsiteUrl] = useState(sponsor.website_url || '')
  const [twitterHandle, setTwitterHandle] = useState(sponsor.twitter_handle || '')

  // Use profile_photos only for sponsor profile pictures
  const existingPhotos = sponsor.profile_photos || []
  const totalPhotosCount = existingPhotos.length + newPhotoFiles.length
  const maxPhotos = 1 // Sponsors can only have 1 profile picture

  // Sync form fields with sponsor data when it changes
  useEffect(() => {
    setDescription(sponsor.description || '')
    setWebsiteUrl(sponsor.website_url || '')
    setTwitterHandle(sponsor.twitter_handle || '')
  }, [sponsor.description, sponsor.website_url, sponsor.twitter_handle])


  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload a valid image file (JPG, PNG, or GIF)`)
        return false
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 5MB`)
        return false
      }
      
      return true
    })

    const availableSlots = maxPhotos - totalPhotosCount
    const newFiles = validFiles.slice(0, availableSlots)
    
    if (validFiles.length > newFiles.length) {
      toast.error('Only 1 profile picture allowed')
    }

    const newPhotos: PhotoFile[] = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setNewPhotoFiles(prev => [...prev, ...newPhotos])
  }, [totalPhotosCount])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: totalPhotosCount >= maxPhotos
  })

  const removeNewPhoto = (index: number) => {
    setNewPhotoFiles(prev => {
      const newPhotos = [...prev]
      URL.revokeObjectURL(newPhotos[index].preview)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  const uploadNewPhotos = async (): Promise<string[]> => {
    if (newPhotoFiles.length === 0) return []
    
    try {
      const uploadPromises = newPhotoFiles.map(async (photoFile) => {
        const fileExt = photoFile.file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `sponsor-${sponsor.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('sponsor-photos')
          .upload(fileName, photoFile.file, {
            contentType: photoFile.file.type,
            upsert: true
          })

        if (uploadError) {
          console.error(`Upload error for ${photoFile.file.name}:`, uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('sponsor-photos')
          .getPublicUrl(fileName)
        
        return publicUrl
      })

      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading photos:', error)
      throw error
    }
  }

  const handleUpload = async () => {
    if (newPhotoFiles.length === 0) {
      toast.error('No new photo to upload')
      return
    }

    try {
      setUploading(true)
      
      // If there's an existing photo, remove it first
      if (existingPhotos.length > 0) {
        try {
          const fileName = existingPhotos[0].split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('sponsor-photos')
              .remove([fileName])
          }
        } catch (storageError) {
          console.warn('Failed to delete existing file from storage:', storageError)
        }
      }
      
      const newPhotoUrls = await uploadNewPhotos()
      // Replace existing photos with new one (only 1 allowed)
      const updatedPhotos = newPhotoUrls
      
      const { error } = await supabase
        .from('sponsors')
        .update({ profile_photos: updatedPhotos })
        .eq('id', sponsor.id)

      if (error) throw error

      setNewPhotoFiles([])
      
      // Force a complete sponsor data refresh from database
      console.log('Fetching refreshed sponsor data after upload...')
      const { data: refreshedSponsor, error: refreshError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', sponsor.id)
        .single()
      
      if (refreshError) {
        console.error('Error refreshing sponsor data:', refreshError)
        onUpdate({ profile_photos: updatedPhotos })
      } else {
        console.log('Refreshed sponsor data:', refreshedSponsor)
        console.log('Profile photos in refreshed data:', refreshedSponsor.profile_photos)
        onUpdate(refreshedSponsor)
      }
      
      toast.success('Profile picture uploaded successfully')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const removeExistingPhoto = async (photoUrl: string) => {
    try {
      setRemoving(photoUrl)
      
      const updatedPhotos = existingPhotos.filter(url => url !== photoUrl)
      
      const { error } = await supabase
        .from('sponsors')
        .update({ profile_photos: updatedPhotos.length > 0 ? updatedPhotos : null })
        .eq('id', sponsor.id)

      if (error) throw error

      try {
        const fileName = photoUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('sponsor-photos')
            .remove([fileName])
        }
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }

      // Clear any pending new photo files since we now have space
      setNewPhotoFiles([])
      
      // Force a complete sponsor data refresh from database
      const { data: refreshedSponsor, error: refreshError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', sponsor.id)
        .single()
      
      if (refreshError) {
        console.error('Error refreshing sponsor data:', refreshError)
        onUpdate({ profile_photos: updatedPhotos })
      } else {
        onUpdate(refreshedSponsor)
      }
      
      toast.success('Photo removed successfully')
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    } finally {
      setRemoving(null)
    }
  }

  const removeAllPhotos = async () => {
    if (existingPhotos.length === 0) return

    try {
      setRemoving('all')
      
      const { error } = await supabase
        .from('sponsors')
        .update({ profile_photos: null })
        .eq('id', sponsor.id)

      if (error) throw error

      try {
        const fileNames = existingPhotos.map(url => url.split('/').pop()).filter(Boolean) as string[]
        if (fileNames.length > 0) {
          await supabase.storage
            .from('sponsor-photos')
            .remove(fileNames)
        }
      } catch (storageError) {
        console.warn('Failed to delete files from storage:', storageError)
      }

      // Clear any pending new photo files since we now have space
      setNewPhotoFiles([])
      
      // Force a complete sponsor data refresh from database
      const { data: refreshedSponsor, error: refreshError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', sponsor.id)
        .single()
      
      if (refreshError) {
        console.error('Error refreshing sponsor data:', refreshError)
        onUpdate({ profile_photos: null })
      } else {
        onUpdate(refreshedSponsor)
      }
      
      toast.success('Profile picture removed successfully')
    } catch (error) {
      console.error('Error removing all photos:', error)
      toast.error('Failed to remove photos')
    } finally {
      setRemoving(null)
    }
  }

  const saveSponsorInfo = async () => {
    try {
      setSaving(true)

      const updateData = {
        description: description.trim() || null,
        website_url: websiteUrl.trim() || null,
        twitter_handle: twitterHandle.trim() || null
      }

      console.log('Saving sponsor info, updateData:', updateData)
      console.log('Current sponsor state before save:', sponsor)
      
      const { error } = await supabase
        .from('sponsors')
        .update(updateData)
        .eq('id', sponsor.id)

      if (error) throw error

      console.log('Database update successful, calling onUpdate with:', updateData)
      // Preserve existing profile_photos when updating other fields
      onUpdate({
        ...updateData,
        profile_photos: sponsor.profile_photos
      })
      toast.success('Profile information updated successfully')
    } catch (error) {
      console.error('Error updating sponsor info:', error)
      toast.error('Failed to update profile information')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sponsor Information Form */}
      <Card className="card-theme">
        <CardHeader>
          <CardTitle className="text-theme-primary">Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-theme-primary">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organization or project"
              className="input-theme resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-theme-primary">Website URL</Label>
              <Input
                id="website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="input-theme"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-theme-primary">Twitter Handle</Label>
              <Input
                id="twitter"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@username"
                className="input-theme"
              />
            </div>
          </div>
          
          <Button
            onClick={saveSponsorInfo}
            disabled={saving}
            className="bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Information'}
          </Button>
        </CardContent>
      </Card>

      {/* Profile Picture Management */}
      <Card className="card-theme">
        <CardHeader>
          <CardTitle className="text-theme-primary flex items-center justify-between">
            Profile Picture
            {existingPhotos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAllPhotos}
                disabled={removing === 'all'}
                className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {removing === 'all' ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Existing Photo */}
        {existingPhotos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-theme-primary">Current Profile Picture</h4>
            <div className="flex justify-center">
              {existingPhotos.slice(0, 1).map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`${sponsor.name} profile picture`}
                    className="w-32 h-32 object-cover rounded-lg border border-theme-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photoUrl)}
                    disabled={removing === photoUrl}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {removing === photoUrl ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Photo */}
        {totalPhotosCount < maxPhotos && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-theme-primary">
              {existingPhotos.length === 0 ? 'Upload Profile Picture' : 'Replace Profile Picture'}
            </h4>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? 'border-theme-primary bg-theme-accent/20' 
                  : 'border-theme-secondary hover:border-theme-accent'}
                ${totalPhotosCount >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-theme-muted" />
              <p className="text-theme-primary mb-1">
                {isDragActive 
                  ? 'Drop photo here...' 
                  : 'Click to upload or drag and drop photo'}
              </p>
              <p className="text-sm text-theme-muted">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>

            {/* New Photo Preview */}
            {newPhotoFiles.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-theme-primary">New Photo to Upload</h5>
                <div className="flex justify-center">
                  {newPhotoFiles.slice(0, 1).map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt="New profile picture"
                        className="w-32 h-32 object-cover rounded-lg border border-theme-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
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
                
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-[#C1A461] hover:bg-[#C1A461]/90 text-[#1B2228]"
                >
                  {uploading ? 'Uploading...' : 'Upload Profile Picture'}
                </Button>
              </div>
            )}
          </div>
        )}

        {existingPhotos.length === 0 && newPhotoFiles.length === 0 && (
          <div className="text-center py-8">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">
                {sponsor.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-theme-muted">No profile picture uploaded yet</p>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}