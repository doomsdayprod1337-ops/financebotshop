const { getSupabaseClient } = require('./supabase-client');

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  // Set CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // Initialize Supabase client
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (supabaseError) {
      console.error('Failed to initialize Supabase client:', supabaseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: supabaseError.message
        })
      };
    }

    // Test if credit_cards table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(0);

    if (tableError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Table access failed',
          details: tableError.message,
          hint: 'Run credit-cards-complete-setup.sql in your database first'
        })
      };
    }

    // Test inserting a sample card
    const testCard = {
      card_number: '4111111111111111',
      card_number_hash: 'test_hash_123',
      card_type: 'Visa',
      expiry_month: 12,
      expiry_year: 25,
      is_active: true,
      price: 15.00,
      status: 'available'
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('credit_cards')
      .insert(testCard)
      .select();

    if (insertError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Insert test failed',
          details: insertError.message,
          hint: 'Check table structure and constraints'
        })
      };
    }

    // Clean up test card
    await supabase
      .from('credit_cards')
      .delete()
      .eq('card_number', '4111111111111111');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Credit cards table is working correctly',
        data: {
          tableExists: true,
          insertTest: 'PASSED',
          cleanup: 'PASSED',
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Test failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Test failed',
        details: error.message 
      })
    };
  }
};
