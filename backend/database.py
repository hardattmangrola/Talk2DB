"""Simple database manager wrapper around mysql-connector.

This class handles connecting to the configured MySQL instance, executing
queries and returning results as dictionaries (cursor with dictionary=True).
It also provides a lightweight textual schema that is used to help the AI
model produce valid SQL for this specific database.
"""

import mysql.connector #imports the mysql.connector module into memory.
from config import Config #Imports the Config class from the config.py file

#Defines a new class object named DatabaseManager
class DatabaseManager:
    """Manage a single MySQL connection used by the API.

    Note: For production use you would typically use a connection pool. This
    simple manager is suitable for development and small deployments.
    """
    #Input: self → an instance of DatabaseManager.
    #Output: Initializes the instance; returns None.
    def __init__(self):
        # Load DB configuration and establish connection immediately
        self.config = Config() #Calls the Config class (no external argument).It Creates an instance of Config and assigns it to self.config.
        self.connection = None #Sets the attribute connection to None.
        self.connect() #Establishes a MySQL connection; returns None

    #Establishes connection and assigns to self.connection. Returns None.
    def connect(self):
        """Establish database connection using config values."""
        try:
            #Returns a mysql.connector.connection.MySQLConnection object and assigns it to self.connection
            self.connection = mysql.connector.connect(
                host=self.config.DB_HOST, #string
                user=self.config.DB_USER, #string
                password=self.config.DB_PASSWORD, #string
                database=self.config.DB_NAME #string
            )
            # Informational print for local dev logs
            print("Database connected successfully")
        except mysql.connector.Error as e:
            # Print and re-raise so the app can fail-fast if DB is unreachable
            print(f"Database connection error: {e}")
            raise
    ##Output: Returns query results as a list of dict
    def execute_query(self, query):
        """Execute SQL query and return results as a list of dicts.

        The cursor is created with dictionary=True so rows are returned as
        Python dicts which are JSON-serializable by Flask's jsonify.
        """
        try:
            cursor = self.connection.cursor(dictionary=True) 
            #Input: Boolean flag dictionary=True.
            #Output: Returns a MySQLCursorDict object (cursor that outputs dicts).
            cursor.execute(query) 
            #Input:query (string SQL statement).
            #Output: Executes SQL command → returns None.
            results = cursor.fetchall() #Output: Returns all fetched rows as a list of dictionaries (List[Dict[str, Any]]).
            cursor.close()
            return results
        #Catches and binds the exception to variable e. Type: mysql.connector.errors.Error
        except mysql.connector.Error as e:
            # Print error for debugging and re-raise for higher-level handling
            print(f"Query execution error: {e}")
            raise

    def close(self):
        """Close the underlying DB connection if it's open."""
        if self.connection:
            self.connection.close()

    #Returns a textual (string) schema description.
    def get_schema(self):
        """Return a textual representation of the database schema dynamically.
        
        Introspects the information_schema to build the schema string.
        """
        try:
            schema_str = f"Database: {self.config.DB_NAME}\nTables:\n"
            
            # Get all tables
            cursor = self.connection.cursor()
            cursor.execute(f"SHOW TABLES")
            tables = cursor.fetchall()
            
            relationships = []
            
            for i, table_row in enumerate(tables):
                table_name = table_row[0]
                
                # Get columns for each table
                cursor.execute(f"DESCRIBE {table_name}")
                columns = cursor.fetchall()
                col_defs = []
                for col in columns:
                    col_name = col[0]
                    col_defs.append(col_name)
                    
                schema_str += f"{i+1}. {table_name}({', '.join(col_defs)})\n"
                
                # Try to infer simple foreign keys (naive approach or use constraints query)
                # For simplified version, we just check foreign key constraints
                cursor.execute(f"""
                    SELECT 
                        TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                    FROM
                        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE
                        REFERENCED_TABLE_SCHEMA = '{self.config.DB_NAME}' AND
                        TABLE_NAME = '{table_name}';
                """)
                fks = cursor.fetchall()
                for fk in fks:
                    relationships.append(f"- {fk[0]}.{fk[1]} -> {fk[3]}.{fk[4]}")

            cursor.close()
            
            if relationships:
                schema_str += "Relationships:\n" + "\n".join(relationships) + "\n"
                
            return schema_str
            
        except Exception as e:
            print(f"Error introspecting schema: {e}")
            # Fallback to empty or simple message
            return f"Database: {self.config.DB_NAME} (Error retrieving schema)"
