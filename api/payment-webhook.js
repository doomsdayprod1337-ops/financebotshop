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
      console.error('Webhook JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in webhook body' })
      };
    }

    console.log('Webhook received:', webhookData);

    // Store webhook data for debugging
    const { error: webhookError } = await supabase
      .from('payment_webhooks')
      .insert([{
        processor: 'unknown', // Will be determined below
        webhook_data: webhookData,
        processed: false
      }]);

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
    }

    // Determine payment processor from webhook data
    let processor = 'unknown';
    let depositId = null;
    let transactionHash = null;
    let amount = null;
    let currency = null;
    let status = 'pending';

    // Try to identify the processor and extract relevant data
    if (webhookData.type === 'wallet:payment_request_updated' || webhookData.type === 'wallet:payment_request_paid') {
      // Coinbase Commerce webhook
      processor = 'coinbase';
      depositId = webhookData.data?.id;
      transactionHash = webhookData.data?.transactions?.[0]?.hash;
      amount = webhookData.data?.pricing?.local?.amount;
      currency = webhookData.data?.pricing?.local?.currency;
      
      if (webhookData.type === 'wallet:payment_request_paid') {
        status = 'confirmed';
      }
    } else if (webhookData.payment_id || webhookData.payment_status) {
      // NowPayments webhook
      processor = 'nowpayments';
      depositId = webhookData.payment_id;
      transactionHash = webhookData.txid;
      amount = webhookData.pay_amount;
      currency = webhookData.pay_currency;
      
      if (webhookData.payment_status === 'confirmed' || webhookData.payment_status === 'finished') {
        status = 'confirmed';
      } else if (webhookData.payment_status === 'failed' || webhookData.payment_status === 'expired') {
        status = 'failed';
      }
    } else if (webhookData.id && webhookData.status) {
      // BitPay webhook
      processor = 'bitpay';
      depositId = webhookData.id;
      transactionHash = webhookData.transactionId;
      amount = webhookData.amount;
      currency = webhookData.currency;
      
      if (webhookData.status === 'confirmed') {
        status = 'confirmed';
      } else if (webhookData.status === 'failed' || webhookData.status === 'expired') {
        status = 'failed';
      }
    }

    // Update webhook record with processor info
    if (processor !== 'unknown') {
      await supabase
        .from('payment_webhooks')
        .update({ 
          processor: processor,
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', webhookData.id || 'unknown');
    }

    // If we can't identify the processor or extract deposit info, return success
    if (processor === 'unknown' || !depositId) {
      console.log('Unable to process webhook - unknown processor or missing deposit ID');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Webhook received but unable to process',
          processor: processor,
          depositId: depositId
        })
      };
    }

          // Try to find and update the deposit
      try {
        const { data: deposit, error: findError } = await supabase
          .from('deposits')
          .select('*')
          .eq('id', depositId)
          .single();

        if (findError) {
          console.error('Error finding deposit:', findError);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Deposit not found' })
          };
        }

        if (!deposit) {
          console.log('Deposit not found:', depositId);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Deposit not found' })
          };
        }

      // Update deposit status
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (transactionHash) {
        updateData.transaction_hash = transactionHash;
      }

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmation_blocks = deposit.required_confirmations || 6;
      }

      const { error: updateError } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', depositId);

      if (updateError) {
        console.error('Error updating deposit:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update deposit' })
        };
      }

      // If transaction hash exists, create/update crypto transaction record
      if (transactionHash) {
        const { error: cryptoError } = await supabase
          .from('crypto_transactions')
          .upsert([{
            deposit_id: depositId,
            currency: currency || deposit.currency,
            transaction_hash: transactionHash,
            amount: amount || deposit.amount,
            status: status,
            confirmation_count: status === 'confirmed' ? (deposit.required_confirmations || 6) : 0,
            required_confirmations: deposit.required_confirmations || 6,
            raw_transaction: webhookData
          }], {
            onConflict: 'transaction_hash'
          });

        if (cryptoError) {
          console.error('Error creating crypto transaction:', cryptoError);
        }
      }

      console.log(`Deposit ${depositId} updated to status: ${status}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Deposit updated successfully',
          depositId: depositId,
          status: status
        })
      };

    } catch (depositError) {
      console.error('Error processing deposit update:', depositError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to process deposit update' })
      };
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
