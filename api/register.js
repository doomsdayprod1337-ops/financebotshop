const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
  console.log('Register function called with method:', event.httpMethod);
  console.log('Environment variables check:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET
  });

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, email, password, inviteCode, referralCode } = JSON.parse(event.body);

    // Validate input
    if (!username || !email || !password || !inviteCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'All fields are required' })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      };
    }

    console.log('Registration attempt for:', email);

    // Check if invite code is valid
    console.log('Checking invite code:', inviteCode);
    try {
      // First check if the invite_codes table exists
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .eq('is_active', true)
        .single();

      console.log('Invite code check result:', { inviteData, inviteError });

      if (inviteError) {
        if (inviteError.code === 'PGRST116') {
          // Table doesn't exist - create a default invite code for development
          console.log('invite_codes table does not exist, creating default code...');
          try {
            const { error: createTableError } = await supabase
              .from('invite_codes')
              .insert({
                code: 'GRANDOPEN',
                is_active: true,
                max_uses: 999999,
                current_uses: 0,
                created_at: new Date().toISOString()
              });
            
            if (createTableError) {
              console.error('Failed to create default invite code:', createTableError);
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'System not properly configured. Please contact support.' })
              };
            }
            
            // Now check the invite code again
            const { data: retryInviteData, error: retryInviteError } = await supabase
              .from('invite_codes')
              .select('*')
              .eq('code', inviteCode)
              .eq('is_active', true)
              .single();
            
            if (retryInviteError || !retryInviteData) {
              return {
                statusCode: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Invalid invite code' })
              };
            }
          } catch (createError) {
            console.error('Error creating default invite code:', createError);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'System not properly configured. Please contact support.' })
            };
          }
        } else {
          // Other database error
          console.error('Database error checking invite code:', inviteError);
          return {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Database error. Please try again.' })
          };
        }
      } else if (!inviteData) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Invalid invite code' })
        };
      }
    } catch (inviteCheckError) {
      console.error('Error checking invite code:', inviteCheckError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Error checking invite code', details: inviteCheckError.message })
      };
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate referral code
    const userReferralCode = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create user
    console.log('Creating user with data:', { username, email, referral_code: userReferralCode });
    let user;
    try {
      const { data: userData, error: createError } = await supabase
        .from('users')
        .insert({
          username,
          email,
          password_hash: passwordHash,
          referral_code: userReferralCode,
          is_verified: true,
          status: 'active',
          wallet_balance: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        
        // If it's a table doesn't exist error, provide helpful message
        if (createError.code === 'PGRST116') {
          return {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              error: 'System not properly configured', 
              message: 'Database tables are missing. Please run the database setup script first.' 
            })
          };
        }
        
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Error creating user', details: createError.message })
        };
      }

      user = userData;
      console.log('User created successfully:', user);
    } catch (userCreateError) {
      console.error('Exception during user creation:', userCreateError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Exception creating user', details: userCreateError.message })
      };
    }

    // Record invite usage
    try {
      await supabase
        .from('invite_usage')
        .insert({
          invite_code: inviteCode,
          used_by: user.id,
          used_at: new Date().toISOString()
        });
    } catch (inviteUsageError) {
      // If invite_usage table doesn't exist, just log it and continue
      console.log('Could not record invite usage (table may not exist):', inviteUsageError.message);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        isAdmin: false
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for:', email);

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: false,
          wallet_balance: 0
        }
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Registration failed. Please try again.' 
      })
    };
  }
};
