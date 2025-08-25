import { createClient } from '@supabase/supabasejs';
import jwt from 'jsonwebtoken';

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
          return await handleGetBotDetails(req, res);
        } else {
          return await handleGetBots(req, res);
        }
        
      case 'POST':
        if (req.url.includes('/add-to-cart')) {
          return await handleAddToCart(req, res);
        } else if (req.url.includes('/remove-from-cart')) {
          return await handleRemoveFromCart(req, res);
        } else if (req.url.includes('/purchase')) {
          return await handlePurchase(req, res);
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Bots API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get Bots with Filtering
async function handleGetBots(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category = '', 
      multiplier = '', 
      system = '', 
      minPrice = '', 
      maxPrice = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('bots')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (multiplier) {
      query = query.eq('multiplier', multiplier);
    }
    
    if (system) {
      query = query.eq('system', system);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    // Get paginated results
    const { data: bots, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    // Format the response
    const formattedBots = (bots || []).map(bot => ({
      id: bot.id,
      bot_id: bot.bot_id,
      timestamp: bot.timestamp,
      multiplier: bot.multiplier,
      system: bot.system,
      logins_count: bot.logins_count || 0,
      cookies_count: bot.cookies_count || 0,
      extensions_count: bot.extensions_count || 0,
      applications_count: bot.applications_count || 0,
      price: bot.price,
      category: bot.category,
      created_at: bot.created_at
    }));
    
    res.status(200).json({
      bots: formattedBots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ error: 'Failed to get bots' });
  }
}

// Get Bot Details
async function handleGetBotDetails(req, res) {
  try {
    const { botId } = req.query;
    
    if (!botId) {
      return res.status(400).json({ error: 'Bot ID is required' });
    }
    
    // Get bot details
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();
    
    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Get login URLs
    const { data: loginUrls } = await supabase
      .from('bot_logins')
      .select('*')
      .eq('bot_id', botId);
    
    // Get cookie domains
    const { data: cookieDomains } = await supabase
      .from('bot_cookies')
      .select('*')
      .eq('bot_id', botId);
    
    // Get extensions
    const { data: extensions } = await supabase
      .from('bot_extensions')
      .select('*')
      .eq('bot_id', botId);
    
    // Get applications
    const { data: applications } = await supabase
      .from('bot_applications')
      .select('*')
      .eq('bot_id', botId);
    
    res.status(200).json({
      bot: {
        id: bot.id,
        bot_id: bot.bot_id,
        timestamp: bot.timestamp,
        multiplier: bot.multiplier,
        system: bot.system,
        category: bot.category,
        price: bot.price,
        status: bot.status,
        created_at: bot.created_at
      },
      details: {
        logins: loginUrls || [],
        cookies: cookieDomains || [],
        extensions: extensions || [],
        applications: applications || []
      }
    });
  } catch (error) {
    console.error('Get bot details error:', error);
    res.status(500).json({ error: 'Failed to get bot details' });
  }
}

// Get Available Filters
async function handleGetFilters(req, res) {
  try {
    // Get unique categories
    const { data: categories } = await supabase
      .from('bots')
      .select('category')
      .not('category', 'is', null);
    
    // Get unique multipliers
    const { data: multipliers } = await supabase
      .from('bots')
      .select('multiplier')
      .not('multiplier', 'is', null);
    
    // Get unique systems
    const { data: systems } = await supabase
      .from('bots')
      .select('system')
      .not('system', 'is', null);
    
    // Get price range
    const { data: priceRange } = await supabase
      .from('bots')
      .select('price');
    
    const prices = priceRange?.map(p => p.price).filter(Boolean) || [];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    res.status(200).json({
      filters: {
        categories: [...new Set(categories?.map(c => c.category))].filter(Boolean),
        multipliers: [...new Set(multipliers?.map(m => m.multiplier))].filter(Boolean),
        systems: [...new Set(systems?.map(s => s.system))].filter(Boolean),
        priceRange: { min: minPrice || 0, max: maxPrice || 1000 }
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to get filters' });
  }
}

// Add Bot to Cart
async function handleAddToCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { botId } = req.body;
      
      if (!botId) {
        return res.status(400).json({ error: 'Bot ID is required' });
      }
      
      // Check if bot exists and is available
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .eq('status', 'available')
        .single();
      
      if (botError || !bot) {
        return res.status(404).json({ error: 'Bot not found or unavailable' });
      }
      
      // Check if bot is already in user's cart
      const { data: existingCartItem } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'bot')
        .eq('item_id', botId)
        .single();
      
      if (existingCartItem) {
        return res.status(400).json({ error: 'Bot already in cart' });
      }
      
      // Add to cart
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .insert({
          user_id: req.user.userId,
          item_type: 'bot',
          item_id: botId,
          price: bot.price,
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (cartError) throw cartError;
      
      // Update bot status to in_cart
      await supabase
        .from('bots')
        .update({ status: 'in_cart' })
        .eq('id', botId);
      
      res.status(200).json({
        message: 'Bot added to cart successfully',
        cartItem: {
          id: cartItem.id,
          botId: botId,
          price: bot.price
        }
      });
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add bot to cart' });
  }
}

// Remove Bot from Cart
async function handleRemoveFromCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { botId } = req.body;
      
      if (!botId) {
        return res.status(400).json({ error: 'Bot ID is required' });
      }
      
      // Remove from cart
      const { error: cartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('item_type', 'bot')
        .eq('item_id', botId);
      
      if (cartError) throw cartError;
      
      // Update bot status back to available
      await supabase
        .from('bots')
        .update({ status: 'available' })
        .eq('id', botId);
      
      res.status(200).json({
        message: 'Bot removed from cart successfully'
      });
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove bot from cart' });
  }
}

// Purchase Bot
async function handlePurchase(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { botId } = req.body;
      
      if (!botId) {
        return res.status(400).json({ error: 'Bot ID is required' });
      }
      
      // Check if bot is in user's cart
      const { data: cartItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'bot')
        .eq('item_id', botId)
        .single();
      
      if (!cartItem) {
        return res.status(400).json({ error: 'Bot not in cart' });
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
      const { error: transactionError } = await supabase.rpc('purchase_bot', {
        p_user_id: req.user.userId,
        p_bot_id: botId,
        p_price: cartItem.price
      });
      
      if (transactionError) throw transactionError;
      
      res.status(200).json({
        message: 'Bot purchased successfully',
        purchase: {
          botId: botId,
          price: cartItem.price,
          purchaseDate: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase bot' });
  }
}
