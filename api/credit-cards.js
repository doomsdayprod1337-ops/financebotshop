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
        } else {
          return await handleGetCreditCards(req, res);
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
    console.error('Credit Cards API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get Credit Cards with Filtering
async function handleGetCreditCards(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      cardType = '', 
      country = '', 
      state = '', 
      level = '', 
      minPrice = '', 
      maxPrice = '', 
      bin = '', 
      bank = '', 
      dateAdded = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('credit_cards')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (cardType) {
      query = query.eq('card_type', cardType);
    }
    
    if (country) {
      query = query.eq('country', country);
    }
    
    if (state && country === 'US') {
      query = query.eq('state', state);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    if (bin) {
      const bins = bin.split(/[,;]/).map(b => b.trim()).filter(Boolean);
      if (bins.length > 0) {
        query = query.in('bin', bins);
      }
    }
    
    if (bank) {
      query = query.ilike('bank', `%${bank}%`);
    }
    
    if (dateAdded) {
      const date = new Date(dateAdded);
      query = query.gte('created_at', date.toISOString());
    }
    
    // Get paginated results
    const { data: creditCards, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    // Format the response
    const formattedCards = (creditCards || []).map(card => ({
      id: card.id,
      card_number: card.card_number,
      expiry: card.expiry,
      brand: card.brand,
      level: card.level,
      location: card.country + (card.state ? `-${card.state}` : ''),
      added: new Date(card.created_at).toISOString().split('T')[0],
      price: card.price,
      bin: card.bin,
      bank: card.bank,
      cvv: card.cvv,
      address: card.address,
      phone: card.phone,
      bank_location: card.bank_location
    }));
    
    res.status(200).json({
      creditCards: formattedCards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get credit cards error:', error);
    res.status(500).json({ error: 'Failed to get credit cards' });
  }
}

// Get Available Filters
async function handleGetFilters(req, res) {
  try {
    // Get unique card types
    const { data: cardTypes } = await supabase
      .from('credit_cards')
      .select('card_type')
      .not('card_type', 'is', null);
    
    // Get unique countries
    const { data: countries } = await supabase
      .from('credit_cards')
      .select('country')
      .not('country', 'is', null);
    
    // Get unique US states
    const { data: usStates } = await supabase
      .from('credit_cards')
      .select('state')
      .eq('country', 'US')
      .not('state', 'is', null);
    
    // Get unique levels
    const { data: levels } = await supabase
      .from('credit_cards')
      .select('level')
      .not('level', 'is', null);
    
    // Get unique banks
    const { data: banks } = await supabase
      .from('credit_cards')
      .select('bank')
      .not('bank', 'is', null);
    
    // Get price range
    const { data: priceRange } = await supabase
      .from('credit_cards')
      .select('price');
    
    const prices = priceRange?.map(p => p.price).filter(Boolean) || [];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    res.status(200).json({
      filters: {
        cardTypes: [...new Set(cardTypes?.map(c => c.card_type))].filter(Boolean),
        countries: [...new Set(countries?.map(c => c.country))].filter(Boolean),
        usStates: [...new Set(usStates?.map(s => s.state))].filter(Boolean),
        levels: [...new Set(levels?.map(l => l.level))].filter(Boolean),
        banks: [...new Set(banks?.map(b => b.bank))].filter(Boolean),
        priceRange: { min: minPrice || 0, max: maxPrice || 1000 }
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to get filters' });
  }
}

// Add Credit Card to Cart
async function handleAddToCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { cardId } = req.body;
      
      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }
      
      // Check if card exists and is available
      const { data: card, error: cardError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', cardId)
        .eq('status', 'available')
        .single();
      
      if (cardError || !card) {
        return res.status(404).json({ error: 'Card not found or unavailable' });
      }
      
      // Check if card is already in user's cart
      const { data: existingCartItem } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'credit_card')
        .eq('item_id', cardId)
        .single();
      
      if (existingCartItem) {
        return res.status(400).json({ error: 'Card already in cart' });
      }
      
      // Add to cart
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .insert({
          user_id: req.user.userId,
          item_type: 'credit_card',
          item_id: cardId,
          price: card.price,
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (cartError) throw cartError;
      
      // Update card status to in_cart
      await supabase
        .from('credit_cards')
        .update({ status: 'in_cart' })
        .eq('id', cardId);
      
      res.status(200).json({
        message: 'Card added to cart successfully',
        cartItem: {
          id: cartItem.id,
          cardId: cardId,
          price: card.price
        }
      });
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add card to cart' });
  }
}

// Remove Credit Card from Cart
async function handleRemoveFromCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { cardId } = req.body;
      
      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }
      
      // Remove from cart
      const { error: cartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('item_type', 'credit_card')
        .eq('item_id', cardId);
      
      if (cartError) throw cartError;
      
      // Update card status back to available
      await supabase
        .from('credit_cards')
        .update({ status: 'available' })
        .eq('id', cardId);
      
      res.status(200).json({
        message: 'Card removed from cart successfully'
      });
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove card from cart' });
  }
}

// Purchase Credit Card
async function handlePurchase(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { cardId } = req.body;
      
      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }
      
      // Check if card is in user's cart
      const { data: cartItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('item_type', 'credit_card')
        .eq('item_id', cardId)
        .single();
      
      if (!cartItem) {
        return res.status(400).json({ error: 'Card not in cart' });
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
      const { error: transactionError } = await supabase.rpc('purchase_credit_card', {
        p_user_id: req.user.userId,
        p_card_id: cardId,
        p_price: cartItem.price
      });
      
      if (transactionError) throw transactionError;
      
      res.status(200).json({
        message: 'Card purchased successfully',
        purchase: {
          cardId: cardId,
          price: cartItem.price,
          purchaseDate: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase card' });
  }
}
