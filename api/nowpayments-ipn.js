const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('NowPayments IPN JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in webhook body' })
      };
    }

    console.log('NowPayments IPN received:', JSON.stringify(webhookData, null, 2));

    // Store IPN data for debugging and audit
    const { error: ipnError } = await supabase
      .from('payment_webhooks')
      .insert([{
        processor: 'nowpayments',
        webhook_data: webhookData,
        processed: false,
        received_at: new Date().toISOString()
      }]);

    if (ipnError) {
      console.error('Error storing NowPayments IPN:', ipnError);
    }

    // Extract key information from NowPayments IPN
    const {
      payment_id,
      payment_status,
      pay_address,
      pay_amount,
      pay_currency,
      order_id,
      order_description,
      txid,
      actually_paid,
      actually_paid_currency,
      fee,
      fee_currency
    } = webhookData;

    // Validate required fields
    if (!payment_id || !payment_status) {
      console.error('Missing required fields in NowPayments IPN:', { payment_id, payment_status });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['payment_id', 'payment_status'],
          received: { payment_id, payment_status }
        })
      };
    }

    console.log('Processing NowPayments IPN:', {
      payment_id,
      payment_status,
      order_id,
      pay_currency,
      pay_amount
    });

    // Try to find the corresponding invoice
    let invoice = null;
    if (order_id) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('nowpayments_invoices')
        .select('*')
        .eq('purchase_id', order_id)
        .single();

      if (invoiceError && invoiceError.code !== 'PGRST116') {
        console.error('Error finding invoice:', invoiceError);
      } else if (invoiceData) {
        invoice = invoiceData;
        console.log('Found invoice:', invoice.id);
      }
    }

    // Update invoice status if found
    if (invoice) {
      const updateData = {
        status: payment_status,
        updated_at: new Date().toISOString(),
        nowpayments_payment_id: payment_id,
        pay_address: pay_address || invoice.pay_address,
        pay_amount: pay_amount || invoice.amount,
        pay_currency: pay_currency || invoice.currency,
        transaction_hash: txid || null,
        actually_paid: actually_paid || null,
        actually_paid_currency: actually_paid_currency || null,
        fee: fee || null,
        fee_currency: fee_currency || null,
        ipn_data: webhookData
      };

      if (payment_status === 'confirmed' || payment_status === 'finished') {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('nowpayments_invoices')
        .update(updateData)
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
      } else {
        console.log(`Invoice ${invoice.id} updated to status: ${payment_status}`);
      }
    }

    // Try to find and update the corresponding deposit
    let deposit = null;
    if (order_id) {
      const { data: depositData, error: depositError } = await supabase
        .from('deposits')
        .select('*')
        .eq('purchase_id', order_id)
        .single();

      if (depositError && depositError.code !== 'PGRST116') {
        console.error('Error finding deposit:', depositError);
      } else if (depositData) {
        deposit = depositData;
        console.log('Found deposit:', deposit.id);
      }
    }

    // Update deposit status if found
    if (deposit) {
      let depositStatus = 'pending';
      
      if (payment_status === 'confirmed' || payment_status === 'finished') {
        depositStatus = 'confirmed';
      } else if (payment_status === 'failed' || payment_status === 'expired') {
        depositStatus = 'failed';
      } else if (payment_status === 'partially_paid') {
        depositStatus = 'partial';
      }

      const updateData = {
        status: depositStatus,
        updated_at: new Date().toISOString()
      };

      if (txid) {
        updateData.transaction_hash = txid;
      }

      if (depositStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmation_blocks = 6; // Default confirmation blocks
      }

      const { error: updateError } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', deposit.id);

      if (updateError) {
        console.error('Error updating deposit:', updateError);
      } else {
        console.log(`Deposit ${deposit.id} updated to status: ${depositStatus}`);
      }

      // Create/update crypto transaction record if transaction hash exists
      if (txid) {
        const { error: cryptoError } = await supabase
          .from('crypto_transactions')
          .upsert([{
            deposit_id: deposit.id,
            currency: pay_currency || deposit.currency,
            transaction_hash: txid,
            amount: pay_amount || deposit.amount,
            status: depositStatus,
            confirmation_count: depositStatus === 'confirmed' ? 6 : 0,
            required_confirmations: 6,
            raw_transaction: webhookData
          }], {
            onConflict: 'transaction_hash'
          });

        if (cryptoError) {
          console.error('Error creating crypto transaction:', cryptoError);
        }
      }
    }

    // Mark IPN as processed
    if (!ipnError) {
      await supabase
        .from('payment_webhooks')
        .update({ 
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('processor', 'nowpayments')
        .eq('webhook_data->payment_id', payment_id);
    }

    console.log('NowPayments IPN processed successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'IPN processed successfully',
        payment_id,
        payment_status,
        order_id,
        invoice_updated: !!invoice,
        deposit_updated: !!deposit
      })
    };

  } catch (error) {
    console.error('NowPayments IPN processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
