import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ 
        error: 'Missing Supabase configuration',
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_ANON_KEY
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    switch (req.method) {
      case 'GET':
        // Check if it's a categories request
        if (req.url.includes('/categories/list')) {
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
          res.status(200).json(uniqueCategories);
          return;
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
        res.status(200).json(products || []);
        break;
        
      case 'POST':
        // Create new product
        const { name, description, price, category, stock } = req.body;
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert([{ name, description, price, category, stock }])
          .select()
          .single();
        
        if (createError) throw createError;
        res.status(201).json(newProduct);
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.details || 'No additional details'
    });
  }
}
