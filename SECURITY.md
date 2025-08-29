# 🔐 Security Setup Guide

## 🚨 IMPORTANT: Environment Variables Security

**NEVER commit your `.env` file to GitHub!** This file contains sensitive credentials.

### 📋 Required Environment Variables

1. **Copy the example file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Fill in your actual credentials:**

   ```bash
   # Database Configuration
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ai-dope-checker
   
   # Gemini API Configuration
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
   ```

### 🔑 Where to Get Your Credentials

1. **MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a cluster and get your connection string
   - Replace username, password, and cluster details

2. **Google Gemini API:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Copy the key to your `.env` file

3. **JWT Secret:**
   - Generate a secure random string (minimum 32 characters)
   - You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### ✅ Security Checklist

- [ ] `.env` file is not committed to git
- [ ] `.env.example` contains only placeholder values
- [ ] MongoDB credentials are not exposed
- [ ] Gemini API key is secured
- [ ] JWT secret is randomly generated
- [ ] Log files are excluded from git

### 🚫 Files Never to Commit

- `.env` - Contains real credentials
- `logs/` - May contain sensitive information
- `node_modules/` - Large dependency files
- Test files with real data

### 🔄 For Contributors

1. Copy `.env.example` to `.env`
2. Fill in your own credentials (never share them)
3. Never commit the `.env` file
4. Use placeholder data for testing
