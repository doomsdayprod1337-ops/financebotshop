const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async function(event, context) {
  console.log('Content stats function called with method:', event.httpMethod);
  console.log('Environment variables check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      return await getContentStats(event);
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
    console.error('Content stats error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message,
        details: 'Check server logs for more information'
      })
    };
  }
};

async function getContentStats(event) {
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

    // Initialize counts
    let newsCount = 0;
    let wikiCount = 0;
    let totalNewsCount = 0;
    let totalWikiCount = 0;

    try {
      // Get news count - check if table exists first
      const { count: newsCountResult, error: newsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (!newsError && newsCountResult !== null) {
        newsCount = newsCountResult;
      }

      // Get total news count
      const { count: totalNewsCountResult, error: totalNewsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      if (!totalNewsError && totalNewsCountResult !== null) {
        totalNewsCount = totalNewsCountResult;
      }
    } catch (error) {
      console.log('News table not accessible or empty:', error.message);
    }

    try {
      // Get wiki entries count - check if table exists first
      const { count: wikiCountResult, error: wikiError } = await supabase
        .from('wiki_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (!wikiError && wikiCountResult !== null) {
        wikiCount = wikiCountResult;
      }

      // Get total wiki entries count
      const { count: totalWikiCountResult, error: totalWikiError } = await supabase
        .from('wiki_entries')
        .select('*', { count: 'exact', head: true });

      if (!totalWikiError && totalWikiCountResult !== null) {
        totalWikiCount = totalWikiCountResult;
      }
    } catch (error) {
      console.log('Wiki entries table not accessible or empty:', error.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        stats: {
          timePeriod,
          startDate: startDate.toISOString(),
          news: {
            recent: newsCount || 0,
            total: totalNewsCount || 0
          },
          wiki: {
            recent: wikiCount || 0,
            total: totalWikiCount || 0
          }
        }
      })
    };
  } catch (error) {
    console.error('Error in getContentStats:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch content stats',
        details: error.message
      })
    };
  }
}
