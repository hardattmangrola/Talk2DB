# main backend application
"""Flask backend API.

This module exposes endpoints for:
- Generating and executing SQL queries against a configured MySQL DB
- Uploading CSV files and analyzing/querying them via the AI manager
- A simple health-check endpoint and static index serving helper

Each route returns JSON and uses the manager classes defined in the
backend to separate concerns (DB, AI, file handling).
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import DatabaseManager
from ai_manager import AIManager
from file_manager import FileManager
from auth import check_password, generate_token, token_required, role_required
from models import users_db, Role
from schema_manager import SchemaManager
from analytics_manager import AnalyticsManager
import os
from werkzeug.utils import secure_filename

# Create Flask app and load configuration
app = Flask(__name__)
config = Config()
# Set Flask config from Config object
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER
app.config['MAX_FILE_SIZE'] = config.MAX_FILE_SIZE
app.config['SECRET_KEY'] = config.SECRET_KEY
# Configure CORS to only allow configured origins
CORS(app, origins=config.CORS_ORIGINS)

# Initialize manager instances used across routes
db_manager = DatabaseManager()
ai_manager = AIManager()
file_manager = FileManager()
schema_manager = SchemaManager()
analytics_manager = AnalyticsManager(config.UPLOAD_FOLDER)


# -------------------- Authentication -------------------- #
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing credentials'}), 400
    
    user = users_db.get(data.get('username'))
    if not user:
        # For security, don't reveal if user exists
        return jsonify({'message': 'Invalid credentials'}), 401
    
    if check_password(data.get('password'), user.password_hash):
        token = generate_token(user.username, user.role.value)
        return jsonify({
            'token': token, 
            'username': user.username, 
            'role': user.role.value,
            'permissions': user.permissions
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401


# -------------------- MySQL Query Handler -------------------- #
@app.route('/api/query', methods=['POST'])
@token_required
def query_database(current_user):
    """
    Handle natural language queries about the database.
    Expects JSON: { "query": "your question", "language": "English" }
    """
    data = request.json
    user_query = data.get('query')
    language = data.get('language', 'English')
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # Check if user is trying to delete/drop (even before generating SQL)
        query_lower = user_query.lower()
        if any(keyword in query_lower for keyword in ['delete', 'drop table', 'drop', 'remove table']):
            # Check if user has delete permission
            if 'delete' not in current_user.permissions and '*' not in current_user.permissions:
                return jsonify({
                    "error": "PERMISSION_DENIED",
                    "message": f"You don't have permission to delete/drop resources. Only administrators can perform this action. Current role: {current_user.role.value}"
                }), 403
        
        # 1. Get Schema (Dynamic)
        schema_string = db_manager.get_schema()

        # 2. Determine if user has destructive permissions
        allow_destructive = 'delete' in current_user.permissions or '*' in current_user.permissions

        # 3. Generate SQL
        sql_query = ai_manager.generate_sql_query(user_query, schema_string, allow_destructive=allow_destructive)

        # 4. Execute SQL
        # If it's a SELECT, we get results list. If it's DML/DDL, we get a status message or rows affected.
        results = db_manager.execute_query(sql_query)

        # 5. Generate Explanation (in requested language)
        explanation = ai_manager.generate_query_explanation(sql_query, results, language=language)

        return jsonify({
            "sql": sql_query,
            "results": results if isinstance(results, list) else [],
            "message": str(results) if not isinstance(results, list) else None,
            "explanation": explanation,
            "reply": explanation 
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload_csv', methods=['POST'])
@token_required
def upload_csv(current_user):
    """
    Handle CSV file uploads.
    Files are saved to 'uploads' folder.
    """
    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files')
    saved_files = []

    try:
        upload_folder = config.UPLOAD_FOLDER
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        for file in files:
            if file and file.filename.endswith('.csv'):
                # Basic filename sanitization
                filename = secure_filename(file.filename)
                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)
                saved_files.append(filename)
        
        return jsonify({"message": f"Successfully uploaded {len(saved_files)} files", "files": saved_files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze_csvs', methods=['POST'])
@token_required
def analyze_csvs(current_user):
    """
    Analyze uploaded CSV files to find relationships.
    Expects JSON: { "language": "English" } (Optional)
    """
    language = request.json.get('language', 'English') if request.json else 'English'
    try:
        csv_summaries = file_manager.get_csv_summaries()
        if not csv_summaries:
             return jsonify({"analysis": "No CSV files found or files are empty."})

        analysis = ai_manager.analyze_csv_files(csv_summaries, language=language)
        return jsonify({"analysis": analysis})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/query_csv', methods=['POST'])
@token_required
def query_csv(current_user):
    """
    Query uploaded CSV data.
    Expects JSON: { "query": "question", "language": "English" }
    """
    data = request.json
    user_query = data.get('query')
    language = data.get('language', 'English')

    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        csv_data = file_manager.get_csv_content_preview()
        if not csv_data:
            return jsonify({"response": "No CSV data available to query."})

        response = ai_manager.query_csv_data(user_query, csv_data, language=language)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# -------------------- Schema Management -------------------- #
@app.route('/api/schema/tables', methods=['GET'])
@token_required
def list_tables(current_user):
    try:
        tables = schema_manager.list_tables()
        return jsonify({"tables": tables})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schema/tables', methods=['POST'])
@token_required
@role_required([Role.ADMIN])
def create_table(current_user):
    try:
        data = request.get_json()
        table_name = data.get('table_name')
        columns = data.get('columns')
        
        if not table_name or not columns:
             return jsonify({"error": "table_name and columns are required"}), 400
             
        result = schema_manager.create_table(table_name, columns)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schema/tables/<table_name>', methods=['DELETE'])
@token_required
@role_required([Role.ADMIN])
def delete_table(current_user, table_name):
    try:
        result = schema_manager.delete_table(table_name)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- Analytics & Reporting -------------------- #
@app.route('/api/analytics/files', methods=['GET'])
@token_required
def list_analytics_files(current_user):
    """List all CSV files available for analytics."""
    try:
        files = file_manager.get_csv_files()
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/stats', methods=['POST'])
@token_required
def get_file_stats(current_user):
    """
    Get statistical summary of a CSV file.
    Expects JSON: { "filename": "data.csv" }
    """
    filename = request.json.get('filename')
    if not filename:
        return jsonify({"error": "Filename is required"}), 400
    
    try:
        stats = analytics_manager.get_column_stats(filename)
        return jsonify({"stats": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/visualize', methods=['POST'])
@token_required
def get_visualizations(current_user):
    filename = request.json.get('filename')
    if not filename:
        return jsonify({"error": "Filename is required"}), 400
    try:
        plots = analytics_manager.generate_visualizations_base64(filename)
        return jsonify({"plots": plots})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/insights', methods=['POST'])
@token_required
def get_detailed_insights(current_user):
    filename = request.json.get('filename')
    language = request.json.get('language', 'English')
    if not filename:
        return jsonify({"error": "Filename is required"}), 400
    try:
        stats = analytics_manager.get_column_stats(filename)
        insights = ai_manager.generate_detailed_insights(stats, language=language)
        return jsonify({"insights": insights})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/report', methods=['POST'])
@token_required
def generate_report(current_user):
    """
    Generate a report (PDF/Excel) for a CSV file.
    Expects JSON: { "filename": "data.csv", "type": "pdf"|"xlsx", "language": "English" }
    """
    data = request.json
    filename = data.get('filename')
    report_type = data.get('type', 'pdf')
    language = data.get('language', 'English')
    
    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    try:
        # Fetch insights first for the PDF report
        stats = analytics_manager.get_column_stats(filename)
        insights = ai_manager.generate_detailed_insights(stats, language=language)
        
        report_filename = analytics_manager.generate_report(filename, report_type, language, insights)
        # Return download URL
        return jsonify({
            "message": "Report generated",
            "download_url": f"/api/download/{report_filename}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
@token_required
def download_file(current_user, filename):
    """Download a file from the uploads directory."""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# -------------------- Health Check -------------------- #
@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health endpoint used by the frontend or deploy checks."""
    return jsonify({
        "status": "healthy",
        "message": "Backend is running successfully"
    })



# -------------------- Serve UI -------------------- #
@app.route('/')
def serve_index():
    """Serve the frontend index.html from parent directory (simple static helper)."""
    return send_from_directory('..', 'index.html')


if __name__ == "__main__":
    # Start the Flask development server using configured debug/port
    app.run(debug=config.DEBUG, port=8000)
