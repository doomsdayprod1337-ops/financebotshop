const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    const { path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Extract the specific endpoint
    const endpoint = pathSegments[pathSegments.length - 1];
    
    console.log('Bin Check API: Endpoint requested:', endpoint);

    switch (endpoint) {
      case 'history':
        return await getBinHistory(event);
      case 'stats':
        return await getBinStats(event);
      case 'check':
        return await checkBin(event);
      case 'bulk-check':
        return await bulkCheckBins(event);
      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }

  } catch (error) {
    console.error('Bin Check API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function getBinHistory(event) {
  try {
    // Mock bin check history
    const history = [
      { id: 1, bin: '411111', bank: 'Chase', type: 'Credit', country: 'US', checked_at: new Date().toISOString() },
      { id: 2, bin: '555555', bank: 'Capital One', type: 'Credit', country: 'US', checked_at: new Date().toISOString() }
    ];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        history: history
      })
    };
  } catch (error) {
    throw error;
  }
}

async function getBinStats(event) {
  try {
    // Mock bin check statistics
    const stats = {
      total_checks: 15420,
      today_checks: 342,
      success_rate: 98.5,
      popular_banks: ['Chase', 'Bank of America', 'Wells Fargo']
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        stats: stats
      })
    };
  } catch (error) {
    throw error;
  }
}

async function checkBin(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { bin } = body;

    if (!bin) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'BIN number is required' })
      };
    }

    // Mock BIN check result
    const result = {
      bin: bin,
      bank: 'Sample Bank',
      type: 'Credit',
      level: 'Platinum',
      country: 'US',
      country_code: 'US',
      valid: true,
      checked_at: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        result: result
      })
    };
  } catch (error) {
    throw error;
  }
}

async function bulkCheckBins(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { bins } = body;

    if (!bins || !Array.isArray(bins)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'BINs array is required' })
      };
    }

    // Mock bulk BIN check results
    const results = bins.map(bin => ({
      bin: bin,
      bank: 'Sample Bank',
      type: 'Credit',
      level: 'Standard',
      country: 'US',
      valid: true,
      checked_at: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        results: results
      })
    };
  } catch (error) {
    throw error;
  }
}
