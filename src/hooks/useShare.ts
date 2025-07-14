import { useState } from 'react'
import { toast } from 'react-hot-toast'

function useShare() {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async (title: string, url: string) => {
    setIsSharing(true)
    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title,
          url
        })
        toast.success("Successfully shared!")
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard!")
      }
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User cancelled the share operation
          return
        }
        if (error.name === 'NotAllowedError') {
          toast.error("Permission denied for sharing")
          return
        }
      }
      // Fallback error message
      toast.error("Failed to share. Please try copying the URL manually.")
    } finally {
      setIsSharing(false)
    }
  }

  return {
    isSharing,
    handleShare
  }
}

export default useShare