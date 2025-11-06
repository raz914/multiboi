# Quick Deployment Guide

## 🚀 Quick Start

### 1. Deploy Backend (Railway - Recommended)

```bash
# 1. Go to railway.app and sign up
# 2. New Project → Deploy from GitHub
# 3. Select your repo, set root directory to "server"
# 4. Add environment variable:
#    CLIENT_ORIGIN=https://your-netlify-app.netlify.app
# 5. Copy your Railway URL (e.g., https://your-app.railway.app)
```

### 2. Deploy Frontend (Netlify)

```bash
# 1. Go to netlify.com and sign up
# 2. New site → Import from GitHub
# 3. Build settings:
#    - Build command: npm run build
#    - Publish directory: dist
# 4. Add environment variable:
#    VITE_MULTIPLAYER_SERVER_URL=https://your-app.railway.app
# 5. Deploy!
```

### 3. Update Backend CORS

After Netlify deployment, update Railway's `CLIENT_ORIGIN` to your Netlify URL.

---

## 📋 Environment Variables Checklist

### Frontend (Netlify)
- ✅ `VITE_MULTIPLAYER_SERVER_URL` = Your Railway/Render backend URL
- ✅ Node.js version: 24 (automatically detected from `.nvmrc`)

### Backend (Railway/Render)
- ✅ `CLIENT_ORIGIN` = Your Netlify frontend URL
- ✅ `PORT` = Auto-set by hosting platform

---

## 🔗 Connection Flow

```
User Browser
    ↓
Netlify (Frontend)
    ↓ (WebSocket connection)
Railway/Render (Backend)
```

The frontend connects to the backend using the `VITE_MULTIPLAYER_SERVER_URL` environment variable.

---

## ✅ Testing

1. Visit your Netlify URL
2. Open lobby modal
3. Check browser console for connection status
4. Create/join a room to test multiplayer

---

## 🐛 Common Issues

**"Connection failed"**
- Check `VITE_MULTIPLAYER_SERVER_URL` is set correctly in Netlify
- Verify backend is running (visit Railway URL in browser)

**"CORS error"**
- Ensure `CLIENT_ORIGIN` in backend matches your Netlify URL exactly
- Include `https://` in the URL

**"Socket.IO connection error"**
- Check that WebSocket connections are enabled on your hosting provider
- Verify the backend URL is accessible

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

