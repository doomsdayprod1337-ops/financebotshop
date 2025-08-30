const { getSupabaseClient } = require('./supabase-client');

// Helper function to check if user is admin
async function requireAdmin(event) {
  try {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { isAdmin: false, error: 'No token provided' };
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { isAdmin: false, error: 'Invalid token' };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return { isAdmin: false, error: 'Admin access required' };
    }

    return { isAdmin: true, user };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, error: 'Internal server error' };
  }
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
        if (pathParts.length === 2) {
          // /api/finance-documents - admin only, get all documents
          const adminCheck = await requireAdmin(event);
          if (!adminCheck.isAdmin) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ success: false, error: adminCheck.error || 'Admin access required' })
            };
          }
          return await getAllFinanceDocuments(supabase);
        } else if (action === 'user-view') {
          // /api/finance-documents/user-view - public, filtered view
          return await getUserViewFinanceDocuments(supabase);
        } else if (action === 'count') {
          // /api/finance-documents/count - admin only
          const adminCheck = await requireAdmin(event);
          if (!adminCheck.isAdmin) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ success: false, error: adminCheck.error || 'Admin access required' })
            };
          }
          return await getFinanceDocumentCount(supabase);
        } else {
          // Unknown action, return 404
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Endpoint not found' })
          };
        }
      
      case 'POST':
        if (action === 'bulk-create') {
          // /api/finance-documents/bulk-create - admin only
          const adminCheck = await requireAdmin(event);
          if (!adminCheck.isAdmin) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ success: false, error: adminCheck.error || 'Admin access required' })
            };
          }
          return await bulkCreateFinanceDocuments(supabase, event);
        } else {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Invalid action' })
          };
        }
      
      case 'DELETE':
        if (pathParts.length === 3) {
          // /api/finance-documents/:id - admin only
          const adminCheck = await requireAdmin(event);
          if (!adminCheck.isAdmin) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ success: false, error: adminCheck.error || 'Admin access required' })
            };
          }
          const id = pathParts[2];
          return await deleteFinanceDocument(supabase, id);
        } else {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Invalid delete request' })
          };
        }
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in finance-documents handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};

// Helper functions
async function getAllFinanceDocuments(supabase) {
  try {
    const { data, error } = await supabase
      .from('finance_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching finance documents:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Failed to fetch finance documents' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, financeDocuments: data })
    };
  } catch (error) {
    console.error('Error in getAllFinanceDocuments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function getUserViewFinanceDocuments(supabase) {
  try {
    const { data, error } = await supabase
      .from('finance_documents')
      .select('id, reference_number, city, state, zip_code, balance, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching finance documents for user view:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Failed to fetch finance documents' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, financeDocuments: data })
    };
  } catch (error) {
    console.error('Error in getUserViewFinanceDocuments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function bulkCreateFinanceDocuments(supabase, event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { data } = body;
    
    if (!data || !Array.isArray(data)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Data array is required' })
      };
    }

    const documents = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const line = data[i].trim();
      if (!line) continue;

      try {
        const parts = line.split('|');
        if (parts.length !== 8) {
          errors.push(`Line ${i + 1}: Invalid format. Expected 8 parts, got ${parts.length}`);
          continue;
        }

        const [accountNumber, referenceNumber, address, city, state, zipCode, balance, downloadLink] = parts;

        // Validate required fields
        if (!accountNumber || !referenceNumber || !address || !city || !state || !zipCode || !balance || !downloadLink) {
          errors.push(`Line ${i + 1}: All fields are required`);
          continue;
        }

        // Validate balance is a number
        const balanceNum = parseFloat(balance);
        if (isNaN(balanceNum)) {
          errors.push(`Line ${i + 1}: Invalid balance format`);
          continue;
        }

        documents.push({
          account_number: accountNumber.trim(),
          reference_number: referenceNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip_code: zipCode.trim(),
          balance: balanceNum,
          download_link: downloadLink.trim()
        });
      } catch (parseError) {
        errors.push(`Line ${i + 1}: Parse error - ${parseError.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Validation errors found', 
          errors 
        })
      };
    }

    if (documents.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'No valid documents to create' })
      };
    }

    // Insert documents into database
    const { data: insertedDocs, error: insertError } = await supabase
      .from('finance_documents')
      .insert(documents)
      .select();

    if (insertError) {
      console.error('Error inserting finance documents:', insertError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Failed to create finance documents' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: `Successfully created ${insertedDocs.length} finance documents`,
        createdCount: insertedDocs.length,
        documents: insertedDocs
      })
    };

  } catch (error) {
    console.error('Error in bulkCreateFinanceDocuments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function deleteFinanceDocument(supabase, id) {
  try {
    const { error } = await supabase
      .from('finance_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting finance document:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Failed to delete finance document' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Finance document deleted successfully' })
    };
  } catch (error) {
    console.error('Error in deleteFinanceDocument:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function getFinanceDocumentCount(supabase) {
  try {
    const { count, error } = await supabase
      .from('finance_documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting finance document count:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Failed to get count' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, count })
    };
  } catch (error) {
    console.error('Error in getFinanceDocumentCount:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}
