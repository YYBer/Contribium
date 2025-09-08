# Cloudflare Pages Deployment Guide

This guide will help you deploy Contribium to Cloudflare Pages using your domain `https://contribium.alephium.org`.

## Prerequisites

1. A Cloudflare account
2. Access to the `alephium.org` domain in your Cloudflare dashboard
3. The project repository on GitHub (or GitLab/Bitbucket)

## Deployment Steps

### Step 1: Push to Git Repository

Make sure all your changes are committed and pushed to your main branch:

```bash
git add .
git commit -m "feat: Configure Cloudflare Pages deployment"
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your repository (authorize GitHub/GitLab if needed)
6. Configure the build settings:

#### Build Settings:
- **Project name**: `contribium`
- **Production branch**: `main`
- **Build command**: `npm install --legacy-peer-deps && npm run build:pages`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty if repo root)
- **Node.js version**: `22` (will use .nvmrc file)

### Step 3: Environment Variables

In your Cloudflare Pages project settings, add these environment variables:

```
VITE_SUPABASE_URL=https://wawxluhjdnqewiaexvvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhd3hsdWhqZG5xZXdpYWV4dnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4Mjk5MzYsImV4cCI6MjA1MTQwNTkzNn0.4mZkZ6HtPL52HSS8IgyJ_HU6N1G8Mu5BBmlTCpHlTGo
VITE_APP_URL=https://contribium.alephium.org
```

### Step 4: Configure Custom Domain

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `contribium.alephium.org`
4. Cloudflare will automatically configure the DNS records

### Step 5: Deploy

1. Click **Save and Deploy**
2. Cloudflare will automatically build and deploy your app
3. The deployment will be available at your custom domain once DNS propagates

## Build Configuration

The following files have been configured for optimal Cloudflare Pages deployment:

### `wrangler.toml`
```toml
name = "contribium"
compatibility_date = "2024-01-15"

[env.production]
name = "contribium"
route = "contribium.alephium.org/*"

[[env.production.routes]]
pattern = "contribium.alephium.org/*"
zone_name = "alephium.org"
```

### `public/_redirects`
- Handles client-side routing for React Router
- Sets security headers
- Configured for SPA (Single Page Application)

### `vite.config.ts`
- Optimized bundle splitting
- Production build settings
- Cloudflare Pages compatibility

## Post-Deployment

### 1. Verify SSL Certificate
- SSL should be automatic with Cloudflare
- Check that `https://contribium.alephium.org` loads properly

### 2. Test Features
- User authentication (Supabase)
- Navigation and routing
- API calls to Supabase

### 3. Configure Supabase
Update your Supabase project settings:
- Add `https://contribium.alephium.org` to allowed origins
- Update redirect URLs for authentication

## Automatic Deployments

Once set up, Cloudflare Pages will automatically:
- Deploy on every push to your main branch
- Build using the Vite build command
- Serve the static files with global CDN
- Handle SSL certificates
- Provide preview deployments for pull requests

## Monitoring and Logs

- View deployment logs in Cloudflare Pages dashboard
- Monitor performance with Cloudflare Analytics
- Set up alerts for deployment failures

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify `package.json` dependencies
- Review build logs in Cloudflare dashboard

### Routing Issues
- Ensure `_redirects` file is in the `public` folder
- Check that client-side routing is working

### API Issues
- Verify Supabase URLs and keys
- Check CORS settings in Supabase
- Ensure environment variables are properly set

## Security Considerations

- Environment variables are encrypted in Cloudflare
- Only `VITE_` prefixed variables are exposed to the client
- Supabase RLS (Row Level Security) should be enabled
- Review and update security headers as needed

## Performance Optimization

The current build configuration includes:
- Code splitting for optimal loading
- Gzip compression
- CDN distribution via Cloudflare
- Optimized chunk sizes

For further optimization:
- Consider implementing service workers
- Use lazy loading for large components
- Optimize images and assets