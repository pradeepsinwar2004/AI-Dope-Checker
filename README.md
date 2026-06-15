````md
# 🏥 AI Dope Checker  
### AI-Powered WADA Compliance & Medicine Analysis Platform for Athletes

An intelligent full-stack medicine analysis platform that helps athletes, coaches, and sports professionals determine whether a medicine or supplement contains substances prohibited by the **World Anti-Doping Agency (WADA)**.

The platform combines:
- ⚡ **Google Gemini AI**
- 🧠 Intelligent ingredient parsing
- 📚 WADA prohibited substance validation
- 🔐 Secure backend APIs
- 📊 Medicine history management
- 🎨 Modern responsive UI

to provide instant and understandable anti-doping analysis.

---

# 📌 Problem Statement

Athletes often consume medicines or supplements without knowing whether they contain banned substances.

Many medicines:
- Have complex ingredient names
- Use alternative chemical aliases
- Include hidden stimulants or hormone-based compounds
- Differ across countries and brands

Even accidental consumption of a prohibited substance can lead to:
- Competition bans
- Career suspension
- Disqualification
- Legal and professional consequences

The goal of this project is to create an intelligent assistant that:
1. Understands medicine composition
2. Detects banned substances
3. Explains risks clearly
4. Helps athletes make informed decisions

---

# 🚀 Key Features

## 🔍 AI-Powered Medicine Analysis

The system uses **Google Gemini AI** to:
- Analyze medicine names
- Identify active ingredients
- Parse compositions intelligently
- Match ingredients against WADA rules
- Generate human-readable explanations

### Example
Input:
```txt
Paracetamol + Pseudoephedrine
````

Output:

```txt
⚠ Restricted Substance Detected

Pseudoephedrine exceeds WADA threshold limits during competition.
```

---

## 📚 WADA Compliance Engine

The application includes a structured WADA substance verification system with:

* Prohibited substances
* Restricted substances
* Threshold-based compounds
* Competition-only restrictions
* Category-wise classification

### Categories Covered

* Anabolic Agents
* Stimulants
* Beta-2 Agonists
* Hormone Modulators
* Diuretics
* Peptide Hormones
* Narcotics
* Glucocorticoids

---

## 🏠 Personal Medicine Cabinet

Users can:

* Save checked medicines
* Track medicine history
* Filter by risk level
* Search previously analyzed medicines
* Export data

### Status Indicators

| Status       | Meaning                           |
| ------------ | --------------------------------- |
| ✅ Safe       | No prohibited substances detected |
| ⚠ Restricted | Allowed under limitations         |
| ❌ Prohibited | Contains banned substances        |

---

## ⚡ Intelligent Backend System

The backend was designed with scalability and maintainability in mind.

### Core Features

* RESTful API architecture
* JWT Authentication
* Role-based authorization
* Request validation
* Error handling middleware
* Logging system
* Rate limiting
* API caching
* MongoDB indexing

---

## 🎨 Modern Frontend Experience

The frontend uses:

* Vanilla JavaScript
* Modern CSS
* Glassmorphism UI
* Responsive layouts
* Smooth animations
* Dynamic rendering

### UI Highlights

* Mobile-first design
* Real-time loading states
* Animated cards
* Interactive medicine reports
* Status color indicators

---

# 🧠 How the AI Analysis Works

## Step 1 — User Input

The user enters:

* Medicine name
* Supplement
* Composition
* Optional sports context

Example:

```txt
Testosterone Injection
```

---

## Step 2 — Gemini AI Processing

Google Gemini AI:

* Identifies active compounds
* Extracts medical meaning
* Standardizes ingredient names
* Detects aliases/synonyms

---

## Step 3 — WADA Verification

The backend:

* Compares compounds with WADA datasets
* Applies threshold rules
* Checks competition restrictions
* Evaluates risk category

---

## Step 4 — Final Analysis Report

The user receives:

* Safety status
* Detected substances
* Risk explanation
* Recommendations
* Confidence score

---

# 🏗 System Architecture

```txt
┌──────────────────┐
│    Frontend      │
│ HTML/CSS/JS UI   │
└────────┬─────────┘
         │ API Calls
         ▼
