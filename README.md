# Finance Shop Bot - Premium Marketplace

A comprehensive, full-stack marketplace application featuring advanced user management, invite systems, referral programs, and secure transaction handling.

## ⚠️ Educational Purpose Only

This project is created **exclusively for educational purposes** to demonstrate modern web development techniques, security practices, and system architecture. It is not intended for any illegal activities or real-world deployment.

## 🚀 Features

### Core System
- **User Authentication & Authorization** - Secure JWT-based authentication system
- **Invite-Only Registration** - Controlled access through invitation codes
- **Referral System** - Earn bonuses and commissions from referrals
- **Wallet System** - Digital currency management for transactions
- **Role-Based Access Control** - Admin, Manager, and User roles

### Marketplace Features
- **Credit Cards** - Comprehensive credential management system
- **Bot Dumps** - Device data with detailed system information
- **Services** - Professional service offerings
- **Software** - Tools and software marketplace
- **Accounts** - Online account management

### Advanced Features
- **Real-time Cart System** - Shopping cart with timeout functionality
- **Advanced Filtering** - Multi-criteria search and filtering
- **Detailed Analytics** - Comprehensive data visualization
- **Notification System** - Real-time alerts and updates
- **Ticket System** - Customer support and issue tracking
- **Crypto Integration** - Real-time cryptocurrency price tracking
- **Country Flags** - International support with flag displays

## 🏗️ Architecture

### Frontend
- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Supabase** - PostgreSQL database with real-time features
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing and security

### Database Schema
- **Users** - User accounts and profiles
- **Products** - Marketplace items and services
- **Orders** - Transaction management
- **Cart** - Shopping cart system
- **Invites** - Invitation code management
- **Referrals** - Referral tracking and commissions
- **Tickets** - Support ticket system
- **Credit Cards** - Credit card data management
- **Notifications** - User notification management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd finance-shop-bot
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Database Setup

Run the database setup scripts in your Supabase SQL editor:
1. `database.sql` - Main database structure
2. `database-add-credit-cards.sql` - Credit card tables
3. `database-enhanced-invites.sql` - Enhanced invitation system
4. `database-ticket-system.sql` - Support ticket system
5. `database-add-country-flags.sql` - Country flags support

### 5. Development
```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
finance-shop-bot/
├── api/                    # Backend API endpoints
├── client/                 # React frontend application
├── database-*.sql         # Database setup scripts
├── setup-cc-import-netlify.js  # Credit card import setup
├── import-cc-data.js      # Credit card data import script
└── netlify.toml          # Netlify deployment configuration
```

## 🚀 Deployment

### Netlify Deployment
The project includes optimized build scripts for Netlify:

```bash
# Use the robust PowerShell build script
./netlify-build-robust.ps1

# Or use the ultra-robust batch script
./netlify-build-ultra-robust.bat
```

### Environment Variables
Set these in your Netlify environment:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 🔧 Scripts

### Credit Card Import System
```bash
# Setup and test connection
node setup-cc-import-netlify.js --test

# Import credit card data
node import-cc-data.js
```

### Database Management
- `database-reset.sql` - Reset database to clean state
- `database-quick-setup.sql` - Quick database initialization

## 📚 Documentation

- **CREDIT_CARD_IMPORT_README.md** - Credit card import system details
- **ENHANCED_INVITATION_SYSTEM_README.md** - Invitation system features
- **CRYPTO_INTEGRATION_README.md** - Cryptocurrency integration
- **COUNTRY_FLAGS_SETUP.md** - Internationalization setup
- **NETLIFY_DEPLOYMENT_GUIDE.md** - Deployment instructions

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is for **educational purposes only**. Users are responsible for ensuring compliance with all applicable laws and regulations. The developers are not responsible for any misuse of this software.