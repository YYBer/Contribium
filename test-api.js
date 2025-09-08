// Quick API test script
// Run with: node test-api.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wawxluhjdnqewiaexvvk.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAPI() {
  console.log('🚀 Testing Contribium API...')
  
  try {
    // Test 1: Get bounties (public endpoint)
    console.log('\n📝 Testing: Get Bounties')
    const { data: bounties, error: bountiesError } = await supabase
      .from('bounties')
      .select('*')
      .limit(5)
    
    if (bountiesError) {
      console.error('❌ Bounties Error:', bountiesError)
    } else {
      console.log('✅ Bounties found:', bounties?.length || 0)
    }

    // Test 2: Get projects (public endpoint)
    console.log('\n📂 Testing: Get Projects')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5)
    
    if (projectsError) {
      console.error('❌ Projects Error:', projectsError)
    } else {
      console.log('✅ Projects found:', projects?.length || 0)
    }

    // Test 3: Get sponsors (public endpoint)
    console.log('\n🏢 Testing: Get Sponsors')
    const { data: sponsors, error: sponsorsError } = await supabase
      .from('sponsors')
      .select('*')
      .limit(5)
    
    if (sponsorsError) {
      console.error('❌ Sponsors Error:', sponsorsError)
    } else {
      console.log('✅ Sponsors found:', sponsors?.length || 0)
    }

    // Test 4: Check authentication requirement
    console.log('\n🔐 Testing: Authentication Check')
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User authenticated:', !!user)

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testAPI()