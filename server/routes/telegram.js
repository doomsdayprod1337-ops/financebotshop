const express = require('express');
const { executeQuery } = require('../config/database-sqlite');

const router = express.Router();

// Telegram webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;
    
    if (message) {
      await handleMessage(message);
    } else if (callback_query) {
      await handleCallbackQuery(callback_query);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

// Handle incoming messages
async function handleMessage(message) {
  try {
    const { chat, text, from } = message;
    
    if (!text) return;
    
    const chatId = chat.id;
    const userId = from.id;
    const username = from.username || from.first_name;
    
    // Check if user exists in customers table
    const customers = executeQuery(`
      SELECT * FROM customers WHERE telegram_id = ?
    `, [userId]);
    
    if (customers.length === 0) {
      // Create new customer
      executeQuery(`
        INSERT INTO customers (first_name, phone, telegram_id)
        VALUES (?, ?, ?)
      `, [username, '', userId]);
    }
    
    // Handle different commands
    if (text === '/start') {
      await sendWelcomeMessage(chatId);
    } else if (text === '/menu') {
      await sendMenu(chatId);
    } else if (text === '/orders') {
      await sendUserOrders(chatId, userId);
    } else if (text === '/help') {
      await sendHelpMessage(chatId);
    } else {
      await sendDefaultMessage(chatId);
    }
    
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(callbackQuery) {
  try {
    const { data, message } = callbackQuery;
    const chatId = message.chat.id;
    
    if (data.startsWith('product_')) {
      const productId = data.split('_')[1];
      await sendProductDetails(chatId, productId);
    } else if (data.startsWith('order_')) {
      const orderId = data.split('_')[1];
      await sendOrderDetails(chatId, orderId);
    } else if (data === 'back_to_menu') {
      await sendMenu(chatId);
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
}

// Send welcome message
async function sendWelcomeMessage(chatId) {
  const message = `
🎉 Welcome to Finance Shop Bot!

I'm here to help you with your shopping needs. Here's what I can do:

📋 /menu - View our product catalog
🛒 /orders - Check your order status
❓ /help - Get help and support

Use the commands above to get started!
  `;
  
  // In a real implementation, you would use the Telegram Bot API
  // For now, we'll just log the message
  console.log(`Sending welcome message to ${chatId}:`, message);
}

// Send product menu
async function sendMenu(chatId) {
  try {
    const products = executeQuery(`
      SELECT id, name, price, description, image_url
      FROM products 
      WHERE is_active = 1
      ORDER BY category, name
    `);
    
    if (products.length === 0) {
      const message = "😔 Sorry, no products available at the moment.";
      console.log(`Sending message to ${chatId}:`, message);
      return;
    }
    
    let message = "🍽️ **Our Menu**\n\n";
    
    products.forEach((product, index) => {
      message += `${index + 1}. **${product.name}**\n`;
      message += `   💰 $${product.price}\n`;
      message += `   📝 ${product.description}\n\n`;
    });
    
    message += "To place an order, please contact our staff or visit our store.";
    
    console.log(`Sending menu to ${chatId}:`, message);
    
  } catch (error) {
    console.error('Error sending menu:', error);
  }
}

// Send user's orders
async function sendUserOrders(chatId, telegramId) {
  try {
    const orders = executeQuery(`
      SELECT o.*, 
             p.name as product_name, oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE c.telegram_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [telegramId]);
    
    if (orders.length === 0) {
      const message = "📋 You don't have any orders yet.";
      console.log(`Sending message to ${chatId}:`, message);
      return;
    }
    
    let message = "📋 **Your Recent Orders**\n\n";
    
    orders.forEach((order, index) => {
      message += `${index + 1}. **Order #${order.id}**\n`;
      message += `   📅 ${new Date(order.created_at).toLocaleDateString()}\n`;
      message += `   🛍️ ${order.products}\n`;
      message += `   💰 $${order.total_amount}\n`;
      message += `   📊 Status: ${order.status}\n\n`;
    });
    
    console.log(`Sending orders to ${chatId}:`, message);
    
  } catch (error) {
    console.error('Error sending user orders:', error);
  }
}

// Send help message
async function sendHelpMessage(chatId) {
  const message = `
❓ **Need Help?**

Here are the available commands:

📋 /menu - View our product catalog
🛒 /orders - Check your order status
❓ /help - Show this help message

For additional support, please contact our staff or visit our store.

📍 **Store Location:** [Your store address]
📞 **Phone:** [Your phone number]
⏰ **Hours:** [Your business hours]
  `;
  
  console.log(`Sending help message to ${chatId}:`, message);
}

// Send default message for unrecognized text
async function sendDefaultMessage(chatId) {
  const message = `
🤔 I didn't understand that message.

Please use one of these commands:
📋 /menu - View our product catalog
🛒 /orders - Check your order status
❓ /help - Get help and support
  `;
  
  console.log(`Sending default message to ${chatId}:`, message);
}

// Send product details
async function sendProductDetails(chatId, productId) {
  try {
    const products = executeQuery(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `, [productId]);
    
    if (products.length === 0) {
      const message = "😔 Product not found.";
      console.log(`Sending message to ${chatId}:`, message);
      return;
    }
    
    const product = products[0];
    const message = `
🍽️ **${product.name}**

💰 **Price:** $${product.price}
📝 **Description:** ${product.description}
📊 **Category:** ${product.category_id || 'Uncategorized'}

To order this product, please contact our staff or visit our store.
  `;
    
    console.log(`Sending product details to ${chatId}:`, message);
    
  } catch (error) {
    console.error('Error sending product details:', error);
  }
}

// Send order details
async function sendOrderDetails(chatId, orderId) {
  try {
    const orders = executeQuery(`
      SELECT o.*, c.first_name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      const message = "😔 Order not found.";
      console.log(`Sending message to ${chatId}:`, message);
      return;
    }
    
    const order = orders[0];
    const message = `
📋 **Order #${order.id}**

👤 **Customer:** ${order.customer_name}
📅 **Date:** ${new Date(order.created_at).toLocaleDateString()}
💰 **Total:** $${order.total_amount}
📊 **Status:** ${order.status}
📝 **Notes:** ${order.notes || 'No notes'}

For order updates, please contact our staff.
  `;
    
    console.log(`Sending order details to ${chatId}:`, message);
    
  } catch (error) {
    console.error('Error sending order details:', error);
  }
}

// Get bot info
router.get('/info', (req, res) => {
  res.json({
    message: 'Telegram Bot API is running',
    endpoints: {
      webhook: 'POST /api/telegram/webhook',
      info: 'GET /api/telegram/info'
    }
  });
});

module.exports = router;
