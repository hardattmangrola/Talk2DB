# TALK2DB
A modern LLM-powered Natural Language Query System that enables users to retrieve and analyze information from a MySQL database using plain English queries, eliminating the need to write SQL manually.
Talk2DB enables users to retrieve and analyze data using natural language queries, eliminating the need for SQL expertise.
Users can also upload multiple CSV files, which the system analyzes, relates, and integrates dynamically to create a unified data model for comprehensive querying.

## Snapshots:
### System Architecture 
![image_alt](https://github.com/hardattmangrola/Talk2DB/blob/ad61a6e88082ecc907020bfb367b8c19b5ee44a4/screenshots/ui0.png)
### Multlingual Support 
![image_alt](https://github.com/hardattmangrola/Talk2DB/blob/ad61a6e88082ecc907020bfb367b8c19b5ee44a4/screenshots/ui1.png)
### Identify Relationship between Multiple CSVs
![image_alt](https://github.com/hardattmangrola/Talk2DB/blob/ad61a6e88082ecc907020bfb367b8c19b5ee44a4/screenshots/ui2.png)
### Querying CSV
![image_alt](https://github.com/hardattmangrola/Talk2DB/blob/ad61a6e88082ecc907020bfb367b8c19b5ee44a4/screenshots/ui3.png)

## Features

### 🗄️ SQL Database Querying
- Natural language to SQL conversion using Google's Gemini AI
- Interactive query results with expandable tables
- Real-time SQL query generation and execution
- Support for MySQL databases

### 📊 CSV File Analysis
- Drag & drop CSV file upload
- Automatic file analysis and relationship detection
- Natural language queries on CSV data
- Visual data representation

### 🎨 Modern UI/UX
- Dark/Light mode toggle
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Real-time chat interface

## Project Structure

```
Assignment-frontend/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── config.py           # Configuration management
│   ├── database.py         # Database connection and operations
│   ├── ai_manager.py       # AI service integration
│   ├── file_manager.py     # File upload and management
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment variables template
├── src/
│   ├── components/
│   │   ├── MessageBubble.jsx    # Chat message component
│   │   └── FileUpload.jsx       # File upload component
│   ├── context/
│   │   └── DarkModeContext.jsx  # Dark mode state management
│   ├── services/
│   │   └── apiService.js        # API communication layer
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
└── package.json            # Frontend dependencies
```

## Setup Instructions

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create environment file:**
   ```bash
   # Windows
   copy env.txt .env
   
   # Linux/Mac
   cp env.txt .env
   ```
   
   Or simply rename `env.txt` to `.env`

3. **Edit the .env file:**
   - Update `GEMINI_API_KEY` with your Google Gemini API key (already provided as default)
   - Update database credentials if different
   - Configure other settings as needed

4. **Set up MySQL database:**
   - Create a database named `library_db`
   - Import sample data (optional)

5. **Run the backend:**
   ```bash
   python app.py
   ```

The backend will start on http://localhost:8000

### Frontend Setup

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_db

# File Upload Configuration
UPLOAD_FOLDER=./uploads
MAX_FILE_SIZE=16777216

# Flask Configuration
SECRET_KEY=your_secret_key
DEBUG=True

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Database Schema

The application expects a MySQL database with the following schema:

```sql
-- Authors table
CREATE TABLE authors (
    author_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100)
);

-- Books table
CREATE TABLE books (
    book_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author_id INT,
    publication_year INT,
    genre VARCHAR(100),
    available_copies INT,
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

-- Members table
CREATE TABLE members (
    member_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    join_date DATE,
    membership_type VARCHAR(50)
);

-- Loans table
CREATE TABLE loans (
    loan_id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT,
    member_id INT,
    loan_date DATE,
    return_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);
```

## API Endpoints

### SQL Querying
- `POST /api/query` - Execute natural language queries on database

### CSV Operations
- `POST /api/upload_csv` - Upload CSV files
- `POST /api/analyze_csvs` - Analyze uploaded CSV files
- `POST /api/query_csv` - Query CSV data with natural language

### Utility
- `GET /api/health` - Health check endpoint

## Usage Examples

### SQL Queries
- "Show me all books published after 2020"
- "Find authors from the United States"
- "How many books are currently on loan?"

### CSV Analysis
- Upload sales data CSV files
- Ask: "What are the top-selling products?"
- Ask: "Show me sales trends by month"

## Technologies Used

### Frontend
- React 18
- Tailwind CSS
- Framer Motion
- Vite

### Backend
- Flask
- MySQL Connector
- Google Generative AI (Gemini)
- Pandas
- Flask-CORS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
