# Genesis Market - Premium Marketplace Clone

A comprehensive, full-stack marketplace application designed for educational purposes, featuring advanced user management, invite systems, referral programs, and secure transaction handling.

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
- **Credit Cards** - Comprehensive stolen credential management
- **Bot Dumps** - Infected device data with detailed system information
- **Services** - Professional cybercrime service offerings
- **Software** - Malware and hacking tools marketplace
- **Accounts** - Compromised online account management

### Advanced Features
- **Real-time Cart System** - Shopping cart with timeout functionality
- **Advanced Filtering** - Multi-criteria search and filtering
- **Detailed Analytics** - Comprehensive data visualization
- **Notification System** - Real-time alerts and updates
- **Ticket System** - Customer support and issue tracking

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
- **Notifications** - User notification management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/genesis-market.git
cd genesis-market
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Environment Configuration

#### Client Environment
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Genesis Market
```

#### Server Environment
Create `server/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Security Configuration
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
```

### 4. Database Setup

#### Supabase Setup
1. Create a new Supabase project
2. Get your project URL and API keys
3. Update your `.env` file with the credentials
4. The server will automatically create all necessary tables

#### Manual Database Setup (Optional)
If you prefer to use a local PostgreSQL database:
```sql
-- Create database
CREATE DATABASE genesis_market;

-- Run the initialization script
node server/scripts/firstInit.js
```

### 5. Start Development Servers

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

## 📱 Usage

### User Registration
1. Obtain an invite code from an existing member
2. Navigate to `/register`
3. Fill in your details and invite code
4. Verify your email (if enabled)
5. Start using the marketplace

### Creating Invites
1. Log in to your account
2. Navigate to `/invites`
3. Click "Create Invite"
4. Share the generated code with others
5. Earn bonuses when invites are used

### Making Purchases
1. Browse available products
2. Add items to your cart
3. Review cart contents
4. Complete checkout process
5. Receive product data

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable salt rounds
- **Rate Limiting** - API request throttling
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive data validation
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content Security Policy headers

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
1. Build the client: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`
4. Configure reverse proxy (nginx/Apache)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/invite` - Create invite
- `GET /api/auth/invites` - Get user invites
- `GET /api/auth/referrals` - Get user referrals
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Health Check
- `GET /api/health` - API health status

## 🧪 Testing

### Run Tests
```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

### Test Coverage
```bash
# Generate coverage reports
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Notice

This software is provided for educational purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The developers are not responsible for any misuse of this software.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/genesis-market/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/genesis-market/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/genesis-market/discussions)

## 🙏 Acknowledgments

- Genesis Market (original concept)
- React and Node.js communities
- Supabase team for excellent database service
- All contributors and supporters

---

**Remember**: This is an educational project. Use responsibly and legally.