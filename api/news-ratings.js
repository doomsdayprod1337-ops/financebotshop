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

exports.handler = async function(event, context) {
  console.log('News ratings function called with method:', event.httpMethod);

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
    // Check authentication
    const user = await requireAuth(event);
    console.log('News ratings request from user:', user.email);

    if (event.httpMethod === 'GET') {
      return await getNewsRatings(event, user);
    } else if (event.httpMethod === 'POST') {
      return await createNewsRating(event, user);
    } else if (event.httpMethod === 'PUT') {
      return await updateNewsRating(event, user);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteNewsRating(event, user);
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
    console.error('News ratings error:', error);
    return {
      statusCode: error.message.includes('Authentication') ? 401 : 500,
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

// Get ratings for a specific news article
async function getNewsRatings(event, user) {
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

    // Get all ratings for the news article
    const { data: ratings, error: ratingsError } = await supabase
      .from('news_ratings')
      .select(`
        id,
        rating,
        created_at,
        user_id,
        users!inner(email, username)
      `)
      .eq('news_id', newsId)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch ratings'
        })
      };
    }

    // Get average rating
    const { data: avgRating, error: avgError } = await supabase
      .from('news_ratings')
      .select('rating')
      .eq('news_id', newsId);

    if (avgError) {
      console.error('Error calculating average rating:', avgError);
    }

    const averageRating = avgRating && avgRating.length > 0 
      ? avgRating.reduce((sum, r) => sum + r.rating, 0) / avgRating.length 
      : 0;

    // Get user's own rating if exists
    const { data: userRating, error: userRatingError } = await supabase
      .from('news_ratings')
      .select('rating')
      .eq('news_id', newsId)
      .eq('user_id', user.id)
      .single();

    const userHasRated = !userRatingError && userRating;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        ratings: ratings || [],
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings: ratings ? ratings.length : 0,
        userRating: userHasRated ? userRating.rating : null,
        userHasRated
      })
    };
  } catch (error) {
    console.error('Error in getNewsRatings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch ratings'
      })
    };
  }
}

// Create a new rating
async function createNewsRating(event, user) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { newsId, rating } = body;

    if (!newsId || !rating) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'News ID and rating are required'
        })
      };
    }

    if (rating < 1 || rating > 5) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Rating must be between 1 and 5'
        })
      };
    }

    // Check if user has already rated this news article
    const { data: existingRating, error: checkError } = await supabase
      .from('news_ratings')
      .select('id')
      .eq('news_id', newsId)
      .eq('user_id', user.id)
      .single();

    if (existingRating) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User has already rated this news article'
        })
      };
    }

    // Check if user is restricted from rating
    const { data: restriction, error: restrictionError } = await supabase
      .from('user_comment_restrictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('restriction_type.eq.both,restriction_type.eq.rating')
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
          error: 'User is restricted from rating news articles',
          restriction: {
            type: restriction.restriction_type,
            reason: restriction.reason,
            expiresAt: restriction.expires_at
          }
        })
      };
    }

    // Create the rating
    const { data: newRating, error: createError } = await supabase
      .from('news_ratings')
      .insert([{
        news_id: newsId,
        user_id: user.id,
        rating: rating
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating rating:', createError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create rating'
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
        message: 'Rating created successfully',
        rating: newRating
      })
    };
  } catch (error) {
    console.error('Error in createNewsRating:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create rating'
      })
    };
  }
}

// Update an existing rating (not allowed - users can only rate once)
async function updateNewsRating(event, user) {
  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: false,
      error: 'Rating updates are not allowed. Users can only rate once per article.'
    })
  };
}

// Delete a rating (admin only)
async function deleteNewsRating(event, user) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { ratingId } = body;

    if (!ratingId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Rating ID is required'
        })
      };
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Admin access required'
        })
      };
    }

    // Delete the rating
    const { error: deleteError } = await supabase
      .from('news_ratings')
      .delete()
      .eq('id', ratingId);

    if (deleteError) {
      console.error('Error deleting rating:', deleteError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to delete rating'
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
        message: 'Rating deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error in deleteNewsRating:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete rating'
      })
    };
  }
}
