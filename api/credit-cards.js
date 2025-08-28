const { getSupabaseClient } = require('./supabase-client');
const crypto = require('crypto');

// Helper function to determine card type based on card number
function getCardType(cardNumber) {
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  
  if (/^4/.test(cleanNumber)) {
    return 'Visa';
  } else if (/^5[1-5]/.test(cleanNumber)) {
    return 'Mastercard';
  } else if (/^3[47]/.test(cleanNumber)) {
    return 'American Express';
  } else if (/^6/.test(cleanNumber)) {
    return 'Discover';
  } else if (/^2/.test(cleanNumber)) {
    return 'Mastercard (2-series)';
  } else {
    return 'Unknown';
  }
}

// Helper function to generate card number hash
function generateCardHash(cardNumber) {
  return crypto.createHash('sha256').update(cardNumber).digest('hex');
}

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
          details: supabaseError.message,
          hint: 'Check if SUPABASE_URL and SUPABASE_ANON_KEY are set in Netlify environment variables'
        })
      };
    }
    
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      case 'GET':
        // Handle both /api/credit-cards and /api/credit-cards/action
        if (pathParts.length === 2) {
          // Just /api/credit-cards - return available cards
          return await getAvailableCreditCards(event);
        } else if (action === 'list') {
          return await getCreditCards(event);
        } else if (action === 'available') {
          return await getAvailableCreditCards(event);
        } else if (action === 'stats') {
          return await getCreditCardStats(event);
        } else if (action === 'debug') {
          return await debugCreditCards(event);
        } else if (action === 'test-connection') {
          return await testConnection(event);
        } else {
          // Unknown action, return available cards as default
          return await getAvailableCreditCards(event);
        }
      
      case 'POST':
        if (action === 'import') {
          return await importCreditCards(event);
        } else if (action === 'bulk-import') {
          return await bulkImportCreditCards(event);
        } else {
          return await importCreditCards(event); // Default to import
        }
      
      case 'PUT':
        if (action === 'update') {
          return await updateCreditCard(event);
        } else if (action === 'update-price') {
          return await updateCreditCardPrice(event);
        } else {
          return await updateCreditCard(event); // Default to update
        }
      
      case 'DELETE':
        if (action === 'delete') {
          return await deleteCreditCard(event);
        } else if (action === 'bulk-delete') {
          return await bulkDeleteCreditCards(event);
        } else {
          return await deleteCreditCard(event); // Default to delete
        }
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Credit card API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// Get all credit cards (admin only)
async function getCreditCards(event) {
  try {

    // Check authorization (admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 50;
    const status = queryParams.status;
    const search = queryParams.search;

    let query = supabase
      .from('credit_cards')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`card_number.ilike.%${search}%,card_type.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by imported_at desc
    query = query.order('imported_at', { ascending: false });

    const { data: creditCards, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: creditCards,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting credit cards:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get credit cards' })
    };
  }
}

// Get available credit cards (for users to purchase)
async function getAvailableCreditCards(event) {
  try {

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const minPrice = queryParams.minPrice;
    const maxPrice = queryParams.maxPrice;
    const search = queryParams.search;

    // First, let's check what's actually in the credit_cards table
    const { data: allCards, error: allCardsError } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(5);

    if (allCardsError) {
      console.error('Error checking all cards:', allCardsError);
    } else {
      console.log('All cards in database:', allCards);
    }

    // Try to query the view first, fallback to direct table query
    let query = supabase
      .from('available_credit_cards')
      .select('*', { count: 'exact' });

    // Apply price filters
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Apply search
    if (search) {
      query = query.or(`card_number.ilike.%${search}%,card_type.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by price asc for users
    query = query.order('price', { ascending: true });

    let { data: creditCards, error, count } = await query;

    // If view is empty, try direct table query
    if (error || !creditCards || creditCards.length === 0) {
      console.log('View query failed or empty, trying direct table query...');
      
      query = supabase
        .from('credit_cards')
        .select('*', { count: 'exact' })
        .eq('status', 'available');

      // Apply price filters
      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice));
      }
      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice));
      }

      // Apply search
      if (search) {
        query = query.or(`card_number.ilike.%${search}%,card_type.ilike.%${search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Order by price asc for users
      query = query.order('price', { ascending: true });

      const result = await query;
      creditCards = result.data;
      error = result.error;
      count = result.count;
    }

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: creditCards || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting available credit cards:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get available credit cards' })
    };
  }
}

// Debug endpoint to check database contents
async function debugCreditCards(event) {
  try {

    // Check what's in the credit_cards table
    const { data: allCards, error: allCardsError } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(10);

    if (allCardsError) {
      throw allCardsError;
    }

    // Check what's in the available_credit_cards view
    const { data: availableCards, error: availableError } = await supabase
      .from('available_credit_cards')
      .select('*')
      .limit(10);

    // Get table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        debug: {
          totalCards: allCards?.length || 0,
          availableCards: availableCards?.length || 0,
          sampleCards: allCards?.slice(0, 3) || [],
          sampleAvailable: availableCards?.slice(0, 3) || [],
          tableColumns: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
          errors: {
            allCards: allCardsError?.message,
            availableCards: availableError?.message,
            tableInfo: tableError?.message
          }
        }
      })
    };
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Debug endpoint failed',
        details: error.message 
      })
    };
  }
}

// Import credit cards (admin only)
async function importCreditCards(event) {
  try {

    // Check authorization (admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

         const body = JSON.parse(event.body || '{}');
     const { cards, delimiter } = body;

     console.log('Received import request:', { 
       cardsCount: cards?.length || 0, 
       delimiter,
       sampleCard: cards?.[0]
     });

     if (!cards || !Array.isArray(cards) || cards.length === 0) {
       return {
         statusCode: 400,
         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
         body: JSON.stringify({ error: 'Cards array is required' })
       };
     }

    // Process and validate cards
    const validCards = [];
    const invalidCards = [];
    const expiredCards = [];
    const duplicateCards = [];

         for (const card of cards) {
       // Basic validation - only require cardNumber, month, year, and price
       if (!card.cardNumber || !card.month || !card.year) {
         invalidCards.push({ card, reason: 'Missing required fields: cardNumber, month, year' });
         continue;
       }

       // Validate card number format (14-17 digits)
       const cleanNumber = card.cardNumber.replace(/\s+/g, '').replace(/-/g, '');
       if (!/^\d{14,17}$/.test(cleanNumber)) {
         invalidCards.push({ card, reason: 'Invalid card number format' });
         continue;
       }

       // Validate expiry
       const currentDate = new Date();
       const currentYear = currentDate.getFullYear() % 100;
       const currentMonth = currentDate.getMonth() + 1;
       
       const expMonth = parseInt(card.month);
       const expYear = parseInt(card.year);
       
       if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
         expiredCards.push({ card, reason: 'Card expired' });
         continue;
       }

       // Validate month and year format
       if (expMonth < 1 || expMonth > 12) {
         invalidCards.push({ card, reason: 'Invalid month' });
         continue;
       }

      // Format card number with spaces for display
      const formattedCardNumber = cleanNumber.replace(/(\d{4})/g, '$1 ').trim();

      // Check if card number already exists in database
      const { data: existingCard, error: checkError } = await supabase
        .from('credit_cards')
        .select('id, card_number, status')
        .eq('card_number', formattedCardNumber)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for duplicate card:', checkError);
        invalidCards.push({ card, reason: 'Database error during duplicate check' });
        continue;
      }

      if (existingCard) {
        duplicateCards.push({ 
          card, 
          reason: 'Card number already exists',
          existingId: existingCard.id,
          existingStatus: existingCard.status
        });
        continue;
      }

      // Generate a hash for the card number
      const cardNumberHash = generateCardHash(formattedCardNumber);
      
      // Determine card type based on card number
      const cardType = getCardType(formattedCardNumber);
      
      validCards.push({
        card_number: formattedCardNumber,
        card_number_hash: cardNumberHash,
        card_type: cardType,
        expiry_month: parseInt(card.month),
        expiry_year: parseInt(card.year),
        is_active: true,
        price: card.price || 0.00,
        status: 'available'
      });
    }

         // Insert valid cards
     let insertedCards = [];
     if (validCards.length > 0) {
       console.log('Attempting to insert cards:', JSON.stringify(validCards, null, 2));
       
       const { data, error } = await supabase
         .from('credit_cards')
         .insert(validCards)
         .select();

       if (error) {
         console.error('Database insert error:', error);
         throw error;
       }

       insertedCards = data;
       console.log('Successfully inserted cards:', insertedCards.length);
     }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `Successfully imported ${validCards.length} credit cards`,
        data: {
          imported: insertedCards,
          invalid: invalidCards,
          expired: expiredCards,
          duplicates: duplicateCards
        },
        summary: {
          total: cards.length,
          valid: validCards.length,
          invalid: invalidCards.length,
          expired: expiredCards.length,
          duplicates: duplicateCards.length
        }
      })
    };
  } catch (error) {
    console.error('Error importing credit cards:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to import credit cards' })
    };
  }
}

// Update credit card (admin only)
async function updateCreditCard(event) {
  try {

    // Check authorization (admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { id, updates } = body;

    if (!id || !updates) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Card ID and updates are required' })
      };
    }

    // Update the credit card
    const { data, error } = await supabase
      .from('credit_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Credit card updated successfully',
        data
      })
    };
  } catch (error) {
    console.error('Error updating credit card:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to update credit card' })
    };
  }
}

// Delete credit card (admin only)
async function deleteCreditCard(event) {
  try {

    // Check authorization (admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { id } = body;

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Card ID is required' })
      };
    }

    // Delete the credit card
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Credit card deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to delete credit card' })
    };
  }
}

// Get credit card statistics (admin only)
async function getCreditCardStats(event) {
  try {

    // Check authorization (admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('credit_cards')
      .select('status')
      .in('status', ['available', 'sold', 'expired', 'invalid']);

    if (statusError) {
      throw statusError;
    }

    // Count by status
    const stats = {
      total: statusCounts.length,
      available: statusCounts.filter(card => card.status === 'available').length,
      sold: statusCounts.filter(card => card.status === 'sold').length,
      expired: statusCounts.filter(card => card.status === 'expired').length,
      invalid: statusCounts.filter(card => card.status === 'invalid').length
    };

    // Get total value
    const { data: totalValue, error: valueError } = await supabase
      .from('credit_cards')
      .select('price')
      .eq('status', 'available');

    if (valueError) {
      throw valueError;
    }

    stats.totalValue = totalValue.reduce((sum, card) => sum + parseFloat(card.price || 0), 0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: stats
      })
    };
  } catch (error) {
    console.error('Error getting credit card stats:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get credit card statistics' })
    };
  }
}

// Test database connection
async function testConnection(event) {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('credit_cards')
      .select('count')
      .limit(1);

    if (testError) {
      throw testError;
    }

    // Test if we can access the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Database connection test successful',
        data: {
          connection: 'SUCCESS',
          tableAccess: tableError ? 'FAILED' : 'SUCCESS',
          tableError: tableError?.message || null,
          timestamp: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Connection test failed',
        details: error.message,
        hint: 'Check database connection and table permissions'
      })
    };
  }
}

// Placeholder functions for other operations
async function bulkImportCreditCards(event) {
  // Similar to importCreditCards but for bulk operations
  return await importCreditCards(event);
}

async function updateCreditCardPrice(event) {
  // Similar to updateCreditCard but specifically for price updates
  return await updateCreditCard(event);
}

async function bulkDeleteCreditCards(event) {
  // Similar to deleteCreditCard but for bulk deletions
  return await deleteCreditCard(event);
}
