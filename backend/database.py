"""Simple database manager wrapper around mysql-connector.

This class handles connecting to the configured MySQL instance, executing
queries and returning results as dictionaries (cursor with dictionary=True).
It also provides a lightweight textual schema that is used to help the AI
model produce valid SQL for this specific database.
"""

import mysql.connector
from config import Config


class DatabaseManager:
    """Manage a single MySQL connection used by the API.

    Note: For production use you would typically use a connection pool. This
    simple manager is suitable for development and small deployments.
    """

    def __init__(self):
        # Load DB configuration and establish connection immediately
        self.config = Config()
        self.connection = None
        self.connect()

    def connect(self):
        """Establish database connection using config values."""
        try:
            self.connection = mysql.connector.connect(
                host=self.config.DB_HOST,
                user=self.config.DB_USER,
                password=self.config.DB_PASSWORD,
                database=self.config.DB_NAME
            )
            # Informational print for local dev logs
            print("Database connected successfully")
        except mysql.connector.Error as e:
            # Print and re-raise so the app can fail-fast if DB is unreachable
            print(f"Database connection error: {e}")
            raise

    def execute_query(self, query):
        """Execute SQL query and return results as a list of dicts.

        The cursor is created with dictionary=True so rows are returned as
        Python dicts which are JSON-serializable by Flask's jsonify.
        """
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            return results
        except mysql.connector.Error as e:
            # Print error for debugging and re-raise for higher-level handling
            print(f"Query execution error: {e}")
            raise

    def close(self):
        """Close the underlying DB connection if it's open."""
        if self.connection:
            self.connection.close()

    def get_schema(self):
        """Return a textual representation of the database schema.

        This is used to provide the AI model with table/column context so it
        can generate valid SQL tailored to the schema. In a real application
        this method could introspect the DB instead of returning a hard-coded
        string.
        """
        return """
Database: library_db
Tables:
1. authors(author_id, name, country)
2. books(book_id, title, author_id, publication_year, genre, available_copies)
3. members(member_id, name, join_date, membership_type)
4. loans(loan_id, book_id, member_id, loan_date, return_date, status)
Relationships:
- books.author_id -> authors.author_id
- loans.book_id -> books.book_id
- loans.member_id -> members.member_id
"""
