# Deployment Guide

This guide explains how to deploy your multiplayer game with the frontend on Netlify and the backend on a separate hosting service.

## Architecture

- **Frontend**: React/Vite app → Deploy to Netlify
- **Backend**: Socket.IO server → Deploy to Railway, Render, Fly.io, or similar

## Prerequisites

1. GitHub account (for connecting to Netlify)
2. Account on a backend hosting service (Railway, Render, etc.)

---

## Step 1: Deploy Backend Server

### Option A: Railway (Recommended - Easy & Free tier available)

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - **Important**: Set the root directory to `server` (not the root of the repo)
   - Railway will use Node.js 20 (specified in `server/.nvmrc` and `server/nixpacks.toml`)

3. **Configure environment variables**:
   - Go to your project → Variables tab
   - Add:
     ```
     CLIENT_ORIGIN=https://your-netlify-app.netlify.app
     ```
   - Note: `PORT` is automatically set by Railway

4. **Deploy**:
   - Railway will auto-detect Node.js and deploy
   - Note your deployment URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com)

2. **Create Web Service**:
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Environment Variables**:
   ```
   CLIENT_ORIGIN=https://your-netlify-app.netlify.app
   ```

4. **Deploy**: Render will build and deploy automatically

### Option C: Fly.io

1. **Install Fly CLI**: `npm install -g @fly/cli`

2. **Login**: `fly auth login`

3. **Initialize** (in `server` directory):
   ```bash
   cd server
   fly launch
   ```

4. **Set environment variables**:
   ```bash
   fly secrets set CLIENT_ORIGIN=https://your-netlify-app.netlify.app
   ```

---

## Step 2: Deploy Frontend to Netlify

### Method 1: Deploy via Netlify Dashboard

1. **Sign up**: Go to [netlify.com](https://netlify.com) and sign up

2. **Create new site**:
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Build settings**:
   - **Base directory**: (leave empty - root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Environment variables**:
   - Go to Site settings → Environment variables
   - Add:
     ```
     VITE_MULTIPLAYER_SERVER_URL=https://your-server.railway.app
     ```
     (Use your actual backend URL from Step 1)

5. **Deploy**: Click "Deploy site"

### Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Build your site**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

5. **Set environment variable**:
   ```bash
   netlify env:set VITE_MULTIPLAYER_SERVER_URL https://your-server.railway.app
   ```

---

## Step 3: Update CORS on Backend

After deploying the frontend, update your backend's `CLIENT_ORIGIN` environment variable:

1. Go to your backend hosting dashboard (Railway/Render/etc.)
2. Update the `CLIENT_ORIGIN` variable to your Netlify URL:
   ```
   CLIENT_ORIGIN=https://your-netlify-app.netlify.app
   ```
3. Redeploy the backend (usually automatic)

**Note**: If you want to allow both local development and production:
```
CLIENT_ORIGIN=http://localhost:5173,https://your-netlify-app.netlify.app
```

---

## Step 4: Test Your Deployment

1. **Test frontend**: Visit your Netlify URL
2. **Test connection**: Open the lobby modal and check if it connects to the server
3. **Test multiplayer**: Open two browser windows/tabs and try joining the same room

---

## Troubleshooting

### Build fails with "Node version incompatible" or "camera-controls" error

**Problem**: Railway is trying to install frontend dependencies that require Node.js 24+.

**Solution**:
1. Make sure Railway's root directory is set to `server` (not the repo root)
2. The `server/nixpacks.toml` file should force Node.js 20
3. If the error persists, in Railway dashboard:
   - Go to your service → Settings → Variables
   - Add: `NIXPACKS_NODE_VERSION=20`
   - Redeploy

**Note**: The `camera-controls` package is only needed for the frontend (Netlify), not the server. Railway should only install server dependencies.

### Frontend can't connect to backend

- **Check environment variable**: Ensure `VITE_MULTIPLAYER_SERVER_URL` is set correctly in Netlify
- **Check CORS**: Verify `CLIENT_ORIGIN` in backend includes your Netlify URL
- **Check backend URL**: Make sure the backend is actually running and accessible
- **Check browser console**: Look for WebSocket connection errors

### CORS errors

- Ensure `CLIENT_ORIGIN` in backend matches your Netlify URL exactly (including `https://`)
- No trailing slashes in URLs
- If using multiple origins, separate with commas (no spaces)

### Socket.IO connection fails

- Verify the backend URL is accessible (try opening it in a browser - should show JSON)
- Check that WebSocket connections are allowed by your hosting provider
- Some free tiers may have WebSocket limitations

---

## Local Development Setup

1. **Backend**:
   ```bash
   cd server
   npm install
   # Create .env file with:
   # CLIENT_ORIGIN=http://localhost:5173
   npm start
   ```

2. **Frontend**:
   ```bash
   # Create .env.local file with:
   # VITE_MULTIPLAYER_SERVER_URL=http://localhost:4000
   npm install
   npm run dev
   ```

---

## Recommended Hosting Services

### Backend (Socket.IO Server)
- **Railway**: Easy setup, free tier, auto-deploy from GitHub
- **Render**: Free tier, simple configuration
- **Fly.io**: Good performance, global distribution
- **Heroku**: Classic option (paid now)

### Frontend (React App)
- **Netlify**: Excellent for static sites, free tier, easy setup
- **Vercel**: Similar to Netlify, great DX
- **Cloudflare Pages**: Fast CDN, free tier

---

## Cost Estimate

- **Netlify**: Free tier is usually sufficient for small games
- **Railway**: $5/month after free credits (or free tier with limitations)
- **Render**: Free tier available (with limitations)
- **Total**: ~$0-5/month for small-scale multiplayer games

---

## Security Notes

1. **Environment Variables**: Never commit `.env` files to Git
2. **CORS**: Restrict `CLIENT_ORIGIN` to your actual frontend URL(s) in production
3. **Rate Limiting**: Consider adding rate limiting to your Socket.IO server for production
4. **HTTPS**: Always use HTTPS in production (both frontend and backend)

---

## Next Steps

- Add authentication if needed
- Implement rate limiting
- Add server-side validation
- Set up monitoring/logging
- Consider adding a database for persistent room data

