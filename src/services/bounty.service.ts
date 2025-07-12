import { supabase } from '@/lib/supabase'
import type { Bounty, BountySubmission } from '@/types/supabase'

export class BountyService {
  static async createBounty(bountyData: Partial<Bounty>) {
    const { data, error } = await supabase
      .from('bounties')
      .insert([bountyData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateBounty(id: string, updates: Partial<Bounty>) {
    const { data, error } = await supabase
      .from('bounties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateBountyStatus(id: string, status: 'open' | 'in_review' | 'completed') {
    return this.updateBounty(id, { status })
  }

  static async getBounty(id: string) {
    const { data, error } = await supabase
      .from('bounties')
      .select(`
        *,
        submissions:bounty_submissions(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async listBounties(filters = {}) {
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .match(filters)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async submitBounty(submission: Partial<BountySubmission>) {
    const { data, error } = await supabase
      .from('bounty_submissions')
      .insert([submission])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateSubmissionStatus(
    submissionId: string,
    status: 'in_review' | 'accepted' | 'rejected',
    feedback?: string
  ) {
    const { data, error } = await supabase
      .from('bounty_submissions')
      .update({ 
        status,
        feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getBountySubmissions(bountyId: string) {
    const { data, error } = await supabase
      .from('bounty_submissions')
      .select(`
        *,
        user:users(id, username, full_name, avatar_url)
      `)
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async updateSubmissionCount(bountyId: string) {
    console.log('Updating submission count for bounty:', bountyId)
    
    try {
      // Use RPC call to update submission count via database function
      console.log('Attempting RPC call to update_bounty_submission_count...')
      const { data, error } = await supabase.rpc('update_bounty_submission_count', {
        bounty_id: bountyId
      })
      
      if (error) {
        console.error('RPC call failed:', error)
        console.log('Falling back to direct count calculation...')
        
        // Fallback: just calculate and log the correct count
        const { count, error: countError } = await supabase
          .from('bounty_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('bounty_id', bountyId)

        if (countError) throw countError
        
        console.log('Correct submission count should be:', count)
        console.warn('Unable to update due to RLS policies. Manual intervention needed.')
        
        return { message: `Count should be ${count} but unable to update due to permissions` }
      }
      
      console.log('RPC call succeeded:', data)
      return data
      
    } catch (error) {
      console.error('Error in updateSubmissionCount:', error)
      throw error
    }
  }

  // Test bounty update permissions
  static async testBountyUpdatePermission(bountyId: string) {
    console.log('=== TESTING BOUNTY UPDATE PERMISSION ===')
    
    try {
      // Try a simple update that doesn't change anything meaningful
      const { data, error } = await supabase
        .from('bounties')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bountyId)
        .select()
        
      console.log('Permission test result:', { data, error })
      
      if (error) {
        console.error('Permission denied or other error:', error)
        return false
      }
      
      if (!data || data.length === 0) {
        console.warn('Update succeeded but no data returned - possible RLS policy issue')
        return false
      }
      
      console.log('Update permission: OK')
      return true
    } catch (error) {
      console.error('Permission test failed:', error)
      return false
    }
  }

  // Debug function to test submission count update
  static async debugSubmissionCount(bountyId: string) {
    console.log('=== DEBUGGING SUBMISSION COUNT ===')
    
    // First test permissions
    const hasPermission = await this.testBountyUpdatePermission(bountyId)
    console.log('Has update permission:', hasPermission)
    
    try {
      // Check current bounty state
      const { data: bounty, error: bountyError } = await supabase
        .from('bounties')
        .select('id, title, current_submissions')
        .eq('id', bountyId)
        .single()
        
      if (bountyError) throw bountyError
      console.log('Current bounty state:', bounty)
      
      // Count submissions manually
      const { data: submissions, error: submissionsError } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('bounty_id', bountyId)
        
      if (submissionsError) throw submissionsError
      console.log('Actual submissions in database:', submissions)
      console.log('Actual count:', submissions.length)
      
      // Try to update the count
      console.log('Attempting to update count...')
      const result = await this.updateSubmissionCount(bountyId)
      console.log('Update result:', result)
      
      // Check bounty state after update
      const { data: updatedBounty, error: updatedError } = await supabase
        .from('bounties')
        .select('id, title, current_submissions')
        .eq('id', bountyId)
        .single()
        
      if (updatedError) throw updatedError
      console.log('Bounty state after update:', updatedBounty)
      
      return {
        before: bounty,
        submissions: submissions,
        actualCount: submissions.length,
        after: updatedBounty
      }
    } catch (error) {
      console.error('Debug error:', error)
      throw error
    }
  }
}