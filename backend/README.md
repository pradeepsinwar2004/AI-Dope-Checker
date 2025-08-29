# AI Dope Checker Backend

A comprehensive backend API for checking medicines against WADA (World Anti-Doping Agency) prohibited substances using Google's Gemini AI for medicine composition analysis.

## 🚀 Features

- **Medicine Analysis**: Analyze medicine composition using Gemini AI
- **WADA Compliance**: Check ingredients against comprehensive WADA database
- **Intelligent Matching**: Smart substance matching with confidence scoring
- **Caching System**: Efficient caching to reduce API calls and improve performance
- **RESTful API**: Well-structured REST endpoints with proper validation
- **Comprehensive Database**: Extensive WADA substances database with categories, thresholds, and TUE information
- **Real-time Analytics**: Track usage patterns and analysis statistics
- **Rate Limiting**: Built-in protection against abuse
- **Detailed Logging**: Comprehensive logging for monitoring and debugging

## 🛠 Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Service**: Google Gemini AI
- **Validation**: Express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate limiting

## 📦 Installation

### Prerequisites

- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- Google Gemini API key

### Setup Steps

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-dope-checker
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed WADA Database**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔑 API Endpoints

### Medicine Analysis

#### Check Medicine
```http
POST /api/medicines/check
Content-Type: application/json

{
  "medicine": "Aspirin",
  "context": {
    "inCompetition": true,
    "sport": "Athletics"
  },
  "options": {
    "useCache": true,
    "forceRecheck": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "medicine": "Aspirin",
    "status": "Safe",
    "riskLevel": "Low",
    "title": "WADA Compliant",
    "description": "This medicine is safe for athletes and contains no WADA prohibited substances.",
    "details": "Aspirin has been analyzed against the current WADA prohibited list...",
    "ingredients": [
      {
        "name": "Acetylsalicylic acid",
        "status": "safe",
        "description": "Not on WADA prohibited list"
      }
    ],
    "warnings": [],
    "recommendations": ["This medicine appears safe for athletes"],
    "analysisDate": "2025-08-24T10:30:00.000Z",
    "confidence": 95
  },
  "cached": false,
  "analysisId": "507f1f77bcf86cd799439011"
}
```

#### Get Analysis by ID
```http
GET /api/medicines/analysis/:id
```

#### Search Analyses
```http
GET /api/medicines/search?query=aspirin&status=Safe&limit=20&skip=0
```

#### Popular Medicines
```http
GET /api/medicines/popular?limit=10
```

#### Batch Check
```http
POST /api/medicines/batch-check

{
  "medicines": ["Aspirin", "Ibuprofen", "Testosterone"],
  "context": {
    "inCompetition": true
  }
}
```

### WADA Database

#### Get Substances
```http
GET /api/wada/substances?category=Stimulants&status=Prohibited&limit=50
```

#### Search Substances
```http
GET /api/wada/search?q=testosterone&category=Anabolic Agents
```

#### Get Categories
```http
GET /api/wada/categories
```

#### Get Statistics
```http
GET /api/wada/stats
```

#### Find by Name
```http
GET /api/wada/substance-by-name/testosterone
```

#### Check Ingredients
```http
POST /api/wada/check-ingredients

{
  "ingredients": ["caffeine", "pseudoephedrine", "acetylsalicylic acid"]
}
```

### System

#### Health Check
```http
GET /health
```

#### Analytics
```http
GET /api/medicines/analytics?days=30
```

## 📊 Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "data": object | array,
  "error": string (optional),
  "message": string (optional),
  "pagination": object (for paginated results),
  "timestamp": string (ISO date)
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "medicine",
      "message": "Medicine name is required",
      "value": ""
    }
  ],
  "timestamp": "2025-08-24T10:30:00.000Z"
}
```

## 🗃 Database Schema

### WadaSubstance Model
```javascript
{
  name: String,                    // Primary name
  category: String,                // WADA category
  alternativeNames: [String],      // Synonyms and alternative names
  prohibitionStatus: String,       // Prohibited, Restricted, Monitored
  prohibitionScope: {
    inCompetition: Boolean,
    outOfCompetition: Boolean,
    particularSports: [String]
  },
  thresholdLimits: {
    hasThreshold: Boolean,
    urineThreshold: Object,
    bloodThreshold: Object
  },
  therapeuticUseExemption: {
    available: Boolean,
    conditions: [String],
    requirements: [String]
  }
}
```

### MedicineAnalysis Model
```javascript
{
  medicineName: String,
  geminiAnalysis: {
    activeIngredients: [Object],
    medicalUses: [String],
    confidence: Number
  },
  wadaAnalysis: {
    overallStatus: String,        // Safe, Restricted, Prohibited
    riskLevel: String,           // Low, Medium, High
    foundSubstances: [Object],
    recommendations: [String]
  },
  cacheInfo: {
    cacheExpiry: Date,
    accessCount: Number
  }
}
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js security headers
- **CORS Protection**: Configurable CORS policies
- **Error Handling**: Secure error responses
- **Logging**: Security event logging

## 📈 Performance Features

- **Caching**: Intelligent caching with TTL
- **Database Indexing**: Optimized database queries
- **Pagination**: Efficient data retrieval
- **Compression**: Response compression
- **Connection Pooling**: MongoDB connection optimization

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "medicine analysis"
```

## 📝 Logging

Logs are stored in the `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only
- `application.log` - Application-specific logs
- `exceptions.log` - Unhandled exceptions

Log levels: `error`, `warn`, `info`, `debug`

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "ai-dope-checker"
pm2 startup
pm2 save
```

### Using Docker
```bash
# Build image
docker build -t ai-dope-checker .

# Run container
docker run -d -p 5000:5000 --name ai-dope-checker-api ai-dope-checker
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db:27017/ai-dope-checker
GEMINI_API_KEY=your_production_gemini_key
JWT_SECRET=your_super_secure_production_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=warn
```

## 📊 Monitoring

### Health Endpoint
```http
GET /health
```

Returns server status, uptime, and environment info.

### Analytics Endpoint
```http
GET /api/medicines/analytics
```

Returns usage statistics and trends.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 API Documentation

Detailed API documentation is available at:
- Development: `http://localhost:5000/api/docs`
- Production: `https://your-domain.com/api/docs`

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   ```

2. **Gemini API Error**
   - Verify your API key is correct
   - Check your API quota and billing
   - Ensure the API key has proper permissions

3. **Rate Limiting**
   - Check the `X-RateLimit-*` headers in responses
   - Implement proper retry logic with exponential backoff

4. **Memory Issues**
   - Monitor memory usage with `process.memoryUsage()`
   - Consider implementing pagination for large datasets
   - Use streaming for large file operations

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 🔄 Updates and Maintenance

### Updating WADA Database
```bash
# Re-run seeding script with new data
npm run seed

# Or update specific substances via API (admin required)
PUT /api/wada/substances/:id
```

### Database Backup
```bash
# MongoDB backup
mongodump --db ai-dope-checker --out backup/

# Restore
mongorestore --db ai-dope-checker backup/ai-dope-checker/
```

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review the logs for error details

## 📜 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Note**: This backend requires a valid Google Gemini API key to function. The WADA substances database is included for educational and development purposes. Always consult official WADA resources for final anti-doping decisions.
