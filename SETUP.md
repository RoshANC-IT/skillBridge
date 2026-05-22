# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGODB_URL and JWT_SECRET
npm run dev
```

### 2. Frontend Setup

- Open `Frontend/index.html` in VS Code/Cursor
- Right-click → "Open with Live Server"
- Or use: `python -m http.server 5500`

### 3. Verify

- Backend: http://localhost:3000/api/health
- Frontend: http://localhost:5500

## ⚙️ Port Configuration

**Default Setup:**
- Backend: `3000`
- Frontend: `5500`

**To Change:**
1. Update `PORT` in `backend/.env`
2. Update API URLs in `Frontend/js/*.js` files
3. Update `CORS_ORIGINS` in `backend/.env`

## 🔑 Required Environment Variables

```env
PORT=3000
MONGODB_URL=mongodb://localhost:27017/skilllink
JWT_SECRET=your-secret-key-here
```

## 📝 Common Issues

**Backend won't start:**
- Check `.env` file exists and has all required variables
- Verify MongoDB is running: `mongosh`

**Frontend can't connect:**
- Verify backend is running on port 3000
- Check CORS settings in backend `.env`
- Check browser console for errors

**Database connection fails:**
- Verify MongoDB is running
- Check `MONGODB_URL` format in `.env`
- Try: `mongosh "mongodb://localhost:27017"`

For detailed instructions, see [README.md](./README.md)




