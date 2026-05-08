# CodeReflex - Deployment Guide for Vercel

This guide explains how to deploy CodeReflex on Vercel using Next.js App Router.

---

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Node.js 18+ installed locally

---

## Step 1: Prepare Repository

### Ensure Git is initialized and changes are committed

```bash
cd code-reflex

# Check git status
git status

# Add and commit all changes
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git push origin main
```

---

## Step 2: Connect to Vercel

### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`CodeReflex`)
4. Configure the project:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `next build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |

5. Click **"Deploy"**

### Option B: Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Step 3: Environment Variables

Vercel automatically provides these. No additional variables needed for basic deployment.

If you add API endpoints later:

1. Go to Project Settings → Environment Variables
2. Add variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.com
   ```

---

## Step 4: Handle Public/Content Assets

Your exercises are in `src/data/exercises/`. These are already bundled with the app.

### For Static Content (if needed)

Move JSON files to `public/content/exercises/`:

```bash
# Create public directory structure
mkdir -p public/content/exercises

# Copy exercises (if stored separately)
# Update exerciseRepository.ts to fetch from:
# /content/exercises/all.json
```

The current setup fetches from `src/data` which gets bundled automatically.

---

## Step 5: Local Testing with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Run local dev server (Next.js)
npm run dev

# Or use Vercel for production-like testing
vercel dev --port 3000
```

---

## Step 6: Optimize for Production

### Update next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Optimize Monaco Editor
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
```

### Recommended Optimizations

1. **Bundle Analyzer** (optional):
```bash
npm install @next/bundle-analyzer
```

2. **Image Optimization**: Next.js handles automatically

3. **Font Optimization**: Already configured with `next/font`

---

## Step 7: Performance Recommendations

### 1. Use Dynamic Imports for Heavy Components

Already implemented in `page.tsx`:
```tsx
const ReflexTyping = lazy(() => import('@/components/exercises/ReflexTyping'));
```

### 2. Configure Caching

Vercel automatically caches:
- Static assets (immutable)
- `_next/data` (versioned)
- API responses (with `Cache-Control`)

### 3. Enable Analytics (optional)

```bash
npm install @vercel/analytics
```

Add to `layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react'

<Analytics />
```

---

## Step 8: Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds locally
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` has no errors (warnings OK)
- [ ] All components use client/server correctly
- [ ] No hardcoded URLs (use env variables)

---

## Step 9: Deploy

### Automatic Deployments

Every push to `main` triggers deployment automatically.

### Manual Deployment

```bash
vercel --prod
```

---

## Troubleshooting

### Build Fails

```bash
# Check build locally
npm run build

# Check TypeScript
npm run typecheck
```

### Monaco Editor Issues

If Monaco fails to load:
```typescript
// next.config.ts
webpack: (config) => {
  config.resolve.alias['monaco-editor'] = 'monaco-editor/esm/vs/editor/editor.api';
  return config;
}
```

### Out of Memory

Add to `package.json`:
```json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

---

## Post-Deployment

1. **Visit your deployment**: `https://your-project.vercel.app`
2. **Test functionality**:
   - Load exercises
   - Complete a reflex typing session
   - Verify stats persist
3. **Check console**: No critical errors

---

## Summary of Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Deploy to Vercel
vercel --prod
```

---

## Notes

- **Free Tier**: 100GB bandwidth/month, 500 build minutes/month
- **Custom Domain**: Add in Project Settings → Domains
- **Environment**: Automatically set to `production` on Vercel

For more info: [vercel.com/docs](https://vercel.com/docs)