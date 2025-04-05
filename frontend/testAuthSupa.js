import { supabase } from '../frontend/supabaseClient.js';

async function testAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error);
  } else {
    console.log('Session data:', data);
  }
}

testAuth();