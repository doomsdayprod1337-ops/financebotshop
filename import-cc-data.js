const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Function to get table schema
async function getTableSchema() {
  try {
    // Try to get a sample record to see what columns exist
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error getting table schema:', error);
      return null;
    }
    
    // If table is empty, try to get column info from a dummy insert
    if (!data || data.length === 0) {
      console.log('📋 Table is empty, using default schema...');
      return {
        // Using minimal schema
      };
    }
    
    const columns = Object.keys(data[0]);
    console.log('📋 Available columns:', columns);
    
    return {
      allColumns: columns
    };
  } catch (error) {
    console.error('❌ Error checking table schema:', error);
    return null;
  }
}

// Read and parse the CC_data.txt file
async function importCreditCardData() {
  try {
    console.log('🚀 Starting credit card data import...');
    
    // First, check the table schema
    const schema = await getTableSchema();
    if (!schema) {
      console.error('❌ Could not determine table schema. Aborting import.');
      process.exit(1);
    }
    
    console.log('📊 Schema check results:', schema);
    
    // Read the CC_data.txt file
    const filePath = path.join(__dirname, 'Log Examples', 'cc_data.txt');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ CC_data.txt file not found in Log Examples directory');
      console.log('📁 Expected path:', filePath);
      console.log('📁 Current directory:', __dirname);
      console.log('📁 Available files in Log Examples:');
      try {
        const logFiles = fs.readdirSync(path.join(__dirname, 'Log Examples'));
        logFiles.forEach(file => console.log(`  - ${file}`));
      } catch (err) {
        console.log('  Could not read Log Examples directory');
      }
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split into lines and filter empty lines
    const lines = fileContent.split('\n').filter(line => line.trim());
    console.log(`📊 Found ${lines.length} credit card entries to process`);
    
    // Process each line
    const processedCards = [];
    const invalidCards = [];
    const expiredCards = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Show progress
      if ((i + 1) % 10 === 0 || i === 0) {
        console.log(`📊 Processing card ${i + 1}/${lines.length}...`);
      }
      
      try {
        // Split by pipe delimiter
        const fields = line.split('|');
        
        // Check if we have at least the basic required fields
        if (fields.length < 5) {
          invalidCards.push({ line: i + 1, reason: 'Insufficient fields', data: line });
          continue;
        }
        
        const [cc, mm, yy, cvv, firstName, lastName, street, city, zip, dob, ssn, email, emailPass, phone, fingerprint] = fields;
        
        // Validate card number format (14-17 digits)
        const cleanNumber = cc.replace(/\s+/g, '').replace(/-/g, '');
        if (!/^\d{14,17}$/.test(cleanNumber)) {
          invalidCards.push({ line: i + 1, reason: 'Invalid card number format', data: cc });
          continue;
        }
        
        // Validate expiry
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        const expMonth = parseInt(mm);
        const expYear = parseInt(yy);
        
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          expiredCards.push({ line: i + 1, reason: 'Card expired', data: `${mm}/${yy}` });
          continue;
        }
        
        // Validate month and year format
        if (expMonth < 1 || expMonth > 12) {
          invalidCards.push({ line: i + 1, reason: 'Invalid month', data: mm });
          continue;
        }
        
        // Validate CVV (optional)
        if (cvv && !/^\d{3,4}$/.test(cvv)) {
          invalidCards.push({ line: i + 1, reason: 'Invalid CVV', data: cvv });
          continue;
        }
        
        // Format card number with spaces for display
        const formattedCardNumber = cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
        
        // Generate a random price between $5 and $50
        const price = (Math.random() * 45 + 5).toFixed(2);
        
        // Get BIN details from API
        let bank = 'Unknown';
        let cardType = 'Credit';
        
        try {
          const binNumber = cleanNumber.substring(0, 6);
          const binResponse = await fetch(`https://lookup.binlist.net/${binNumber}`);
          
          if (binResponse.ok) {
            const binData = await binResponse.json();
            bank = binData.bank?.name || binData.scheme || 'Unknown';
            cardType = binData.type || 'Credit';
            console.log(`✅ BIN lookup successful for card ${i + 1}: ${bank} ${cardType}`);
          } else {
            // Fallback to basic detection if API fails
            if (cleanNumber.startsWith('4')) {
              bank = 'Visa';
            } else if (cleanNumber.startsWith('5')) {
              bank = 'Mastercard';
            } else if (cleanNumber.startsWith('3')) {
              bank = 'American Express';
            } else if (cleanNumber.startsWith('6')) {
              bank = 'Discover';
            }
            console.log(`⚠️ BIN API failed for card ${i + 1}, using fallback: ${bank}`);
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`⚠️ BIN lookup failed for card ${i + 1}, using fallback detection`);
          // Fallback to basic detection
          if (cleanNumber.startsWith('4')) {
            bank = 'Visa';
          } else if (cleanNumber.startsWith('5')) {
            bank = 'Mastercard';
          } else if (cleanNumber.startsWith('3')) {
            bank = 'American Express';
          } else if (cleanNumber.startsWith('6')) {
            bank = 'Discover';
          }
        }
        
        // Create minimal card object with only essential fields
        const card = {
          card_number: formattedCardNumber,
          month: mm.padStart(2, '0'),
          year: yy,
          cvv: cvv || null,
          first_name: firstName || '',
          last_name: lastName || '',
          street: street || '',
          city: city || '',
          zip: zip || '',
          dob: dob || '',
          ssn: ssn || '',
          email: email || '',
          email_pass: emailPass || '',
          phone: phone || '',
          fingerprint: fingerprint || '',
          price: parseFloat(price),
          status: 'available',
          notes: `Imported from CC_data.txt - Line ${i + 1} (Bank: ${bank}, Type: ${cardType})`
        };
        
        // Balance column removed - not available in current schema
        
        // imported_by column removed - not available in current schema
        
        // imported_at column removed - not available in current schema
        
        processedCards.push(card);
        
      } catch (error) {
        console.error(`❌ Error processing line ${i + 1}:`, error);
        invalidCards.push({ line: i + 1, reason: 'Processing error', data: line });
      }
    }
    
    console.log(`✅ Processed ${processedCards.length} valid credit cards`);
    console.log(`❌ Found ${invalidCards.length} invalid entries`);
    console.log(`⏰ Found ${expiredCards.length} expired cards`);
    
    // Show some examples of invalid/expired cards
    if (invalidCards.length > 0) {
      console.log('\n📋 Examples of invalid entries:');
      invalidCards.slice(0, 5).forEach(card => {
        console.log(`  Line ${card.line}: ${card.reason} - ${card.data}`);
      });
    }
    
    if (expiredCards.length > 0) {
      console.log('\n⏰ Examples of expired cards:');
      expiredCards.slice(0, 5).forEach(card => {
        console.log(`  Line ${card.line}: ${card.reason} - ${card.data}`);
      });
    }
    
    // Insert valid cards into database
    if (processedCards.length > 0) {
      console.log('\n💾 Inserting valid cards into database...');
      
      // Insert in batches to avoid overwhelming the database
      const batchSize = 50;
      let insertedCount = 0;
      
      for (let i = 0; i < processedCards.length; i += batchSize) {
        const batch = processedCards.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('credit_cards')
          .insert(batch)
          .select('id');
        
        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          throw error;
        }
        
        insertedCount += batch.length;
        console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} cards`);
      }
      
      console.log(`\n🎉 Successfully imported ${insertedCount} credit cards!`);
      
      // Show summary
      console.log('\n📊 Import Summary:');
      console.log(`  Total lines processed: ${lines.length}`);
      console.log(`  Valid cards imported: ${insertedCount}`);
      console.log(`  Invalid entries: ${invalidCards.length}`);
      console.log(`  Expired cards: ${expiredCards.length}`);
      console.log(`  Success rate: ${((insertedCount / lines.length) * 100).toFixed(1)}%`);
      console.log(`  BIN lookups: Enhanced with API data for better bank identification`);
      
    } else {
      console.log('⚠️ No valid credit cards found to import');
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importCreditCardData()
    .then(() => {
      console.log('\n✨ Import process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error);
      process.exit(1);
    });
}

module.exports = { importCreditCardData };
