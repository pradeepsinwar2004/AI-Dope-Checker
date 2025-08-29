# AI Dope Checker - Complete Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up the complete AI Dope Checker application with both frontend and backend.

### Prerequisites

1. **Node.js** (v16.0 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
3. **Google Gemini API Key** - [Get here](https://makersuite.google.com/app/apikey)

### 📁 Project Structure

```
AI Dope checker/
├── frontend/           # React/HTML frontend
│   ├── index.html     # Main application page
│   ├── styles.css     # Modern responsive styling
│   └── script.js      # Frontend logic and API integration
└── backend/           # Node.js Express API
    ├── server.js      # Main server file
    ├── models/        # MongoDB models
    ├── services/      # Business logic
    ├── controllers/   # API controllers
    ├── routes/        # API routes
    ├── middleware/    # Custom middleware
    ├── utils/         # Utility functions
    ├── data/          # WADA substances data
    └── logs/          # Application logs
```

## 🛠 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd "backend"
```

### Step 2: Run Automated Setup (Windows)
```bash
.\setup.bat
```

**Or manually:**

```bash
# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env file with your configuration
notepad .env
```

### Step 3: Configure Environment Variables

Edit the `.env` file and update these values:

```env
# Required: Add your Gemini API key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: Update MongoDB URI if needed
MONGODB_URI=mongodb://localhost:27017/ai-dope-checker

# Optional: Update port if 5000 is in use
PORT=5000
```

### Step 4: Start MongoDB

**Windows (if installed as service):**
```bash
net start MongoDB
```

**Manual start:**
```bash
mongod --dbpath "C:\data\db"
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: Seed the Database
```bash
npm run seed
```

### Step 6: Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The backend will be available at: `http://localhost:5000`

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd "../frontend"
```

### Step 2: Update API Configuration

The frontend is already configured to work with the backend. If your backend is running on a different port, update the `API_BASE_URL` in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000'; // Update if needed
```

### Step 3: Open the Application

Simply open `index.html` in your web browser:

**Option 1: Double-click the file**
- Navigate to the frontend folder
- Double-click `index.html`

**Option 2: Use a local server (recommended)**
```bash
# Using Python (if installed)
python -m http.server 3000

# Using Node.js live-server (install first: npm install -g live-server)
live-server --port=3000

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

The frontend will be available at: `http://localhost:3000`

## 🧪 Testing the Setup

### 1. Backend Health Check
Open your browser and go to: `http://localhost:5000/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-08-24T10:30:00.000Z",
  "uptime": "0:01:23",
  "environment": "development",
  "database": "Connected"
}
```

### 2. Test Medicine Analysis
**Using the Frontend:**
1. Open the application in your browser
2. Enter a medicine name (e.g., "Aspirin")
3. Click "Check Medicine"
4. You should see the analysis results

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/medicines/check \
  -H "Content-Type: application/json" \
  -d "{\"medicine\":\"Aspirin\"}"
```

### 3. Check WADA Database
Go to: `http://localhost:5000/api/wada/substances?limit=5`

You should see a list of WADA substances.

## 🔧 Common Issues and Solutions

### Backend Issues

**1. MongoDB Connection Error**
```
Error: Failed to connect to MongoDB
```
**Solution:**
- Ensure MongoDB is running
- Check the MONGODB_URI in your .env file
- Try connecting manually: `mongosh mongodb://localhost:27017`

**2. Gemini API Error**
```
Error: Invalid API key
```
**Solution:**
- Verify your API key is correct in the .env file
- Check your Google Cloud Console for API quotas
- Ensure the Gemini API is enabled

**3. Port Already in Use**
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Change the PORT in your .env file to another port (e.g., 5001)
- Or kill the process using port 5000

### Frontend Issues

**1. CORS Error**
```
Access to fetch at 'http://localhost:5000' from origin 'file://' has been blocked by CORS policy
```
**Solution:**
- Use a local server instead of opening the HTML file directly
- The backend already includes CORS middleware for development

**2. API Not Responding**
**Solution:**
- Ensure the backend server is running
- Check the console for error messages
- Verify the API_BASE_URL in script.js

## 📊 Using the Application

### Medicine Checker Tab
1. Enter the name of a medicine
2. Optionally specify if you're in competition
3. Click "Check Medicine"
4. View the analysis results:
   - ✅ Safe: No prohibited substances found
   - ⚠️ Restricted: Contains substances with limitations
   - ❌ Prohibited: Contains banned substances

### Medicine Cabinet Tab
1. Add medicines you've checked to your personal cabinet
2. Filter by safety status
3. View statistics about your medicines
4. Remove medicines when no longer needed

## 🔐 Security Notes

- The JWT_SECRET in .env should be changed for production
- Never commit your .env file to version control
- Use environment-specific configurations for production
- Consider rate limiting for production use

## 📈 Advanced Configuration

### Custom WADA Database
To add your own substances to the database:

1. Edit `backend/data/wadaSubstances.js`
2. Add new substance objects following the existing format
3. Run `npm run seed` to update the database

### API Rate Limiting
Update these values in .env:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

### Logging Configuration
```env
LOG_LEVEL=info  # error, warn, info, debug
```

## 🚀 Production Deployment

### Backend Deployment
1. Set NODE_ENV=production in .env
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "ai-dope-checker"
   ```

### Frontend Deployment
1. Upload frontend files to your web server
2. Update API_BASE_URL to your production backend URL
3. Configure your web server to serve the static files

## 🆘 Getting Help

If you encounter issues:

1. Check the backend logs in the `logs/` directory
2. Review the browser console for frontend errors
3. Ensure all prerequisites are installed
4. Verify your environment configuration
5. Test each component separately

## 📞 Support

For additional support:
- Check the backend README.md for detailed API documentation
- Review the code comments for implementation details
- Create an issue if you find bugs or need features

---

**Happy Testing! 🎉**

Your AI Dope Checker is now ready to help athletes make informed decisions about their medications.
