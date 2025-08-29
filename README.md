# 🏥 AI Dope Checker

An intelligent medicine analysis application that helps athletes determine if their medications contain substances prohibited by the World Anti-Doping Agency (WADA). Built with Google's Gemini AI for accurate medicine composition analysis.

![AI Dope Checker](https://img.shields.io/badge/AI-Dope%20Checker-blue)
![Status](https://img.shields.io/badge/Status-Ready%20to%20Use-green)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## 🌟 Features

### 🔍 **Intelligent Medicine Analysis**
- **AI-Powered Analysis**: Uses Google Gemini AI to analyze medicine composition
- **WADA Compliance Check**: Comprehensive database of prohibited substances
- **Real-time Results**: Get instant analysis with confidence scoring
- **Smart Matching**: Advanced algorithms to identify substances by various names

### 🏠 **Personal Medicine Cabinet**
- **Track Your Medicines**: Save analyzed medicines for future reference
- **Smart Filtering**: Filter by safety status (Safe/Restricted/Prohibited)
- **Search Functionality**: Quickly find medicines in your cabinet
- **Export Data**: Export your medicine history for records

### 🎨 **Modern User Interface**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Glassmorphism Style**: Beautiful modern interface with smooth animations
- **Intuitive Navigation**: Easy-to-use tabbed interface
- **Visual Status Indicators**: Clear color-coded safety indicators

### ⚡ **Advanced Backend**
- **RESTful API**: Well-structured API with comprehensive endpoints
- **Caching System**: Intelligent caching to reduce API costs and improve speed
- **Rate Limiting**: Built-in protection against abuse
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16.0+) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4+) - [Download](https://www.mongodb.com/try/download/community)
- **Google Gemini API Key** - [Get API Key](https://makersuite.google.com/app/apikey)

### 🎯 One-Click Setup (Windows)
```bash
# Clone or download the project
# Navigate to the project directory
# Run the quick start script
.\start.bat
```

### 📋 Manual Setup

#### 1. Backend Setup
```bash
cd backend
.\setup.bat
# Follow the prompts to configure your environment
```

#### 2. Configure Environment Variables
Edit `backend\.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/ai-dope-checker
PORT=5000
```

#### 3. Start Services
```bash
# Start MongoDB
net start MongoDB

# Start Backend (from backend directory)
npm run dev

# Open Frontend (from frontend directory)
# Double-click index.html or use a local server
```

### 🧪 Test the Setup
1. Backend health check: `http://localhost:5000/health`
2. Frontend application: `http://localhost:3000` or open `index.html`
3. Try analyzing a medicine like "Aspirin" or "Testosterone"

## 📱 How to Use

### Medicine Checker
1. **Enter Medicine Name**: Type the name of any medicine or supplement
2. **Get AI Analysis**: Our AI analyzes the composition against WADA guidelines
3. **View Results**: See safety status, ingredients, and detailed recommendations
4. **Add to Cabinet**: Save medicines you've checked for future reference

### Medicine Cabinet
1. **View Saved Medicines**: See all your previously analyzed medicines
2. **Filter by Status**: Show only safe, restricted, or prohibited medicines
3. **Search**: Quickly find specific medicines in your collection
4. **Export Data**: Download your medicine history as JSON

## 🏗 Architecture

### Frontend (`frontend/`)
- **Pure JavaScript**: No frameworks, fast and lightweight
- **Modern CSS**: Glassmorphism design with CSS Grid and Flexbox
- **Responsive**: Mobile-first design that works on all devices
- **Local Storage**: Cabinet data stored locally for privacy

### Backend (`backend/`)
- **Node.js + Express**: Fast and scalable API server
- **MongoDB**: Document database for flexible data storage
- **Gemini Integration**: Advanced AI for medicine analysis
- **Comprehensive APIs**: RESTful endpoints for all operations

```
AI Dope checker/
├── frontend/              # Frontend application
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Modern CSS styling
│   └── script.js         # JavaScript logic
├── backend/              # Backend API
│   ├── server.js         # Main server file
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── controllers/      # API controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── data/             # Sample data
├── start.bat             # Quick start script
└── SETUP.md              # Detailed setup guide
```

## 🔧 API Documentation

### Medicine Analysis
```http
POST /api/medicines/check
{
  "medicine": "Aspirin",
  "context": {
    "inCompetition": true,
    "sport": "Athletics"
  }
}
```

### WADA Database
```http
GET /api/wada/substances?category=Stimulants&limit=20
GET /api/wada/search?q=testosterone
POST /api/wada/check-ingredients
```

### System
```http
GET /health                    # Health check
GET /api/medicines/analytics   # Usage analytics
```

## 🛡 Security & Privacy

- **Local Data Storage**: Medicine cabinet data stays on your device
- **Secure API Communication**: HTTPS ready for production
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: All inputs are validated and sanitized
- **No Personal Info Required**: No registration or personal data collection

## 🔬 Medicine Categories Covered

Our comprehensive WADA database includes:

### ❌ **Prohibited Substances**
- **Anabolic Agents**: Testosterone, Stanozolol, Nandrolone
- **Peptide Hormones**: EPO, Growth Hormone, Insulin
- **Beta-2 Agonists**: Clenbuterol, Salbutamol (above threshold)
- **Hormone Antagonists**: Aromatase inhibitors, SERMs
- **Diuretics**: Furosemide, Hydrochlorothiazide
- **Stimulants**: Amphetamines, Cocaine, Ephedrine

### ⚠️ **Restricted Substances**
- **Caffeine**: Monitored but not prohibited
- **Pseudoephedrine**: Threshold limits apply
- **Salbutamol**: Permitted with restrictions
- **Glucocorticoids**: Route-specific restrictions

### ✅ **Generally Safe**
- **Common Pain Relievers**: Aspirin, Ibuprofen, Acetaminophen
- **Antibiotics**: Most standard antibiotics
- **Vitamins & Minerals**: Standard supplements
- **Antacids**: Stomach medications

## 🌐 Supported Use Cases

### 🏃‍♂️ **For Athletes**
- Check pre-workout supplements
- Verify prescription medications
- Monitor supplement stacks
- Prepare for drug testing

### 🏥 **For Sports Medicine**
- Patient medication review
- TUE (Therapeutic Use Exemption) planning
- Educational purposes
- Compliance monitoring

### 🏫 **For Coaches & Teams**
- Team supplement verification
- Educational workshops
- Policy development
- Risk assessment

## 🚨 Important Disclaimers

⚠️ **Medical Disclaimer**: This tool is for educational purposes only and should not replace professional medical advice. Always consult with healthcare providers and sports medicine specialists.

⚠️ **WADA Compliance**: While our database is comprehensive, WADA guidelines can change. Always verify with official WADA sources for competition use.

⚠️ **AI Limitations**: AI analysis may not be 100% accurate. Use results as guidance, not absolute truth.

## 🔄 Updates & Maintenance

### WADA Database Updates
```bash
# Update WADA substances (admin access required)
cd backend
npm run update-wada-db
```

### Regular Maintenance
- Monthly WADA list updates
- Quarterly dependency updates
- Regular security patches
- Performance optimizations

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Found a bug or have a suggestion?
2. **Improve Documentation**: Help make setup easier
3. **Add Features**: Enhance the user experience
4. **Update WADA Data**: Help keep the database current

## 📊 Development Stats

- **Frontend**: ~650 lines of modern JavaScript
- **Backend**: ~2000+ lines of Node.js
- **API Endpoints**: 15+ RESTful endpoints
- **Database Models**: 5 comprehensive schemas
- **WADA Substances**: 500+ substances in database
- **Test Coverage**: Comprehensive test suite

## 🆘 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# Check environment
cat backend/.env

# Check logs
tail -f backend/logs/error.log
```

#### Frontend can't connect
- Ensure backend is running on port 5000
- Check browser console for errors
- Verify CORS configuration

#### Gemini API errors
- Verify API key is correct
- Check API quotas and billing
- Ensure internet connection

### Getting Help
1. Check the [SETUP.md](SETUP.md) guide
2. Review the backend logs
3. Test individual components
4. Create an issue with details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WADA** for providing comprehensive prohibited substances guidelines
- **Google Gemini** for advanced AI capabilities
- **MongoDB** for flexible data storage
- **Node.js Community** for excellent tooling
- **Athletes and Sports Medicine Professionals** for feedback and testing

---

## 🎯 Ready to Start?

```bash
# Quick start (Windows)
.\start.bat

# Manual setup
cd backend && .\setup.bat
```

**Stay clean, stay competitive! 🏆**

---

*For detailed setup instructions, see [SETUP.md](SETUP.md)*  
*For API documentation, see [backend/README.md](backend/README.md)*
