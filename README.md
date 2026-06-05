<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> a4cea9b (real code)
# Skill Bridge - Home Services Platform

A full-stack web application connecting employers with skilled workers for home services and construction projects.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Port Configuration](#port-configuration)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)
- [Development Guidelines](#development-guidelines)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code or Cursor recommended)

### Verify Installation

```bash
node --version    # Should show v16.x or higher
npm --version     # Should show 8.x or higher
mongod --version  # Should show MongoDB version
```

## Project Structure

```
Final/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database and token configuration
│   ├── controller/      # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── index.js         # Server entry point
│   ├── package.json     # Backend dependencies
│   └── .env            # Environment variables (create from .env.example)
│
└── Frontend/            # Frontend HTML/JS files
    ├── js/             # JavaScript files
    ├── css/            # Stylesheets
    └── *.html          # HTML pages
```

## Setup Instructions

### Step 1: Clone the Repository

```bash
cd /path/to/your/projects
git clone <repository-url>
cd hnm/Final
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Or on Windows:
   copy .env.example .env
   ```

4. **Configure environment variables:**
   Open `.env` and update the following:
   ```env
   PORT=3000
   MONGODB_URL=mongodb://localhost:27017/skilllink
   JWT_SECRET=your-super-secret-jwt-key-change-this
   ```

### Step 3: Database Setup

1. **Start MongoDB:**
   ```bash
   # On Windows (if installed as service, it should auto-start)
   # Or manually:
   mongod
   
   # On macOS/Linux:
   sudo systemctl start mongod
   # Or:
   mongod
   ```

2. **Verify MongoDB is running:**
   ```bash
   mongosh
   # Or:
   mongo
   ```

3. **Create database (optional - will be created automatically):**
   ```javascript
   use skilllink
   ```

### Step 4: Frontend Setup

The frontend is static HTML/JS files. You can:

1. **Use a local server (recommended):**
   - VS Code: Install "Live Server" extension
   - Cursor: Install "Live Server" extension
   - Or use Python: `python -m http.server 5500`
   - Or use Node.js: `npx http-server -p 5500`

2. **Or open directly in browser:**
   - Note: Some features may not work due to CORS

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the `backend/` directory with these variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URL=mongodb://localhost:27017/skilllink

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration (optional)
CORS_ORIGINS=http://localhost:5500,http://localhost:5501

# Socket.IO Configuration (optional)
SOCKET_IO_ORIGINS=http://localhost:5500,http://localhost:5501
```

### Generating a Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### MongoDB Connection String Formats

**Local MongoDB (default):**
```
mongodb://localhost:27017/skilllink
```

**With Authentication:**
```
mongodb://username:password@localhost:27017/skilllink?authSource=admin
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/skilllink?retryWrites=true&w=majority
```

## Running the Application

### Backend Server

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify it's running:**
   - Check console for: `🚀 Skill Bridge Backend Server`
   - Visit: http://localhost:3000/api/health
   - Should see: `{"status":"ok","message":"Backend server is running"}`

### Frontend

1. **Start a local server:**
   - **VS Code/Cursor:** Right-click `index.html` → "Open with Live Server"
   - **Command Line:**
     ```bash
     cd Frontend
     python -m http.server 5500
     # Or:
     npx http-server -p 5500
     ```

2. **Open in browser:**
   - Navigate to: http://localhost:5500

## Port Configuration

### Default Ports

- **Backend API:** `3000`
- **Frontend Server:** `5500` (or `5501`)

### Changing Ports

**Backend:**
1. Update `.env` file:
   ```env
   PORT=3001
   ```
2. Update frontend API URLs in `Frontend/js/*.js`:
   ```javascript
   const API_BASE = "http://localhost:3001/api";
   ```

**Frontend:**
- Change port in Live Server settings
- Or use different port: `python -m http.server 5501`

### Port Alignment Checklist

✅ Backend `.env` has `PORT=3000`  
✅ Frontend JS files use `http://localhost:3000/api`  
✅ CORS origins include frontend port  
✅ Socket.IO origins include frontend port  

## Database Setup

### Local MongoDB Installation

**Windows:**
1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run installer
3. MongoDB should start as a service automatically

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Verify Database Connection

The backend will automatically connect when started. Check console for:
- ✅ `MongoDB Connected Successfully`
- ❌ `Database Connection Error` (if failed)

## Troubleshooting

### Backend Won't Start

**Error: Missing environment variables**
```
❌ Missing required environment variables:
   - MONGODB_URL
   - JWT_SECRET
```
**Solution:** Create `.env` file from `.env.example` and fill in values.

**Error: Port already in use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** 
- Change `PORT` in `.env` to a different port
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:3000 | xargs kill
  ```

**Error: Database connection failed**
```
❌ Database Connection Error
```
**Solution:**
1. Verify MongoDB is running: `mongosh` or `mongo`
2. Check `MONGODB_URL` in `.env` is correct
3. Verify MongoDB is accessible: `mongosh "mongodb://localhost:27017"`

### Frontend Can't Connect to Backend

**Error: CORS error**
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5500' has been blocked by CORS policy
```
**Solution:**
1. Add frontend URL to `CORS_ORIGINS` in `.env`
2. Restart backend server

**Error: Network error**
```
Network error: Failed to fetch
```
**Solution:**
1. Verify backend is running: http://localhost:3000/api/health
2. Check API URL in frontend JS files matches backend port
3. Check browser console for specific error

### Signup/Login Issues

**Check server logs for detailed error messages:**
- Look for `📝 SIGNUP REQUEST` or `🔐 LOGIN REQUEST` in console
- Error details will show what went wrong

**Common issues:**
- Missing required fields
- User already exists
- Invalid credentials
- Database connection issues

## Development Guidelines

### Code Editor Setup

**VS Code / Cursor:**
1. Install recommended extensions:
   - ESLint
   - Prettier
   - Live Server
   - MongoDB for VS Code

2. Create `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

### Environment Variables Best Practices

1. **Never commit `.env` to Git:**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use different `.env` for production:**
   - Create `.env.production`
   - Use stronger `JWT_SECRET`
   - Use production MongoDB URL

3. **Validate environment on startup:**
   - Backend validates required variables
   - Will exit with clear error if missing

### Error Logging

The application includes enhanced error logging:

- **Signup/Login:** Detailed logs with timestamps
- **Database:** Connection status and errors
- **Server:** Startup information and health checks

Check console output for:
- `✅` Success messages
- `❌` Error messages
- `⚠️` Warning messages

### Testing the Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Test Signup:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","userName":"testuser","role":"employer","city":"Mumbai"}'
   ```

3. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","role":"employer"}'
   ```

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review server console logs
3. Verify all environment variables are set
4. Ensure MongoDB is running
5. Check port conflicts

---

**Last Updated:** 2024  
**Version:** 1.0.0



<<<<<<< HEAD
=======
# skillBridge
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
>>>>>>> b5317d28b9ade91a8436bdcb1759b43388bd8aa7
=======
>>>>>>> a4cea9b (real code)

