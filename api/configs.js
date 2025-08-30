const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin authentication middleware
async function requireAdmin(event) {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

exports.handler = async function(event, context) {
  console.log('Configs function called with method:', event.httpMethod);

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
    // Check admin authentication for POST, PUT, DELETE operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
      const adminUser = await requireAdmin(event);
      console.log('Configs request from admin:', adminUser.email);
    }

    if (event.httpMethod === 'GET') {
      return await getConfigs(event);
    } else if (event.httpMethod === 'POST') {
      return await createConfig(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateConfig(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteConfig(event);
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
    console.error('Configs error:', error);

    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token' || error.message === 'Admin access required') {
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

async function getConfigs(event) {
  try {
    const queryParams = event.queryStringParameters || {};
    const configType = queryParams.type; // cookiebullet, openbullet, silverbullet, bas, bltools
    const configId = queryParams.id;

    let query = supabase.from('configs').select('*');

    if (configId) {
      // Get specific config by ID
      const { data: config, error } = await query.eq('id', configId).single();
      
      if (error) {
        throw new Error('Config not found');
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          config
        })
      };
    }

    if (configType) {
      // Get configs by type
      const { data: configs, error } = await query.eq('type', configType).order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch configs');
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          configs: configs || []
        })
      };
    }

    // Get all configs grouped by type
    const { data: allConfigs, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('Failed to fetch configs');
    }

    // Group configs by type
    const groupedConfigs = {
      cookiebullet: [],
      openbullet: [],
      silverbullet: [],
      bas: [],
      bltools: []
    };

    (allConfigs || []).forEach(config => {
      if (groupedConfigs[config.type]) {
        groupedConfigs[config.type].push(config);
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        configs: groupedConfigs
      })
    };

  } catch (error) {
    console.error('Error in getConfigs:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch configs',
        details: error.message
      })
    };
  }
}

async function createConfig(event) {
  try {
    const body = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'cpm', 'dataType', 'captures', 'proxyOptions', 'pricing'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate config type
    const validTypes = ['cookiebullet', 'openbullet', 'silverbullet', 'bas', 'bltools'];
    if (!validTypes.includes(body.type)) {
      throw new Error('Invalid config type');
    }

    // Validate CPM
    const validCPM = ['low', 'med', 'high', 'extreme'];
    if (!validCPM.includes(body.cpm.toLowerCase())) {
      throw new Error('Invalid CPM value');
    }

    // Validate Data Type
    const validDataTypes = ['user:pass', 'email:pass', 'cookies', 'misc'];
    if (!validDataTypes.includes(body.dataType.toLowerCase())) {
      throw new Error('Invalid data type');
    }

    // Validate Captures
    const validCaptures = ['balance', 'profile details', 'fullz', 'payment methods', 'user location', 'rewards/points'];
    if (!validCaptures.includes(body.captures.toLowerCase())) {
      throw new Error('Invalid captures value');
    }

    // Validate Proxy Options
    const validProxyOptions = ['proxyless', 'http', 'socks4', 'socks5'];
    if (!validProxyOptions.includes(body.proxyOptions.toLowerCase())) {
      throw new Error('Invalid proxy options');
    }

    // Create config
    const { data: config, error } = await supabase
      .from('configs')
      .insert([{
        name: body.name,
        type: body.type,
        cpm: body.cpm.toLowerCase(),
        dataType: body.dataType.toLowerCase(),
        captures: body.captures.toLowerCase(),
        proxyOptions: body.proxyOptions.toLowerCase(),
        pricing: parseFloat(body.pricing),
        description: body.description || '',
        exampleCaptures: body.exampleCaptures || '',
        screenshots: body.screenshots || [],
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create config');
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Config created successfully',
        config
      })
    };

  } catch (error) {
    console.error('Error in createConfig:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create config',
        details: error.message
      })
    };
  }
}

async function updateConfig(event) {
  try {
    const body = JSON.parse(event.body);
    const configId = body.id;

    if (!configId) {
      throw new Error('Config ID is required');
    }

    // Check if config exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (fetchError || !existingConfig) {
      throw new Error('Config not found');
    }

    // Prepare update data
    const updateData = {};
    
    if (body.name) updateData.name = body.name;
    if (body.type) {
      const validTypes = ['cookiebullet', 'openbullet', 'silverbullet', 'bas', 'bltools'];
      if (!validTypes.includes(body.type)) {
        throw new Error('Invalid config type');
      }
      updateData.type = body.type;
    }
    if (body.cpm) {
      const validCPM = ['low', 'med', 'high', 'extreme'];
      if (!validCPM.includes(body.cpm.toLowerCase())) {
        throw new Error('Invalid CPM value');
      }
      updateData.cpm = body.cpm.toLowerCase();
    }
    if (body.dataType) {
      const validDataTypes = ['user:pass', 'email:pass', 'cookies', 'misc'];
      if (!validDataTypes.includes(body.dataType.toLowerCase())) {
        throw new Error('Invalid data type');
      }
      updateData.dataType = body.dataType.toLowerCase();
    }
    if (body.captures) {
      const validCaptures = ['balance', 'profile details', 'fullz', 'payment methods', 'user location', 'rewards/points'];
      if (!validCaptures.includes(body.captures.toLowerCase())) {
        throw new Error('Invalid captures value');
      }
      updateData.captures = body.captures.toLowerCase();
    }
    if (body.proxyOptions) {
      const validProxyOptions = ['proxyless', 'http', 'socks4', 'socks5'];
      if (!validProxyOptions.includes(body.proxyOptions.toLowerCase())) {
        throw new Error('Invalid proxy options');
      }
      updateData.proxyOptions = body.proxyOptions.toLowerCase();
    }
    if (body.pricing) updateData.pricing = parseFloat(body.pricing);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.exampleCaptures !== undefined) updateData.exampleCaptures = body.exampleCaptures;
    if (body.screenshots !== undefined) updateData.screenshots = body.screenshots;
    if (body.status) updateData.status = body.status;

    // Update config
    const { data: config, error } = await supabase
      .from('configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update config');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Config updated successfully',
        config
      })
    };

  } catch (error) {
    console.error('Error in updateConfig:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update config',
        details: error.message
      })
    };
  }
}

async function deleteConfig(event) {
  try {
    const body = JSON.parse(event.body);
    const configId = body.id;

    if (!configId) {
      throw new Error('Config ID is required');
    }

    // Check if config exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (fetchError || !existingConfig) {
      throw new Error('Config not found');
    }

    // Delete config
    const { error } = await supabase
      .from('configs')
      .delete()
      .eq('id', configId);

    if (error) {
      throw new Error('Failed to delete config');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Config deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error in deleteConfig:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete config',
        details: error.message
      })
    };
  }
}
