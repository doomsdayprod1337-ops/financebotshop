const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.url.includes('/filters')) {
          return await handleGetFilters(req, res);
        } else if (req.url.includes('/details')) {
          return await handleGetServiceDetails(req, res);
        } else if (req.url.includes('/categories')) {
          return await handleGetCategories(req, res);
        } else {
          return await handleGetServices(req, res);
        }
        
      case 'POST':
        if (req.url.includes('/add-to-cart')) {
          return await handleAddToCart(req, res);
        } else if (req.url.includes('/remove-from-cart')) {
          return await handleRemoveFromCart(req, res);
        } else if (req.url.includes('/purchase')) {
          return await handlePurchase(req, res);
        } else if (req.url.includes('/order')) {
          return await handleCreateOrder(req, res);
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Services API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get Services with Filtering
async function handleGetServices(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category = '', 
      provider = '', 
      minPrice = '', 
      maxPrice = '', 
      status = 'active',
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('services')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Get paginated results
    const { data: services, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    // Format the response
    const formattedServices = (services || []).map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      provider: service.provider,
      price: service.price,
      delivery_time: service.delivery_time,
      features: service.features || [],
      requirements: service.requirements || [],
      status: service.status,
      rating: service.rating || 0,
      reviews_count: service.reviews_count || 0,
      created_at: service.created_at
    }));
    
    res.status(200).json({
      services: formattedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
}

// Get Service Details
async function handleGetServiceDetails(req, res) {
  try {
    const { serviceId } = req.query;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }
    
    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
    
    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Get service reviews
    const { data: reviews } = await supabase
      .from('service_reviews')
      .select(`
        *,
        user:users!service_reviews_user_id_fkey(username)
      `)
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get service orders count
    const { count: ordersCount } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .eq('status', 'completed');
    
    res.status(200).json({
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        provider: service.provider,
        price: service.price,
        delivery_time: service.delivery_time,
        features: service.features || [],
        requirements: service.requirements || [],
        status: service.status,
        rating: service.rating || 0,
        reviews_count: service.reviews_count || 0,
        orders_count: ordersCount || 0,
        created_at: service.created_at
      },
      reviews: reviews || []
    });
  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({ error: 'Failed to get service details' });
  }
}

// Get Service Categories
async function handleGetCategories(req, res) {
  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    res.status(200).json({
      categories: categories || []
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
}

// Get Available Filters
async function handleGetFilters(req, res) {
  try {
    // Get unique categories
    const { data: categories } = await supabase
      .from('services')
      .select('category')
      .not('category', 'is', null);
    
    // Get unique providers
    const { data: providers } = await supabase
      .from('services')
      .select('provider')
      .not('provider', 'is', null);
    
    // Get price range
    const { data: priceRange } = await supabase
      .from('services')
      .select('price');
    
    const prices = priceRange?.map(p => p.price).filter(Boolean) || [];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    res.status(200).json({
      filters: {
        categories: [...new Set(categories?.map(c => c.category))].filter(Boolean),
        providers: [...new Set(providers?.map(p => p.provider))].filter(Boolean),
        priceRange: { min: minPrice || 0, max: maxPrice || 1000 }
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to get filters' });
  }
}

// Add Service to Cart
async function handleAddToCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { serviceId, quantity = 1, customRequirements = '' } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }
      
      // Check if service exists and is active
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('status', 'active')
        .single();
      
      if (serviceError || !service) {
        return res.status(404).json({ error: 'Service not found or unavailable' });
      }
      
      // Check if service is already in user's cart
      const { data: existingCartItem } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'service')
        .eq('item_id', serviceId)
        .single();
      
      if (existingCartItem) {
        return res.status(400).json({ error: 'Service already in cart' });
      }
      
      // Calculate total price
      const totalPrice = service.price * quantity;
      
      // Add to cart
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .insert({
          user_id: req.user.userId,
          item_type: 'service',
          item_id: serviceId,
          price: totalPrice,
          quantity: quantity,
          custom_data: {
            customRequirements: customRequirements,
            serviceName: service.name,
            deliveryTime: service.delivery_time
          },
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (cartError) throw cartError;
      
      res.status(200).json({
        message: 'Service added to cart successfully',
        cartItem: {
          id: cartItem.id,
          serviceId: serviceId,
          price: totalPrice,
          quantity: quantity
        }
      });
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add service to cart' });
  }
}

// Remove Service from Cart
async function handleRemoveFromCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { serviceId } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }
      
      // Remove from cart
      const { error: cartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('item_type', 'service')
        .eq('item_id', serviceId);
      
      if (cartError) throw cartError;
      
      res.status(200).json({
        message: 'Service removed from cart successfully'
      });
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove service from cart' });
  }
}

// Purchase Service
async function handlePurchase(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { serviceId } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }
      
      // Check if service is in user's cart
      const { data: cartItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'service')
        .eq('item_id', serviceId)
        .single();
      
      if (!cartItem) {
        return res.status(400).json({ error: 'Service not in cart' });
      }
      
      // Check if user has sufficient balance
      const { data: user } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', req.user.userId)
        .single();
      
      if (!user || user.wallet_balance < cartItem.price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      
      // Start transaction
      const { error: transactionError } = await supabase.rpc('purchase_service', {
        p_user_id: req.user.userId,
        p_service_id: serviceId,
        p_price: cartItem.price,
        p_quantity: cartItem.quantity,
        p_custom_data: cartItem.custom_data
      });
      
      if (transactionError) throw transactionError;
      
      res.status(200).json({
        message: 'Service purchased successfully',
        purchase: {
          serviceId: serviceId,
          price: cartItem.price,
          quantity: cartItem.quantity,
          purchaseDate: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase service' });
  }
}

// Create Service Order
async function handleCreateOrder(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { 
        serviceId, 
        quantity = 1, 
        customRequirements = '', 
        deliveryAddress = '',
        contactInfo = {} 
      } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }
      
      // Check if service exists and is active
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('status', 'active')
        .single();
      
      if (serviceError || !service) {
        return res.status(404).json({ error: 'Service not found or unavailable' });
      }
      
      // Calculate total price
      const totalPrice = service.price * quantity;
      
      // Check if user has sufficient balance
      const { data: user } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', req.user.userId)
        .single();
      
      if (!user || user.wallet_balance < totalPrice) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      
      // Create service order
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert({
          user_id: req.user.userId,
          service_id: serviceId,
          quantity: quantity,
          total_price: totalPrice,
          custom_requirements: customRequirements,
          delivery_address: deliveryAddress,
          contact_info: contactInfo,
          status: 'pending',
          estimated_delivery: new Date(Date.now() + (service.delivery_time * 24 * 60 * 60 * 1000)).toISOString()
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          wallet_balance: user.wallet_balance - totalPrice,
          total_spent: (user.total_spent || 0) + totalPrice
        })
        .eq('id', req.user.userId);
      
      if (walletError) throw walletError;
      
      // Create wallet transaction record
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: req.user.userId,
          type: 'debit',
          amount: totalPrice,
          description: `Service order: ${service.name}`,
          reference: order.id,
          created_at: new Date().toISOString()
        });
      
      res.status(201).json({
        message: 'Service order created successfully',
        order: {
          id: order.id,
          serviceName: service.name,
          quantity: quantity,
          totalPrice: totalPrice,
          status: order.status,
          estimatedDelivery: order.estimated_delivery
        }
      });
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create service order' });
  }
}
