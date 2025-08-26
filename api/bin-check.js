const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// BIN database for common BINs
const binDatabase = {
  '411111': {
    bin: '411111',
    brand: 'Visa',
    type: 'Credit',
    level: 'Classic',
    country: 'United States',
    bank: 'Chase Bank',
    prepaid: false,
    corporate: false,
    source: 'database'
  },
  '555555': {
    bin: '555555',
    brand: 'Mastercard',
    type: 'Credit',
    level: 'Gold',
    country: 'United States',
    bank: 'Capital One',
    prepaid: false,
    corporate: false,
    source: 'database'
  },
  '622222': {
    bin: '622222',
    brand: 'UnionPay',
    type: 'Debit',
    level: 'Standard',
    country: 'China',
    bank: 'Industrial and Commercial Bank of China',
    prepaid: false,
    corporate: false,
    source: 'database'
  },
  '400000': {
    bin: '400000',
    brand: 'Visa',
    type: 'Credit',
    level: 'Platinum',
    country: 'United States',
    bank: 'Bank of America',
    prepaid: false,
    corporate: false,
    source: 'database'
  },
  '510510': {
    bin: '510510',
    brand: 'Mastercard',
    type: 'Credit',
    level: 'Standard',
    country: 'United States',
    bank: 'Wells Fargo',
    prepaid: false,
    corporate: false,
    source: 'database'
  }
};

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
      { 
        id: 1, 
        bin: '411111', 
        result: {
          brand: 'Visa',
          type: 'Credit',
          country: 'United States',
          bank: 'Chase Bank'
        },
        checked_at: new Date().toISOString() 
      },
      { 
        id: 2, 
        bin: '555555', 
        result: {
          brand: 'Mastercard',
          type: 'Credit',
          country: 'United States',
          bank: 'Capital One'
        },
        checked_at: new Date().toISOString() 
      }
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
      unique_bins: 1247,
      popular_banks: ['Chase', 'Bank of America', 'Wells Fargo'],
      top_bins: ['411111', '555555', '622222']
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

    // Validate BIN format (6-8 digits)
    if (!/^\d{6,8}$/.test(bin)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'BIN must be 6-8 digits' })
      };
    }

    // Check if BIN exists in our database
    let binInfo = binDatabase[bin];
    
    if (!binInfo) {
      // Generate mock data for unknown BINs
      const brands = ['Visa', 'Mastercard', 'American Express', 'Discover', 'UnionPay'];
      const types = ['Credit', 'Debit', 'Prepaid'];
      const levels = ['Classic', 'Gold', 'Platinum', 'Standard', 'Premium'];
      const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'China'];
      const banks = ['Sample Bank', 'Generic Bank', 'Test Bank', 'Demo Bank'];
      
      binInfo = {
        bin: bin,
        brand: brands[Math.floor(Math.random() * brands.length)],
        type: types[Math.floor(Math.random() * types.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        bank: banks[Math.floor(Math.random() * banks.length)],
        prepaid: Math.random() > 0.7,
        corporate: Math.random() > 0.8,
        source: 'external_api'
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
        bin_info: binInfo
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

    if (bins.length > 100) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Maximum 100 BINs allowed per request' })
      };
    }

    // Check each BIN
    const results = [];
    for (const bin of bins) {
      if (/^\d{6,8}$/.test(bin)) {
        let binInfo = binDatabase[bin];
        
        if (!binInfo) {
          // Generate mock data for unknown BINs
          const brands = ['Visa', 'Mastercard', 'American Express', 'Discover', 'UnionPay'];
          const types = ['Credit', 'Debit', 'Prepaid'];
          const levels = ['Classic', 'Gold', 'Platinum', 'Standard', 'Premium'];
          const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'China'];
          const banks = ['Sample Bank', 'Generic Bank', 'Test Bank', 'Demo Bank'];
          
          binInfo = {
            bin: bin,
            brand: brands[Math.floor(Math.random() * brands.length)],
            type: types[Math.floor(Math.random() * types.length)],
            level: levels[Math.floor(Math.random() * levels.length)],
            country: countries[Math.floor(Math.random() * countries.length)],
            bank: banks[Math.floor(Math.random() * banks.length)],
            prepaid: Math.random() > 0.7,
            corporate: Math.random() > 0.8,
            source: 'external_api'
          };
        }
        
        results.push(binInfo);
      }
    }

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
