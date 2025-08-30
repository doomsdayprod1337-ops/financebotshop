# 🚀 Netlify Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Supabase project created and configured
- [ ] Supabase credentials ready
- [ ] JWT secret key generated
- [ ] Netlify account created

## 🔧 Build & Deploy

### Step 1: Run Build Script
```cmd
deploy-netlify-client-dist.bat
```

### Step 2: Verify Build Output
- ✅ `client/dist` folder exists
- ✅ All files built successfully
- ✅ No build errors

### Step 3: Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "New site from Git"**
3. **Connect your repository**
4. **Configure build settings:**
   - **Build command:** `npm run build:netlify:simple`
   - **Publish directory:** `client/dist` ⭐ **CRITICAL!**
   - **Functions directory:** `api`
5. **Click "Deploy site"**

## 🔑 Environment Variables

Set these in Netlify (Site settings > Environment variables):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-site-name.netlify.app
```

## 📁 Expected File Structure

```
Finance Shop Bot/
├── api/                    # ✅ Netlify Functions
├── client/
│   ├── dist/              # ✅ Build output (publish directory)
│   └── src/
├── netlify.toml           # ✅ Netlify config
└── package.json            # ✅ Build scripts
```

## 🚨 Common Issues

- **Wrong publish directory:** Must be `client/dist` not `dist`
- **Missing environment variables:** Check all required vars are set
- **Build fails:** Use `npm run build:netlify:simple`
- **API not working:** Verify `functions` directory is `api`

## 🎯 Success Indicators

- ✅ Site deploys without errors
- ✅ Frontend loads correctly
- ✅ API endpoints respond
- ✅ Database connection works
- ✅ Authentication functions

---

**Ready to deploy? Run `deploy-netlify-client-dist.bat` first!**
