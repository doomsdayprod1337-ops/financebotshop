const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to require authentication
async function requireAuth(event) {
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
    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

// Helper function to require admin access
async function requireAdmin(event) {
  const user = await requireAuth(event);
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.is_admin) {
    throw new Error('Admin access required');
  }
  
  return user;
}

exports.handler = async function(event, context) {
  console.log('News comments function called with method:', event.httpMethod);

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
    if (event.httpMethod === 'GET') {
      // Public endpoint - no auth required
      return await getNewsComments(event);
    } else if (event.httpMethod === 'POST') {
      // Create comment - requires auth
      const user = await requireAuth(event);
      return await createNewsComment(event, user);
    } else if (event.httpMethod === 'PUT') {
      // Update comment - requires auth (own comment) or admin
      const user = await requireAuth(event);
      return await updateNewsComment(event, user);
    } else if (event.httpMethod === 'DELETE') {
      // Delete comment - requires auth (own comment) or admin
      const user = await requireAuth(event);
      return await deleteNewsComment(event, user);
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
    console.error('News comments error:', error);
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

// Get comments for a specific news article
async function getNewsComments(event) {
  try {
    const { newsId } = event.queryStringParameters || {};
    
    if (!newsId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'News ID is required'
        })
      };
    }

    // Get approved comments for the news article
    const { data: comments, error: commentsError } = await supabase
      .from('news_comments')
      .select(`
        id,
        comment,
        created_at,
        updated_at,
        user_id,
        users!inner(email, username)
      `)
      .eq('news_id', newsId)
      .eq('is_approved', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch comments'
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
        comments: comments || [],
        totalComments: comments ? comments.length : 0
      })
    };
  } catch (error) {
    console.error('Error in getNewsComments:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch comments'
      })
    };
  }
}

// Create a new comment
async function createNewsComment(event, user) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { newsId, comment } = body;

    if (!newsId || !comment) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'News ID and comment are required'
        })
      };
    }

    if (comment.trim().length < 3) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment must be at least 3 characters long'
        })
      };
    }

    if (comment.trim().length > 1000) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment must be less than 1000 characters'
        })
      };
    }

    // Check if user is restricted from commenting
    const { data: restriction, error: restrictionError } = await supabase
      .from('user_comment_restrictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('restriction_type.eq.both,restriction_type.eq.commenting')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (restriction && !restrictionError) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User is restricted from commenting on news articles',
          restriction: {
            type: restriction.restriction_type,
            reason: restriction.reason,
            expiresAt: restriction.expires_at
          }
        })
      };
    }

    // Create the comment
    const { data: newComment, error: createError } = await supabase
      .from('news_comments')
      .insert([{
        news_id: newsId,
        user_id: user.id,
        comment: comment.trim()
      }])
      .select(`
        id,
        comment,
        created_at,
        user_id,
        users!inner(email, username)
      `)
      .single();

    if (createError) {
      console.error('Error creating comment:', createError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create comment'
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
        message: 'Comment created successfully',
        comment: newComment
      })
    };
  } catch (error) {
    console.error('Error in createNewsComment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create comment'
      })
    };
  }
}

// Update a comment (only own comment or admin)
async function updateNewsComment(event, user) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { commentId, comment } = body;

    if (!commentId || !comment) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment ID and comment are required'
        })
      };
    }

    if (comment.trim().length < 3) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment must be at least 3 characters long'
        })
      };
    }

    if (comment.trim().length > 1000) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment must be less than 1000 characters'
        })
      };
    }

    // Get the comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('news_comments')
      .select('user_id, is_deleted')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
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

    if (existingComment.is_deleted) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Cannot update deleted comment'
        })
      };
    }

    // Check if user is admin or owns the comment
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = !profileError && userProfile?.is_admin;
    const isOwner = existingComment.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'You can only edit your own comments'
        })
      };
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('news_comments')
      .update({
        comment: comment.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        id,
        comment,
        created_at,
        updated_at,
        user_id,
        users!inner(email, username)
      `)
      .single();

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Comment updated successfully',
        comment: updatedComment
      })
    };
  } catch (error) {
    console.error('Error in updateNewsComment:', error);
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
}

// Delete a comment (only own comment or admin)
async function deleteNewsComment(event, user) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { commentId } = body;

    if (!commentId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment ID is required'
        })
      };
    }

    // Get the comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('news_comments')
      .select('user_id, is_deleted')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
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

    if (existingComment.is_deleted) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Comment is already deleted'
        })
      };
    }

    // Check if user is admin or owns the comment
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = !profileError && userProfile?.is_admin;
    const isOwner = existingComment.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'You can only delete your own comments'
        })
      };
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from('news_comments')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to delete comment'
        })
      };
    }

    // Log admin action if admin deleted someone else's comment
    if (isAdmin && !isOwner) {
      await supabase
        .from('news_comment_moderation')
        .insert([{
          comment_id: commentId,
          admin_user_id: user.id,
          action: 'deleted',
          reason: 'Admin deletion'
        }]);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Comment deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error in deleteNewsComment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete comment'
      })
    };
  }
}