┌──────────────────┐
│ Express Backend  │
│ REST API Server  │
└────────┬─────────┘
         │
 ┌───────┴────────┐
 ▼                ▼
Gemini AI      MongoDB
Analysis       Database
```

---

# 🛠 Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Glassmorphism UI

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

## APIs & Tools

* Google Gemini API
* JWT Authentication
* Cloudinary
* Postman
* Git & GitHub

---

# 📂 Project Structure

```txt
AI-Dope-Checker/
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── routes/
│   ├── models/
│   ├── utils/
│   └── data/
│
├── start.bat
├── SETUP.md
└── README.md
```

---

# 🔐 Security Features

## Authentication

* JWT-based authentication
* Secure token validation
* Role-based access

## API Protection

* Rate limiting
* Input sanitization
* Request validation
* Secure middleware

## Data Privacy

* Local medicine cabinet storage
* No sensitive athlete data stored
* Environment variable protection

---

# 📡 API Endpoints

## Medicine Analysis

```http
POST /api/medicines/check
```

### Request

```json
{
  "medicine": "Aspirin",
  "context": {
    "sport": "Athletics",
    "inCompetition": true
  }
}
```

---

## WADA Search

```http
GET /api/wada/search?q=testosterone
```

---

## Health Check

```http
GET /health
```

---

# ⚙ Installation

## 1. Clone Repository

```bash
git clone <repo-url>
cd AI-Dope-Checker
```

---

## 2. Install Dependencies

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-dope-checker
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_secret
```

---

## 4. Start Backend

```bash
npm run dev
```

---

## 5. Run Frontend

Open:

```txt
frontend/index.html
```

---

# 🧪 Example Analysis Results

## Example 1 — Safe Medicine

```txt
Medicine: Aspirin
Status: ✅ Safe
Reason: No prohibited compounds detected
```

---

## Example 2 — Restricted Medicine

```txt
Medicine: Pseudoephedrine
Status: ⚠ Restricted
Reason: Allowed only below WADA threshold
```

---

## Example 3 — Prohibited Substance

```txt
Medicine: Testosterone
Status: ❌ Prohibited
Reason: Classified as anabolic agent
```

---

# 📈 Future Improvements

## Planned Features

* OCR medicine scanning
* Barcode scanner
* Mobile application
* Athlete profiles
* Competition mode
* Multi-language support
* AI explanation improvements
* Doctor dashboard
* PDF report generation

---

# 💡 Engineering Highlights

This project demonstrates:

* Full-stack development
* REST API architecture
* AI integration
* Backend scalability
* Authentication systems
* Database design
* Clean UI/UX
* Production-level project organization

---

# 🏆 Use Cases

## Athletes

* Check supplements before competitions
* Verify prescriptions
* Avoid accidental doping

## Coaches

* Team medicine verification
* Risk assessment

## Sports Doctors

* TUE preparation
* Medication review

## Sports Organizations

* Educational tool
* Awareness platform

---

# ⚠ Important Disclaimer

This project is intended for educational and assistance purposes only.

Always:

* Consult sports medicine professionals
* Verify with official WADA sources
* Follow medical guidance

The AI output should not be considered official medical or legal advice.

---

# 🤝 Contributing

Contributions are welcome.

You can contribute by:

* Improving UI/UX
* Enhancing AI prompts
* Expanding WADA datasets
* Optimizing backend performance
* Writing tests
* Improving documentation

---

# 📜 License

Licensed under the MIT License.

---

# 👨‍💻 Author

## Pradeep Kumar Sinwar

Backend Developer | Competitive Programmer

* Node.js
* Express.js
* MongoDB
* REST APIs
* C++
* Problem Solving

---

# ⭐ If You Like This Project

Give this repository a ⭐ and share it with others.

---

# 🏁 Final Goal

Helping athletes compete cleanly and confidently using AI-powered medicine verification.

```
```
