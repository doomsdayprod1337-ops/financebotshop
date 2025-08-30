const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No valid authorization token provided' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    if (!user.is_admin && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get checker file configurations
      const { file_id, status } = event.queryStringParameters || {};
      
      let query = supabase
        .from('checker_files')
        .select(`
          id,
          filename,
          original_name,
          file_type,
          file_size,
          metadata,
          configuration,
          status,
          uploaded_by,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (file_id) {
        query = query.eq('id', file_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: files, error } = await query;

      if (error) {
        console.error('Error fetching checker files:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch checker files' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          files: files || [],
          total: files?.length || 0
        })
      };

    } else if (event.httpMethod === 'POST') {
      // Create new checker file configuration
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }

      const { file_id, configuration } = body;

      if (!file_id || !configuration) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File ID and configuration are required' })
        };
      }

      // Validate configuration
      const validationError = validateConfiguration(configuration);
      if (validationError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: validationError })
        };
      }

      // Update the checker file with configuration
      const { data: updatedFile, error: updateError } = await supabase
        .from('checker_files')
        .update({
          configuration: configuration,
          status: 'configured',
          updated_at: new Date()
        })
        .eq('id', file_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating checker file:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update checker file configuration' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Checker file configuration updated successfully',
          file: updatedFile
        })
      };

    } else if (event.httpMethod === 'PUT') {
      // Update existing checker file configuration
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }

      const { file_id, configuration } = body;

      if (!file_id || !configuration) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File ID and configuration are required' })
        };
      }

      // Validate configuration
      const validationError = validateConfiguration(configuration);
      if (validationError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: validationError })
        };
      }

      // Update the checker file configuration
      const { data: updatedFile, error: updateError } = await supabase
        .from('checker_files')
        .update({
          configuration: configuration,
          updated_at: new Date()
        })
        .eq('id', file_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating checker file:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update checker file configuration' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Checker file configuration updated successfully',
          file: updatedFile
        })
      };

    } else if (event.httpMethod === 'DELETE') {
      // Delete checker file
      const { file_id } = event.queryStringParameters || {};

      if (!file_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File ID is required' })
        };
      }

      // Delete the checker file
      const { error: deleteError } = await supabase
        .from('checker_files')
        .delete()
        .eq('id', file_id);

      if (deleteError) {
        console.error('Error deleting checker file:', deleteError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to delete checker file' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Checker file deleted successfully'
        })
      };

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

  } catch (error) {
    console.error('Checker file config API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper function to validate configuration
function validateConfiguration(config) {
  const requiredFields = [
    'proxies_required',
    'proxy_type',
    'capture_example',
    'cpm_range',
    'data_required'
  ];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null || config[field] === '') {
      return `Missing required field: ${field}`;
    }
  }

  // Validate CPM range
  const validCpmRanges = ['Low', 'Med', 'High', 'Extreme'];
  if (!validCpmRanges.includes(config.cpm_range)) {
    return `Invalid CPM range. Must be one of: ${validCpmRanges.join(', ')}`;
  }

  // Validate data required
  const validDataTypes = ['USER:PASS', 'EMAIL:PASS', 'LOGIN:PASS', 'Cookie Text', 'Email List', 'CC Combo'];
  if (!validDataTypes.includes(config.data_required)) {
    return `Invalid data type. Must be one of: ${validDataTypes.join(', ')}`;
  }

  // Validate proxy type if proxies are required
  if (config.proxies_required === true) {
    if (!config.proxy_type || config.proxy_type.trim() === '') {
      return 'Proxy type is required when proxies are enabled';
    }
  }

  return null; // No validation errors
}
