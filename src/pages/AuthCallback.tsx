import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserService } from '../services/user.service'
import LoadingPage from './LoadingPage'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          navigate('/auth')
          return
        }

        if (data.session?.user) {
          // Create or update user in our database
          await UserService.createOrUpdateUser(data.session.user)
          
          // Redirect to home page or intended destination
          const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/'
          sessionStorage.removeItem('redirectAfterAuth')
          navigate(redirectTo)
        } else {
          // No session, redirect to auth
          navigate('/auth')
        }
      } catch (error) {
        console.error('Error in auth callback:', error)
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return <LoadingPage />
}