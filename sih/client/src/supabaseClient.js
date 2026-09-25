import { createClient } from '@supabase/supabase-js'

// Copy these two keys from your Supabase Project Settings > API dashboard
const supabaseUrl = 'https://ottkmztdxixelqzroahp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dGttenRkeGl4ZWxxenJvYWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTk0NTEsImV4cCI6MjEwNTkzNTQ1MX0.NLpjaa_cQlmsEZ52mVTCi_0yqSTC1SPDpEQsVbEIrTc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)