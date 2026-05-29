import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kteuerplrbpphniijzlf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZXVlcnBscmJwcGhuaWlqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODEwNjEsImV4cCI6MjA5NTY1NzA2MX0.iiR2H42m0plrzI7YHvhUmku6f5LYXpElV_iP6iVU3u4'

export const supabase = createClient(supabaseUrl, supabaseKey)