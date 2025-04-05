// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsoecuximpkaxogkfppa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzb2VjdXhpbXBrYXhvZ2tmcHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Mzc5ODMsImV4cCI6MjA1OTMxMzk4M30.JPBCK10lETZPGoJcxW1B7frJyhGVKNdNQbm5bGdgNvE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error) {
    console.log('Error signing in with Google:', error.message)
  }
}