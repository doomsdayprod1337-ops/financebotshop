const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to require admin access
async function requireAdmin(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      throw new Error('Admin access required');
    }
    
    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

exports.handler = async function(event, context) {
  console.log('News moderation function called with method:', event.httpMethod);

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    // Check admin authentication
    const adminUser = await requireAdmin(event);
    console.log('News moderation request from admin:', adminUser.email);

    if (event.httpMethod === 'GET') {
      return await getModerationData(event, adminUser);
    } else if (event.httpMethod === 'POST') {
      return await moderateComment(event, adminUser);
    } else if (event.httpMethod === 'PUT') {
      return await updateUserRestriction(event, adminUser);
    } else if (event.httpMethod === 'DELETE') {
      return await removeUserRestriction(event, adminUser);
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

  } catch (error) {
    console.error('News moderation error:', error);
    return {
      statusCode: error.message.includes('Authentication') ? 401 : 
                  error.message.includes('Admin access') ? 403 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// Get moderation data (pending comments, user restrictions, etc.)
async function getModerationData(event, adminUser) {
  try {
    const { type } = event.queryStringParameters || {};
    
    if (type === 'pending-comments') {
      // Get pending comments that need moderation
      const { data: pendingComments, error: commentsError } = await supabase
        .from('news_comments')
        .select(`
          id,
          comment,
          created_at,
          news_id,
          user_id,
          users!inner(email, username),
          news!inner(title)
        `)
        .eq('is_approved', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching pending comments:', commentsError);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Failed to fetch pending comments'
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          pendingComments: pendingComments || []
        })
      };
    } else if (type === 'user-restrictions') {
      // Get active user restrictions
      const { data: restrictions, error: restrictionsError } = await supabase
        .from('user_comment_restrictions')
        .select(`
          id,
          restriction_type,
          reason,
          expires_at,
          is_active,
          created_at,
          user_id,
          users!inner(email, username),
          admin_user_id,
          admin_users!inner(email, username)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (restrictionsError) {
        console.error('Error fetching user restrictions:', restrictionsError);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Failed to fetch user restrictions'
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          restrictions: restrictions || []
        })
      };
    } else if (type === 'moderation-history') {
      // Get moderation action history
      const { data: history, error: historyError } = await supabase
        .from('news_comment_moderation')
        .select(`
          id,
          action,
          reason,
          created_at,
          comment_id,
          admin_user_id,
          admin_users!inner(email, username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (historyError) {
        console.error('Error fetching moderation history:', historyError);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: false,
            error: 'Failed to fetch moderation history'
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          history: history || []
        })
      };
    } else {
      // Get overview statistics
      const [pendingComments, activeRestrictions, totalModerations] = await Promise.all([
        supabase
          .from('news_comments')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false)
          .eq('is_deleted', false),
        supabase
          .from('user_comment_restrictions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('news_comment_moderation')
          .select('*', { count: 'exact', head: true })
      ]);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          overview: {
            pendingComments: pendingComments.count || 0,
            activeRestrictions: activeRestrictions.count || 0,
            totalModerations: totalModerations.count || 0
          }
        })
      };
    }
  } catch (error) {
    console.error('Error in getModerationData:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch moderation data'
      })
    };
  }
}

// Moderate a comment (approve, reject, delete)
async function moderateComment(event, adminUser) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { commentId, action, reason } = body;

    if (!commentId || !action) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment ID and action are required'
        })
      };
    }

    if (!['approved', 'rejected', 'deleted'].includes(action)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid action. Must be approved, rejected, or deleted'
        })
      };
    }

    // Get the comment
    const { data: comment, error: fetchError } = await supabase
      .from('news_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment not found'
        })
      };
    }

    // Update comment status
    const updateData = {};
    if (action === 'approved') {
      updateData.is_approved = true;
    } else if (action === 'rejected') {
      updateData.is_approved = false;
    } else if (action === 'deleted') {
      updateData.is_deleted = true;
    }

    const { error: updateError } = await supabase
      .from('news_comments')
      .update(updateData)
      .eq('id', commentId);

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to update comment'
        })
      };
    }

    // Log moderation action
    const { error: logError } = await supabase
      .from('news_comment_moderation')
      .insert([{
        comment_id: commentId,
        admin_user_id: adminUser.id,
        action: action,
        reason: reason || `Admin ${action} comment`
      }]);

    if (logError) {
      console.error('Error logging moderation action:', logError);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: `Comment ${action} successfully`,
        action: action
      })
    };
  } catch (error) {
    console.error('Error in moderateComment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to moderate comment'
      })
    };
  }
}

// Create or update user restriction
async function updateUserRestriction(event, adminUser) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, restrictionType, reason, expiresAt } = body;

    if (!userId || !restrictionType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User ID and restriction type are required'
        })
      };
    }

    if (!['commenting', 'rating', 'both'].includes(restrictionType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid restriction type. Must be commenting, rating, or both'
        })
      };
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        })
      };
    }

    // Deactivate any existing restrictions for this user
    await supabase
      .from('user_comment_restrictions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Create new restriction
    const { data: newRestriction, error: createError } = await supabase
      .from('user_comment_restrictions')
      .insert([{
        user_id: userId,
        admin_user_id: adminUser.id,
        restriction_type: restrictionType,
        reason: reason || `Admin restriction: ${restrictionType}`,
        expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user restriction:', createError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create user restriction'
        })
      };
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'User restriction created successfully',
        restriction: newRestriction
      })
    };
  } catch (error) {
    console.error('Error in updateUserRestriction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create user restriction'
      })
    };
  }
}

// Remove user restriction
async function removeUserRestriction(event, adminUser) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { restrictionId } = body;

    if (!restrictionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Restriction ID is required'
        })
      };
    }

    // Deactivate the restriction
    const { error: updateError } = await supabase
      .from('user_comment_restrictions')
      .update({ is_active: false })
      .eq('id', restrictionId);

    if (updateError) {
      console.error('Error removing user restriction:', updateError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to remove user restriction'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'User restriction removed successfully'
      })
    };
  } catch (error) {
    console.error('Error in removeUserRestriction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to remove user restriction'
      })
    };
  }
}
