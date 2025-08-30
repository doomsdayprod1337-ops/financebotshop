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
  console.log('Wiki management function called with method:', event.httpMethod);

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
    console.log('Wiki management request from admin:', adminUser.email);

    if (event.httpMethod === 'GET') {
      // Check if this is a count request
      if (event.queryStringParameters && event.queryStringParameters.count === 'true') {
        return await getWikiEntriesCount(event);
      }
      return await getWikiEntries();
    } else if (event.httpMethod === 'POST') {
      return await createWikiEntry(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateWikiEntry(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteWikiEntry(event);
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
    console.error('Wiki management error:', error);
    
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

async function getWikiEntries() {
  try {
    const { data: wikiEntries, error } = await supabase
      .from('wiki_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wiki entries:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch wiki entries',
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
        wikiEntries: wikiEntries || []
      })
    };
  } catch (error) {
    console.error('Error in getWikiEntries:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch wiki entries',
        details: error.message
      })
    };
  }
}

async function getWikiEntriesCount(event) {
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
      .from('wiki_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching wiki entries count:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch wiki entries count',
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
    console.error('Error in getWikiEntriesCount:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch wiki entries count',
        details: error.message
      })
    };
  }
}

async function createWikiEntry(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, content, category, section, subsections, steps, details } = body;

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

    const wikiData = {
      title,
      content,
      category,
      section: section || null,
      subsections: subsections || null,
      steps: steps || null,
      details: details || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: wikiEntry, error } = await supabase
      .from('wiki_entries')
      .insert([wikiData])
      .select()
      .single();

    if (error) {
      console.error('Error creating wiki entry:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to create wiki entry',
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
        message: 'Wiki entry created successfully',
        wikiEntry
      })
    };
  } catch (error) {
    console.error('Error in createWikiEntry:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create wiki entry',
        details: error.message
      })
    };
  }
}

async function updateWikiEntry(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, title, content, category, section, subsections, steps, details } = body;

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
      section: section || null,
      subsections: subsections || null,
      steps: steps || null,
      details: details || null,
      updated_at: new Date().toISOString()
    };

    const { data: wikiEntry, error } = await supabase
      .from('wiki_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wiki entry:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to update wiki entry',
          details: error.message
        })
      };
    }

    if (!wikiEntry) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Wiki entry not found'
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
        message: 'Wiki entry updated successfully',
        wikiEntry
      })
    };
  } catch (error) {
    console.error('Error in updateWikiEntry:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update wiki entry',
        details: error.message
      })
    };
  }
}

async function deleteWikiEntry(event) {
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
          error: 'Wiki entry ID is required'
        })
      };
    }

    const { error } = await supabase
      .from('wiki_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wiki entry:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to delete wiki entry',
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
        message: 'Wiki entry deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error in deleteWikiEntry:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete wiki entry',
        details: error.message
      })
    };
  }
}
