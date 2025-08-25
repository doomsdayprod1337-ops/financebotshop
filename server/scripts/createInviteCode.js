const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createDefaultInviteCode = async () => {
  try {
    console.log('🚀 Creating default invite code...\n');
    
    // Check if invite code already exists
    console.log('📋 Checking if invite code already exists...');
    const { data: existingInvite, error: checkError } = await supabase
      .from('invite_codes')
      .select('id, code, is_active, max_uses, current_uses')
      .eq('code', 'GRANDOPEN')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing invite code:', checkError);
      throw checkError;
    }

    if (existingInvite) {
      console.log('✅ Invite code already exists:');
      console.log(`   Code: ${existingInvite.code}`);
      console.log(`   Status: ${existingInvite.is_active ? 'Active' : 'Inactive'}`);
      console.log(`   Uses: ${existingInvite.current_uses}/${existingInvite.max_uses}`);
      return;
    }

    console.log('📋 Creating new default invite code...');
    
    // Create default invite code
    const { data: invite, error: createError } = await supabase
      .from('invite_codes')
      .insert({
        code: 'GRANDOPEN',
        description: 'Grand Opening Invite Code - Unlimited Access',
        is_active: true,
        max_uses: -1, // -1 means unlimited
        current_uses: 0,
        created_by: 'system',
        expires_at: null, // Never expires
        discount_percentage: 0,
        bonus_credits: 0
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating invite code:', createError);
      throw createError;
    }

    console.log('✅ Default invite code created successfully!');
    console.log('📊 Invite Code Details:');
    console.log(`   Code: GRANDOPEN`);
    console.log(`   Status: Active`);
    console.log(`   Max Uses: Unlimited`);
    console.log(`   Current Uses: 0`);
    console.log(`   Expires: Never`);
    console.log(`   ID: ${invite.id}`);

    console.log('\n🎉 Invite code setup completed successfully!');
    console.log('🔑 Users can now register using: GRANDOPEN');

  } catch (error) {
    console.error('\n❌ Failed to create invite code:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Ensure the invite_codes table exists in your database');
    console.log('3. Verify your Supabase service role key has write permissions');
    process.exit(1);
  }
};

// Run the invite code creation
createDefaultInviteCode();
