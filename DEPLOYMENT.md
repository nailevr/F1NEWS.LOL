# 🚀 F1 News App Deployment Guide

## Domain: f1news.lol

### Option 1: Railway (Recommended - $5/month)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your F1 NEWS repository
   - Railway will auto-detect it's a Node.js app

3. **Set Environment Variables**
   - Go to your project settings
   - Add environment variable: `OPENAI_API_KEY`
   - Value: `your-openai-api-key-here`

4. **Configure Custom Domain**
   - Go to Settings → Domains
   - Add custom domain: `f1news.lol`
   - Railway will provide DNS records to add to Porkbun

### Option 2: Render (Free tier available)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect GitHub repo
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**
   - Add `OPENAI_API_KEY` in environment section

### Option 3: Vercel (Free tier)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: `npm run build` (you'll need to add this)
   - Output Directory: `dist`

## DNS Configuration (Porkbun)

After deploying, you'll get DNS records from your hosting provider:

### For Railway:
- Type: CNAME
- Name: @
- Value: [provided by Railway]
- TTL: 3600

### For Render:
- Type: CNAME  
- Name: @
- Value: [your-app-name].onrender.com
- TTL: 3600

## Environment Variables Needed:
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Will be set automatically by hosting platform

## Cost Comparison:
- **Railway**: $5/month (always on, reliable)
- **Render**: Free tier (sleeps) or $7/month (always on)
- **Vercel**: Free tier (limited functions)

## Recommended: Railway
- Most reliable for Node.js apps
- Automatic HTTPS
- Easy custom domain setup
- GitHub integration
- Good performance
