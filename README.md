# Talk2DB: Intelligent Database Assistant

Talk2DB is a cutting-edge, AI-powered platform designed to bridge the gap between human language and complex data structures. Whether you're a data analyst or a business stakeholder, Talk2DB empowers you to talk directly to your data, generate strategic insights, and visualize trends—all through a sleek, professional interface.

---

## 🏗️ System Architecture

Talk2DB uses a modular architecture combining a robust Python backend with a dynamic React frontend, orchestrated by Google's Gemini AI.

![System Architecture](file:///placeholder_architecture.png)
*Placeholder: High-level diagram showing Frontend, Backend (Flask), Database (MySQL), and AI (Gemini) interaction.*

---

## ✨ Key Features

### 💬 Intelligent Natural Language Querying
- Transform natural language questions into accurate SQL queries.
- Support for complex joins, aggregations, and filtering.
- Multi-language support for global accessibility.

![Chat Interface](file:///placeholder_chat.png)
*Placeholder: Screenshot of the chat interface showing a natural language query and the resulting data table.*

### 📊 Advanced Data Analytics
- **Deep Statistical Analysis**: Automatic calculation of 5-number summaries (Min, Q1, Median, Q3, Max).
- **Outlier Detection**: Automated identification of data anomalies using IQR methods.
- **Categorical Distributions**: Instant visualization of top value frequencies.

![Analytics & Detailed Stats](file:///placeholder_analytics.png)
*Placeholder: Screenshot of the Analytics overlay showing 5-number summaries and categorical distribution bars.*

### 🧠 Strategic AI Insights
- **Heuristic Analysis**: Gemini AI analyzes statistical summaries to identify meaningful patterns and strategic opportunities.
- **Anomaly Context**: AI provides context for why certain data points might be outliers.

### 🏢 Admin Dashboard & Data Management
- **Schema Builder**: Create and manage database tables visually.
- **File Management**: Upload and organize CSV datasets for instant querying.
- **Rich Reporting**: Generate comprehensive PDF or Excel reports with embedded charts and AI insights.

![Admin Dashboard & Report Generation](file:///placeholder_dashboard.png)
*Placeholder: Screenshot of the Admin Dashboard showing the "Analytics & Reports" tab and the PDF download flow.*

### 🔒 Enterprise-Grade Security
- **RBAC (Role-Based Access Control)**: Granular permissions for Admins, Editors, and Viewers.
- **SQL Safety**: Strict validation and permission-based execution (Admins can perform DDL/DML; Viewers are SELECT-only).
- **JWT Authentication**: Secure session management.

---

## 🎨 Design Philosophy: "Quantum Monochrome"
Talk2DB features a professional **Monochromic Glassmorphism** UI.
- **Aesthetic**: Strict black, white, and gray palette for a high-end enterprise feel.
- **Interactivity**: Subtle backdrop blurs, animated background glows, and responsive micro-animations.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Flask (Python), Pandas, ReportLab (PDF), Matplotlib/Seaborn.
- **AI Engine**: Google Gemini API (`gemini-pro`).
- **Database**: MySQL.

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to `backend/`.
2. Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_google_ai_key
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=talk2db
   UPLOAD_FOLDER=./uploads
   ```
3. Install dependencies: `pip install -r requirements.txt`.
4. Run: `python app.py`.

### 2. Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Run: `npm run dev`.

### 3. Usage
- **Admin**: `admin / admin123` (Full Access)
- **Guest**: `viewer / viewer123` (Read-only Analytics)

---

## 📜 License
*Proprietary - Talk2DB Advanced Analytics Suite*
