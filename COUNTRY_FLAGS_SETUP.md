# 🌍 Country Flags Setup Guide

This guide will help you implement country flags for bots in your marketplace using the [world.db.flags](https://github.com/worlddb/world.db.flags.git) repository.

## 📋 Prerequisites

- Access to your Supabase database
- Basic knowledge of SQL
- React development environment set up

## 🚀 Step-by-Step Implementation

### 1. **Download Flag Assets**

First, clone the world.db.flags repository to get the flag images:

```bash
# Clone the repository
git clone https://github.com/worlddb/world.db.flags.git

# Navigate to the flags directory
cd world.db.flags/vendor/assets/images/flags

# Copy the flags to your project
cp -r * /path/to/your/project/client/public/assets/flags/
```

### 2. **Organize Flag Assets**

Create the following directory structure in your project:

```
client/public/assets/flags/
├── us-24.png
├── us-32.png
├── us-48.png
├── us-64.png
├── gb-24.png
├── gb-32.png
├── gb-48.png
├── gb-64.png
└── ... (all other countries)
```

### 3. **Database Migration**

Run the database migration script to add country support:

```sql
-- Execute the database-add-country-flags.sql file
-- This will add the country_code column and sample data
```

Or manually run these commands:

```sql
-- Add country_code column
ALTER TABLE bots ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'US';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bots_country_code ON bots(country_code);

-- Update existing bots with sample country codes
UPDATE bots SET country_code = 'US' WHERE id = 1;
UPDATE bots SET country_code = 'GB' WHERE id = 2;
-- ... add more as needed
```

### 4. **Install Components**

The following components have been created and are ready to use:

- `client/src/utils/flags.js` - Country data and utility functions
- `client/src/components/CountrySelector.jsx` - Country selection dropdown
- `client/src/components/CountryFlag.jsx` - Flag display component
- `client/src/components/BotCard.jsx` - Enhanced bot card with flags

### 5. **Update Bot Creation/Editing Forms**

Add country selection to your bot forms:

```jsx
import CountrySelector from '../components/CountrySelector';

// In your bot form component
const [botData, setBotData] = useState({
  name: '',
  description: '',
  price: 0,
  country_code: 'US', // Default to US
  // ... other fields
});

// In your JSX
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Country
  </label>
  <CountrySelector
    selectedCountry={botData.country_code}
    onCountryChange={(code) => setBotData({...botData, country_code: code})}
    placeholder="Select bot country..."
  />
</div>
```

### 6. **Update Bot Display**

Use the enhanced BotCard component:

```jsx
import BotCard from '../components/BotCard';

// In your bots list
{bots.map(bot => (
  <BotCard
    key={bot.id}
    bot={bot}
    onPurchase={handlePurchase}
    onViewDetails={handleViewDetails}
    showCountryInfo={true}
    flagSize={32}
  />
))}
```

### 7. **Update API Endpoints**

Ensure your bot API endpoints include the country_code field:

```javascript
// api/bots.js
const { data: bots, error } = await supabase
  .from('bots')
  .select(`
    id, 
    name, 
    description, 
    price, 
    country_code,
    status,
    category,
    created_at
  `)
  .order('created_at', { ascending: false });
```

## 🎨 Customization Options

### **Flag Sizes**

Use different flag sizes for different contexts:

```jsx
import { FLAG_SIZES } from '../utils/flags';

// Small flags for lists
<CountryFlag countryCode="US" size={FLAG_SIZES.SMALL} />

// Medium flags for cards
<CountryFlag countryCode="US" size={FLAG_SIZES.MEDIUM} />

// Large flags for detailed views
<CountryFlag countryCode="US" size={FLAG_SIZES.LARGE} />
```

### **Country Selector Features**

Customize the CountrySelector component:

```jsx
<CountrySelector
  selectedCountry={selectedCountry}
  onCountryChange={handleCountryChange}
  showSearch={true}        // Enable search
  showRegions={true}       // Enable region filtering
  showPopular={true}       // Show popular countries
  flagSize={32}            // Flag size
  placeholder="Choose country..."
/>
```

### **Bot Card Customization**

Customize the BotCard display:

```jsx
<BotCard
  bot={bot}
  showCountryInfo={true}   // Show country name and region
  flagSize={32}            // Flag size
  onPurchase={handlePurchase}
  onViewDetails={handleViewDetails}
/>
```

## 🔧 Utility Functions

### **Get Country Information**

```javascript
import { getCountryName, getCountryRegion, getFlagUrl } from '../utils/flags';

const countryName = getCountryName('US');        // "United States"
const countryRegion = getCountryRegion('US');    // "North America"
const flagUrl = getFlagUrl('US', 32);           // "/assets/flags/us-32.png"
```

### **Search and Filter Countries**

```javascript
import { searchCountries, getCountriesByRegion, getPopularCountries } from '../utils/flags';

// Search countries
const results = searchCountries('united');  // Returns US, GB, etc.

// Get countries by region
const europeanCountries = getCountriesByRegion()['Europe'];

// Get popular countries
const popular = getPopularCountries();  // US, GB, DE, FR, JP, etc.
```

## 📱 Responsive Design

The components are designed to work on all screen sizes:

- **Mobile**: Compact flag display with country names
- **Tablet**: Medium flags with additional country info
- **Desktop**: Full country selector with search and filtering

## 🚨 Error Handling

### **Missing Flags**

The system includes fallback handling:

```jsx
<CountryFlag 
  countryCode="XX" 
  fallbackToUS={true}  // Show US flag if country flag missing
/>
```

### **Invalid Country Codes**

Database constraints prevent invalid country codes:

```sql
-- The migration script adds this constraint
ALTER TABLE bots ADD CONSTRAINT chk_valid_country_code 
CHECK (country_code ~ '^[A-Z]{2,3}$');
```

## 🧪 Testing

### **Test Country Selection**

1. Create a new bot with different countries
2. Verify flags display correctly
3. Test country search and filtering
4. Check responsive behavior

### **Test API Integration**

1. Verify country_code is saved to database
2. Check country information is returned in API responses
3. Test country-based filtering

## 🔍 Troubleshooting

### **Flags Not Displaying**

- Check flag file paths in `/assets/flags/`
- Verify flag filenames match country codes (lowercase)
- Check browser console for 404 errors

### **Country Selector Issues**

- Ensure all dependencies are imported
- Check for JavaScript errors in console
- Verify country data is loaded correctly

### **Database Issues**

- Run migration script again if needed
- Check database permissions
- Verify table structure

## 📚 Additional Resources

- [world.db.flags Repository](https://github.com/worlddb/world.db.flags.git)
- [ISO Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- [Flag Design Guidelines](https://flaginstitute.org/wp/flag-design-guidelines/)

## 🎯 Next Steps

After implementing country flags:

1. **Add country-based filtering** to bot listings
2. **Implement region-based grouping** for better organization
3. **Add country-specific pricing** or features
4. **Create country-based analytics** and reporting
5. **Add localization** for different countries

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all files are in the correct locations
3. Test with a simple country code first (e.g., 'US')
4. Ensure database migration completed successfully

The country flags system will give your bot marketplace a professional, international appearance and help users easily identify bots by their country of origin!
