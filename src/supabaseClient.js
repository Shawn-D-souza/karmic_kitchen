import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltprkhjsfahvmnhfmdoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cHJraGpzZmFodm1uaGZtZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI0NzUsImV4cCI6MjA3NzcyODQ3NX0.hb81-PF_8BB-c1bse758-V8DazCU-sVf6fiaSJamZv4'

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.error("Supabase URL and Anon Key are not set. Please update src/supabaseClient.js");
  alert("Supabase client is not configured. Please see the console for details.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

