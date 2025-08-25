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
        return await handleGetCart(req, res);
        
      case 'POST':
        if (req.url.includes('/add')) {
          return await handleAddToCart(req, res);
        } else if (req.url.includes('/remove')) {
          return await handleRemoveFromCart(req, res);
        } else if (req.url.includes('/update')) {
          return await handleUpdateCart(req, res);
        } else if (req.url.includes('/clear')) {
          return await handleClearCart(req, res);
        } else if (req.url.includes('/checkout')) {
          return await handleCheckout(req, res);
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Cart API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get User's Cart
async function handleGetCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { data: cartItems, error } = await supabase
        .from('cart')
        .select(`
          *,
          credit_card:credit_cards!cart_item_id_fkey(id, card_number, brand, level, price, country, state),
          bot:bots!cart_item_id_fkey(id, bot_id, category, price, system),
          service:services!cart_item_id_fkey(id, name, price, delivery_time)
        `)
        .eq('user_id', req.user.userId)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      
      // Format cart items
      const formattedCart = (cartItems || []).map(item => {
        let itemDetails = null;
        let itemName = '';
        let itemImage = '';
        
        switch (item.item_type) {
          case 'credit_card':
            itemDetails = item.credit_card;
            itemName = `${itemDetails?.brand} ${itemDetails?.level} Card`;
            itemImage = '/images/credit-card.png';
            break;
          case 'bot':
            itemDetails = item.bot;
            itemName = `Bot ${itemDetails?.bot_id}`;
            itemImage = '/images/bot.png';
            break;
          case 'service':
            itemDetails = item.service;
            itemName = itemDetails?.name || 'Service';
            itemImage = '/images/service.png';
            break;
        }
        
        return {
          id: item.id,
          item_type: item.item_type,
          item_id: item.item_id,
          item_name: itemName,
          item_image: itemImage,
          price: item.price,
          quantity: item.quantity || 1,
          custom_data: item.custom_data || {},
          added_at: item.added_at,
          item_details: itemDetails
        };
      });
      
      // Calculate totals
      const subtotal = formattedCart.reduce((sum, item) => sum + item.price, 0);
      const total = subtotal; // No tax/fees for now
      
      res.status(200).json({
        success: true,
        cart: formattedCart,
        summary: {
          item_count: formattedCart.length,
          subtotal: subtotal.toFixed(2),
          total: total.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
}

// Add Item to Cart
async function handleAddToCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { itemType, itemId, quantity = 1, customData = {} } = req.body;
      
      if (!itemType || !itemId) {
        return res.status(400).json({ error: 'Item type and ID are required' });
      }
      
      // Validate item type
      const validTypes = ['credit_card', 'bot', 'service'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({ error: 'Invalid item type' });
      }
      
      // Check if item exists and is available
      let item = null;
      let itemError = null;
      
      switch (itemType) {
        case 'credit_card':
          const { data: card, error: cardError } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('id', itemId)
            .eq('status', 'available')
            .single();
          item = card;
          itemError = cardError;
          break;
          
        case 'bot':
          const { data: bot, error: botError } = await supabase
            .from('bots')
            .select('*')
            .eq('id', itemId)
            .eq('status', 'available')
            .single();
          item = bot;
          itemError = botError;
          break;
          
        case 'service':
          const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', itemId)
            .eq('status', 'active')
            .single();
          item = service;
          itemError = serviceError;
          break;
      }
      
      if (itemError || !item) {
        return res.status(404).json({ error: 'Item not found or unavailable' });
      }
      
      // Check if item is already in cart
      const { data: existingCartItem } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .single();
      
      if (existingCartItem) {
        return res.status(400).json({ error: 'Item already in cart' });
      }
      
      // Calculate price
      let price = item.price;
      if (itemType === 'service' && quantity > 1) {
        price = item.price * quantity;
      }
      
      // Add to cart
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .insert({
          user_id: req.user.userId,
          item_type: itemType,
          item_id: itemId,
          price: price,
          quantity: quantity,
          custom_data: customData,
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (cartError) throw cartError;
      
      // Update item status to in_cart (for credit cards and bots)
      if (itemType === 'credit_card' || itemType === 'bot') {
        await supabase
          .from(itemType === 'credit_card' ? 'credit_cards' : 'bots')
          .update({ status: 'in_cart' })
          .eq('id', itemId);
      }
      
      res.status(200).json({
        success: true,
        message: 'Item added to cart successfully',
        cartItem: {
          id: cartItem.id,
          itemType: itemType,
          itemId: itemId,
          price: price,
          quantity: quantity
        }
      });
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
}

// Remove Item from Cart
async function handleRemoveFromCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { cartItemId } = req.body;
      
      if (!cartItemId) {
        return res.status(400).json({ error: 'Cart item ID is required' });
      }
      
      // Get cart item details
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('id', cartItemId)
        .eq('user_id', req.user.userId)
        .single();
      
      if (cartError || !cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      // Remove from cart
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);
      
      if (deleteError) throw deleteError;
      
      // Update item status back to available (for credit cards and bots)
      if (cartItem.item_type === 'credit_card' || cartItem.item_type === 'bot') {
        await supabase
          .from(cartItem.item_type === 'credit_card' ? 'credit_cards' : 'bots')
          .update({ status: 'available' })
          .eq('id', cartItem.item_id);
      }
      
      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
}

// Update Cart Item
async function handleUpdateCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { cartItemId, quantity, customData } = req.body;
      
      if (!cartItemId) {
        return res.status(400).json({ error: 'Cart item ID is required' });
      }
      
      // Get cart item
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('id', cartItemId)
        .eq('user_id', req.user.userId)
        .single();
      
      if (cartError || !cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      // Prepare updates
      const updates = {};
      if (quantity !== undefined) {
        updates.quantity = quantity;
        
        // Recalculate price for services
        if (cartItem.item_type === 'service') {
          const { data: service } = await supabase
            .from('services')
            .select('price')
            .eq('id', cartItem.item_id)
            .single();
          
          if (service) {
            updates.price = service.price * quantity;
          }
        }
      }
      
      if (customData !== undefined) {
        updates.custom_data = { ...cartItem.custom_data, ...customData };
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }
      
      // Update cart item
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart')
        .update(updates)
        .eq('id', cartItemId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      res.status(200).json({
        success: true,
        message: 'Cart item updated successfully',
        cartItem: updatedItem
      });
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
}

// Clear Cart
async function handleClearCart(req, res) {
  try {
    requireAuth(req, res, async () => {
      // Get all cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', req.user.userId);
      
      if (cartError) throw cartError;
      
      // Update item statuses back to available
      for (const item of cartItems || []) {
        if (item.item_type === 'credit_card' || item.item_type === 'bot') {
          await supabase
            .from(item.item_type === 'credit_card' ? 'credit_cards' : 'bots')
            .update({ status: 'available' })
            .eq('id', item.item_id);
        }
      }
      
      // Clear cart
      const { error: clearError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.userId);
      
      if (clearError) throw clearError;
      
      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully'
      });
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}

// Checkout Cart
async function handleCheckout(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { paymentMethod = 'wallet', shippingAddress = '', contactInfo = {} } = req.body;
      
      // Get cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', req.user.userId);
      
      if (cartError) throw cartError;
      
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + item.price, 0);
      
      // Check if user has sufficient balance (for wallet payment)
      if (paymentMethod === 'wallet') {
        const { data: user } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', req.user.userId)
          .single();
        
        if (!user || user.wallet_balance < total) {
          return res.status(400).json({ error: 'Insufficient wallet balance' });
        }
      }
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: req.user.userId,
          total_amount: total,
          status: 'pending',
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          contact_info: contactInfo,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        item_type: item.item_type,
        item_id: item.item_id,
        price: item.price,
        quantity: item.quantity || 1,
        custom_data: item.custom_data
      }));
      
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (orderItemsError) throw orderItemsError;
      
      // Process payment
      if (paymentMethod === 'wallet') {
        // Deduct from wallet
        const { error: walletError } = await supabase
          .from('users')
          .update({ 
            wallet_balance: user.wallet_balance - total,
            total_spent: (user.total_spent || 0) + total
          })
          .eq('id', req.user.userId);
        
        if (walletError) throw walletError;
        
        // Create wallet transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: req.user.userId,
            type: 'debit',
            amount: total,
            description: `Order #${order.id}`,
            reference: order.id,
            created_at: new Date().toISOString()
          });
      }
      
      // Clear cart
      const { error: clearError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.userId);
      
      if (clearError) throw clearError;
      
      res.status(200).json({
        success: true,
        message: 'Checkout completed successfully',
        order: {
          id: order.id,
          total: total,
          status: order.status,
          items_count: cartItems.length
        }
      });
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
}
