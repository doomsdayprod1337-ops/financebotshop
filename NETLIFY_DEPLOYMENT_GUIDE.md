# 🚀 Netlify Deployment Guide for Finance Shop Bot

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ A Netlify account (free at [netlify.com](https://netlify.com))
- ✅ Your code pushed to GitHub/GitLab/Bitbucket
- ✅ A Supabase project set up
- ✅ Your Supabase credentials ready

## 🔧 Quick Deployment Steps

### Option 1: Netlify Dashboard (Recommended)

1. **Go to [netlify.com](https://netlify.com) and sign in**

2. **Click "New site from Git"**

3. **Connect your repository:**
   - Choose your Git provider
   - Select your Finance Shop Bot repository
   - Click "Connect"

4. **Configure build settings:**
   - **Build command:** `npm run build:netlify:simple`
   - **Publish directory:** `client/dist`
   - **Functions directory:** `api`

5. **Click "Deploy site"**

6. **Set environment variables** (in Site settings > Environment variables):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-site-name.netlify.app
   ```

### Option 2: Using Deployment Scripts

#### Windows (Batch):
```cmd
deploy-to-netlify.bat
```

#### Windows (PowerShell):
```powershell
.\deploy-to-netlify.ps1
```

## 🏗️ Build Configuration

Your project is already configured with `netlify.toml`:

```toml
[build]
  command = "npm run build:netlify:simple"
  publish = "client/dist"
  functions = "api"

[build.environment]
  NODE_VERSION = "20"
  NPM_CONFIG_LEGACY_PEER_DEPS = "true"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔑 Environment Variables

### Required Variables:
- **`SUPABASE_URL`** - Your Supabase project URL
- **`SUPABASE_ANON_KEY`** - Your Supabase anonymous key
- **`JWT_SECRET`** - Your JWT secret key

### Optional Variables:
- **`FRONTEND_URL`** - Your Netlify site URL (for CORS)

## 📁 Project Structure for Deployment

```
Finance Shop Bot/
├── api/                    # Backend API endpoints (Netlify Functions)
├── client/                 # React frontend application
├── netlify.toml           # Netlify configuration
├── package.json            # Root package.json with build scripts
└── client/package.json     # Client package.json
```

## 🚀 Build Scripts

Your project includes optimized build scripts:

- **`npm run build:netlify:simple`** - Simple build for Netlify
- **`npm run build:netlify`** - Full build with caching
- **`npm run build:netlify:fallback`** - Fallback build method

## 🔍 Troubleshooting

### Common Issues:

1. **Build fails with dependency errors:**
   - Use `npm run build:netlify:simple` (uses `--legacy-peer-deps`)

2. **API endpoints not working:**
   - Check that `functions` directory is set to `api`
   - Verify environment variables are set

3. **CORS issues:**
   - Set `FRONTEND_URL` environment variable
   - Check API endpoint CORS headers

4. **Database connection fails:**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Check Supabase project status

### Build Logs:
- Check Netlify build logs in the dashboard
- Look for specific error messages
- Verify Node.js version (should be 18+)

## 📱 Post-Deployment

### 1. Test Your Site:
- Visit your Netlify URL
- Test all major functionality
- Verify API endpoints work

### 2. Custom Domain (Optional):
- Go to Site settings > Domain management
- Add your custom domain
- Configure DNS settings

### 3. Environment Variables:
- Set production environment variables
- Test with production Supabase instance

### 4. Monitoring:
- Enable Netlify Analytics
- Monitor function execution
- Check error logs

## 🔄 Continuous Deployment

Once deployed, Netlify will automatically:
- Deploy on every push to your main branch
- Run your build command
- Deploy new versions automatically

## 📞 Support

If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build`
4. Check Supabase connection
5. Review API endpoint logs

## 🎉 Success!

Your Finance Shop Bot is now deployed on Netlify! 

**Next steps:**
- Test all functionality
- Set up monitoring
- Configure custom domain (if needed)
- Set up production environment variables

---

**Happy Deploying! 🚀**
