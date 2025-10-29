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

# Create Flask app and load configuration
app = Flask(__name__)
config = Config()
# Configure CORS to only allow configured origins
CORS(app, origins=config.CORS_ORIGINS)

# Initialize manager instances used across routes
db_manager = DatabaseManager()
ai_manager = AIManager()
file_manager = FileManager()


# -------------------- MySQL Query Handler -------------------- #
@app.route('/api/query', methods=['POST'])
def handle_query():
    """Handle natural-language -> SQL queries.

    Expected JSON body: { "query": "<natural language>" }

    Flow:
    - Validate input
    - Ask AIManager to generate SQL using DB schema
    - Execute SQL via DatabaseManager
    - Ask AIManager to produce a short explanation
    - Return SQL, results and explanation to caller
    """
    try:
        data = request.get_json()
        nl_query = data.get('query')

        if not nl_query:
            return jsonify({"error": "Query is required"}), 400

        # Generate SQL query using AI (may raise an Exception on failure)
        schema = db_manager.get_schema()
        sql_query = ai_manager.generate_sql_query(nl_query, schema)

        # Execute the generated SQL and fetch results
        results = db_manager.execute_query(sql_query)

        # Generate a short explanation of the query/results
        explanation = ai_manager.generate_query_explanation(sql_query, results)

        return jsonify({
            "sql": sql_query,
            "results": results,
            "explanation": explanation,
            "reply": explanation  # For frontend compatibility
        })

    except Exception as e:
        # Return a 500 with a clear error message on unexpected failures
        return jsonify({"error": str(e)}), 500



# -------------------- CSV Upload & Analysis -------------------- #
@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    """Save uploaded CSV files to the configured upload folder.

    Expects form-data with key 'files' (can be multiple files).
    Returns saved file paths on success.
    """
    try:
        files = request.files.getlist('files')

        if not files:
            return jsonify({"error": "No files uploaded"}), 400

        uploaded_paths = file_manager.save_uploaded_files(files)

        return jsonify({
            "message": "Files uploaded successfully",
            "files": uploaded_paths
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/analyze_csvs', methods=['POST'])
def analyze_csvs():
    """Return an AI-generated analysis of uploaded CSVs.

    The FileManager returns light summaries (columns + small sample) which are
    sent to the AI manager for relationship analysis.
    """
    try:
        csv_data_summaries = file_manager.get_csv_data_summaries()

        if not csv_data_summaries:
            return jsonify({"error": "No CSV files found"}), 400

        analysis = ai_manager.analyze_csv_files(csv_data_summaries)

        return jsonify({
            "analysis": analysis,
            "files": list(csv_data_summaries.keys())
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/query_csv', methods=['POST'])
def query_csv():
    """Run a natural language query against uploaded CSV data.

    Expected JSON body: { "query": "<natural language>" }
    The AI manager receives small CSV samples and returns a textual reply.
    """
    try:
        data = request.get_json()
        user_query = data.get("query")

        if not user_query:
            return jsonify({"error": "Query is required"}), 400

        csv_data = file_manager.get_csv_data_for_query()

        if not csv_data:
            return jsonify({"error": "No CSV files available for querying"}), 400

        response = ai_manager.query_csv_data(user_query, csv_data)

        return jsonify({
            "response": response,
            "reply": response  # For frontend compatibility
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



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
