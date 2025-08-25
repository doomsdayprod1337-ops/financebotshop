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
        if (req.url.includes('/lookup')) {
          return await handleBinLookup(req, res);
        } else if (req.url.includes('/history')) {
          return await handleGetHistory(req, res);
        } else if (req.url.includes('/stats')) {
          return await handleGetStats(req, res);
        }
        break;
        
      case 'POST':
        if (req.url.includes('/check')) {
          return await handleBinCheck(req, res);
        } else if (req.url.includes('/bulk-check')) {
          return await handleBulkBinCheck(req, res);
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('BIN Check API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Single BIN Check
async function handleBinCheck(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { bin } = req.body;
      
      if (!bin) {
        return res.status(400).json({ error: 'BIN is required' });
      }
      
      // Validate BIN format (6-8 digits)
      const binRegex = /^\d{6,8}$/;
      if (!binRegex.test(bin)) {
        return res.status(400).json({ error: 'Invalid BIN format. Must be 6-8 digits.' });
      }
      
      // Check if we have this BIN in our database
      const { data: existingBin } = await supabase
        .from('bin_database')
        .select('*')
        .eq('bin', bin)
        .single();
      
      let binInfo = null;
      
      if (existingBin) {
        // Use our database
        binInfo = {
          bin: existingBin.bin,
          brand: existingBin.brand,
          type: existingBin.card_type,
          level: existingBin.level,
          country: existingBin.country,
          bank: existingBin.bank,
          bank_phone: existingBin.bank_phone,
          bank_website: existingBin.bank_website,
          bank_address: existingBin.bank_address,
          prepaid: existingBin.prepaid,
          corporate: existingBin.corporate,
          source: 'database'
        };
      } else {
        // Try external API (you can integrate with services like BINList, etc.)
        try {
          const externalResponse = await fetch(`https://lookup.binlist.net/${bin}`);
          if (externalResponse.ok) {
            const externalData = await externalResponse.json();
            binInfo = {
              bin: bin,
              brand: externalData.scheme || 'Unknown',
              type: externalData.type || 'Unknown',
              level: externalData.bank?.name ? 'Standard' : 'Unknown',
              country: externalData.country?.name || 'Unknown',
              bank: externalData.bank?.name || 'Unknown',
              bank_phone: externalData.bank?.phone || 'Unknown',
              bank_website: externalData.bank?.url || 'Unknown',
              bank_address: externalData.bank?.address || 'Unknown',
              prepaid: externalData.prepaid || false,
              corporate: externalData.corporate || false,
              source: 'external_api'
            };
          }
        } catch (externalError) {
          console.error('External API error:', externalError);
        }
        
        // If no external data, create basic info
        if (!binInfo) {
          binInfo = {
            bin: bin,
            brand: 'Unknown',
            type: 'Unknown',
            level: 'Unknown',
            country: 'Unknown',
            bank: 'Unknown',
            bank_phone: 'Unknown',
            bank_website: 'Unknown',
            bank_address: 'Unknown',
            prepaid: false,
            corporate: false,
            source: 'generated'
          };
        }
      }
      
      // Record the BIN check in history
      await supabase
        .from('bin_check_history')
        .insert({
          user_id: req.user.userId,
          bin: bin,
          result: binInfo,
          checked_at: new Date().toISOString()
        });
      
      res.status(200).json({
        success: true,
        bin_info: binInfo,
        message: 'BIN check completed successfully'
      });
    });
  } catch (error) {
    console.error('BIN check error:', error);
    res.status(500).json({ error: 'Failed to check BIN' });
  }
}

