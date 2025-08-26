# Netlify Deployment Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Dependency Installation Error (ETIMEDOUT)

**Error Message:**
```
npm error code ETIMEDOUT
npm error network request to https://***.netlify.app/packages/buildhooks.tgz failed
npm error network This is a problem related to network connectivity
```

**Solutions:**

#### A. Use Custom Build Script
- The project now includes `netlify-build.sh` (Linux/Mac) and `netlify-build.bat` (Windows)
- These scripts handle dependencies more reliably with offline-first approach

#### B. Update Netlify Configuration
```toml
[build.environment]
  NPM_FLAGS = "--no-optional --prefer-offline --cache-min=9999999"
  NPM_CONFIG_CACHE = ".npm-cache"
  NPM_CONFIG_PREFER_OFFLINE = "true"
  NPM_CONFIG_NO_OPTIONAL = "true"
```

#### C. Clear NPM Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. Build Command Issues

**Problem:** Build command fails or times out

**Solution:** Use the custom build script
```toml
[build]
  command = "bash netlify-build.sh"  # Linux/Mac
  # or
  command = "netlify-build.bat"      # Windows
```

### 3. Node Version Conflicts

**Problem:** Incompatible Node.js version

**Solution:** Specify Node version in netlify.toml
```toml
[build.environment]
  NODE_VERSION = "18"
```

### 4. Function Dependencies

**Problem:** Serverless functions fail to build

**Solution:** Configure external modules
```toml
[functions]
  external_node_modules = ["@supabase/supabase-js", "bcryptjs", "jsonwebtoken"]
  node_bundler = "esbuild"
```

## 🔧 Manual Deployment Steps

### 1. Local Testing
```bash
# Test build locally
npm run build:netlify

# Check if build output exists
ls -la client/dist
```

### 2. Force Redeploy
- Go to Netlify dashboard
- Navigate to your site
- Click "Trigger deploy" → "Deploy site"
- This bypasses cache issues

### 3. Clear Build Cache
- In Netlify dashboard: Site settings → Build & deploy → Clear cache
- This removes cached dependencies

## 📋 Environment Variables

Ensure these are set in Netlify:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`

## 🚀 Alternative Deployment Methods

### 1. GitHub Actions
- Push to GitHub
- Let Netlify auto-deploy from GitHub
- More reliable than manual builds

### 2. Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 3. Manual Upload
- Build locally: `npm run build`
- Upload `client/dist` folder to Netlify

## 📞 Getting Help

### 1. Check Netlify Status
- Visit [status.netlify.com](https://status.netlify.com)
- Check for service issues

### 2. Netlify Support
- Community forum: [community.netlify.com](https://community.netlify.com)
- Documentation: [docs.netlify.com](https://docs.netlify.com)

### 3. Common Solutions
- Wait 5-10 minutes and retry
- Check network connectivity
- Verify package.json dependencies
- Clear browser cache and cookies

## ✅ Success Checklist

- [ ] Dependencies install without timeout
- [ ] Build completes successfully
- [ ] Functions deploy correctly
- [ ] Site loads without errors
- [ ] API endpoints respond properly
- [ ] Environment variables are set
- [ ] Redirects work correctly

## 🔄 Rollback Plan

If deployment fails:
1. Revert to previous working commit
2. Use `git revert <commit-hash>`
3. Push changes to trigger new deployment
4. Test locally before deploying
