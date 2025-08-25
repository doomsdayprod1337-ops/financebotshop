const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing Supabase configuration',
          supabaseUrl: !!process.env.SUPABASE_URL,
          supabaseKey: !!process.env.SUPABASE_ANON_KEY
        })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    switch (event.httpMethod) {
      case 'GET':
        // Check if it's a categories request
        if (event.path.includes('/categories/list')) {
          console.log('Fetching categories from Supabase...');
          
          const { data: categories, error: categoriesError } = await supabase
            .from('products')
            .select('category')
            .not('category', 'is', null);
          
          if (categoriesError) {
            console.error('Categories error:', categoriesError);
            throw categoriesError;
          }
          
          // Extract unique categories
          const uniqueCategories = [...new Set(categories.map(item => item.category))].filter(Boolean);
          console.log(`Found ${uniqueCategories.length} categories`);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(uniqueCategories)
          };
        }
        
        console.log('Fetching products from Supabase...');
        
        // Get all products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log(`Found ${products?.length || 0} products`);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(products || [])
        };
        
      case 'POST':
        // Create new product
        const { name, description, price, category, stock } = JSON.parse(event.body);
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert([{ name, description, price, category, stock }])
          .select()
          .single();
        
        if (createError) throw createError;
        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(newProduct)
        };
        
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: error.details || 'No additional details'
      })
    };
  }
};