// Bulk BIN Check
async function handleBulkBinCheck(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { bins } = req.body;
      
      if (!bins || !Array.isArray(bins) || bins.length === 0) {
        return res.status(400).json({ error: 'BINs array is required' });
      }
      
      if (bins.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 BINs allowed per request' });
      }
      
      const results = [];
      const errors = [];
      
      for (const bin of bins) {
        try {
          // Validate BIN format
          const binRegex = /^\d{6,8}$/;
          if (!binRegex.test(bin)) {
            errors.push({ bin, error: 'Invalid BIN format' });
            continue;
          }
          
          // Check our database first
          const { data: existingBin } = await supabase
            .from('bin_database')
            .select('*')
            .eq('bin', bin)
            .single();
          
          let binInfo = null;
          
          if (existingBin) {
            binInfo = {
              bin: existingBin.bin,
              brand: existingBin.brand,
              type: existingBin.card_type,
              level: existingBin.level,
              country: existingBin.country,
              bank: existingBin.bank,
              bank_phone: existingBin.bank_phone,
              bank_website: existingBin.bank_website,
              bank_address: existingBin.bank_address,
              prepaid: existingBin.prepaid,
              corporate: existingBin.corporate,
              source: 'database'
            };
          } else {
            // Try external API
            try {
              const externalResponse = await fetch(`https://lookup.binlist.net/${bin}`);
              if (externalResponse.ok) {
                const externalData = await externalResponse.json();
                binInfo = {
                  bin: bin,
                  brand: externalData.scheme || 'Unknown',
                  type: externalData.type || 'Unknown',
                  level: externalData.bank?.name ? 'Standard' : 'Unknown',
                  country: externalData.country?.name || 'Unknown',
                  bank: externalData.bank?.name || 'Unknown',
                  bank_phone: externalData.bank?.phone || 'Unknown',
                  bank_website: externalData.bank?.url || 'Unknown',
                  bank_address: externalData.bank?.address || 'Unknown',
                  prepaid: externalData.prepaid || false,
                  corporate: externalData.corporate || false,
                  source: 'external_api'
                };
              }
            } catch (externalError) {
              console.error(`External API error for BIN ${bin}:`, externalError);
            }
            
            if (!binInfo) {
              binInfo = {
                bin: bin,
                brand: 'Unknown',
                type: 'Unknown',
                level: 'Unknown',
                country: 'Unknown',
                bank: 'Unknown',
                bank_phone: 'Unknown',
                bank_website: 'Unknown',
                bank_address: 'Unknown',
                prepaid: false,
                corporate: false,
                source: 'generated'
              };
            }
          }
          
          results.push(binInfo);
          
          // Record in history
          await supabase
            .from('bin_check_history')
            .insert({
              user_id: req.user.userId,
              bin: bin,
              result: binInfo,
              checked_at: new Date().toISOString()
            });
          
        } catch (binError) {
          errors.push({ bin, error: binError.message });
        }
      }
      
      res.status(200).json({
        success: true,
        results: results,
        errors: errors,
        total_checked: bins.length,
        successful: results.length,
        failed: errors.length,
        message: 'Bulk BIN check completed'
      });
    });
  } catch (error) {
    console.error('Bulk BIN check error:', error);
    res.status(500).json({ error: 'Failed to perform bulk BIN check' });
  }
}

// BIN Lookup (Get specific BIN info)
async function handleBinLookup(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { bin } = req.query;
      
      if (!bin) {
        return res.status(400).json({ error: 'BIN is required' });
      }
      
      // Check our database
      const { data: binData, error } = await supabase
        .from('bin_database')
        .select('*')
        .eq('bin', bin)
        .single();
      
      if (error || !binData) {
        return res.status(404).json({ error: 'BIN not found in database' });
      }
      
      const binInfo = {
        bin: binData.bin,
        brand: binData.brand,
        type: binData.card_type,
        level: binData.level,
        country: binData.country,
        bank: binData.bank,
        bank_phone: binData.bank_phone,
        bank_website: binData.bank_website,
        bank_address: binData.bank_address,
        prepaid: binData.prepaid,
        corporate: binData.corporate,
        last_updated: binData.updated_at || binData.created_at
      };
      
      res.status(200).json({
        success: true,
        bin_info: binInfo
      });
    });
  } catch (error) {
    console.error('BIN lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup BIN' });
  }
}

// Get User's BIN Check History
async function handleGetHistory(req, res) {
  try {
    requireAuth(req, res, async () => {
      const { page = 1, limit = 20, bin = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('bin_check_history')
        .select('*')
        .eq('user_id', req.user.userId)
        .order('checked_at', { ascending: false });
      
      if (bin) {
        query = query.eq('bin', bin);
      }
      
      const { data: history, error, count } = await query
        .range(offset, offset + limit - 1)
        .select('*', { count: 'exact' });
      
      if (error) throw error;
      
      res.status(200).json({
        success: true,
        history: history || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      });
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get BIN check history' });
  }
}

// Get BIN Check Statistics
async function handleGetStats(req, res) {
  try {
    requireAuth(req, res, async () => {
      // Get total BINs checked by user
      const { count: totalChecks } = await supabase
        .from('bin_check_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.userId);
      
      // Get unique BINs checked
      const { data: uniqueBins } = await supabase
        .from('bin_check_history')
        .select('bin')
        .eq('user_id', req.user.userId);
      
      const uniqueBinCount = uniqueBins ? new Set(uniqueBins.map(h => h.bin)).size : 0;
      
      // Get most checked BINs
      const { data: topBins } = await supabase
        .from('bin_check_history')
        .select('bin, count')
        .eq('user_id', req.user.userId)
        .select('bin')
        .limit(5);
      
      // Count occurrences
      const binCounts = {};
      if (topBins) {
        topBins.forEach(h => {
          binCounts[h.bin] = (binCounts[h.bin] || 0) + 1;
        });
      }
      
      const topBinsSorted = Object.entries(binCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([bin, count]) => ({ bin, count }));
      
      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('bin_check_history')
        .select('bin, checked_at')
        .eq('user_id', req.user.userId)
        .order('checked_at', { ascending: false })
        .limit(10);
      
      res.status(200).json({
        success: true,
        stats: {
          total_checks: totalChecks || 0,
          unique_bins: uniqueBinCount,
          top_bins: topBinsSorted,
          recent_activity: recentActivity || []
        }
      });
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get BIN check statistics' });
  }
}
