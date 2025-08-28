const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with proper environment variable access
const getSupabaseClient = () => {
  // For Netlify functions, environment variables are available directly
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING'
    });
    throw new Error('Supabase environment variables are not configured. Please check your Netlify environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

module.exports = { getSupabaseClient };
