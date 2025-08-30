const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check if user is admin
async function requireAdmin(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      throw new Error('Authentication required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.is_admin && decoded.role !== 'admin' && !decoded.isAdmin) {
      throw new Error('Admin access required');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

exports.handler = async function(event, context) {
  console.log('News management function called with method:', event.httpMethod);

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
    console.log('News management request from admin:', adminUser.email);

    if (event.httpMethod === 'GET') {
      // Check if this is a count request
      if (event.queryStringParameters && event.queryStringParameters.count === 'true') {
        return await getNewsCount(event);
      }
      return await getNews();
    } else if (event.httpMethod === 'POST') {
      return await createNews(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateNews(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteNews(event);
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
    console.error('News management error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized', message: error.message })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: 'Check server logs for more information'
      })
    };
  }
};

async function getNews() {
  try {
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching news:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch news',
          details: error.message
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
        news: news || []
      })
    };
  } catch (error) {
    console.error('Error in getNews:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch news',
        details: error.message
      })
    };
  }
}

async function getNewsCount(event) {
  try {
    const queryParams = event.queryStringParameters || {};
    const timePeriod = queryParams.timePeriod || '7d'; // Default to 7 days
    
    let startDate;
    const now = new Date();
    
    switch (timePeriod) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { count, error } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching news count:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch news count',
          details: error.message
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
        count: count || 0,
        timePeriod,
        startDate: startDate.toISOString()
      })
    };
  } catch (error) {
    console.error('Error in getNewsCount:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch news count',
        details: error.message
      })
    };
  }
}

async function createNews(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, content, category, fullContent } = body;

    if (!title || !content || !category) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields',
          required: ['title', 'content', 'category']
        })
      };
    }

    const newsData = {
      title,
      content,
      category,
      full_content: fullContent || content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: news, error } = await supabase
      .from('news')
      .insert([newsData])
      .select()
      .single();

    if (error) {
      console.error('Error creating news:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create news',
          details: error.message
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
        message: 'News created successfully',
        news
      })
    };
  } catch (error) {
    console.error('Error in createNews:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create news',
        details: error.message
      })
    };
  }
}

async function updateNews(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, title, content, category, fullContent } = body;

    if (!id || !title || !content || !category) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields',
          required: ['id', 'title', 'content', 'category']
        })
      };
    }

    const updateData = {
      title,
      content,
      category,
      full_content: fullContent || content,
      updated_at: new Date().toISOString()
    };

    const { data: news, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating news:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to update news',
          details: error.message
        })
      };
    }

    if (!news) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'News not found'
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
        message: 'News updated successfully',
        news
      })
    };
  } catch (error) {
    console.error('Error in updateNews:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update news',
        details: error.message
      })
    };
  }
}

async function deleteNews(event) {
  try {
    const { id } = JSON.parse(event.body || '{}');

    if (!id) {
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

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting news:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to delete news',
          details: error.message
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
        message: 'News deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error in deleteNews:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete news',
        details: error.message
      })
    };
  }
}
