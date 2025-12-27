from database import DatabaseManager

class SchemaManager:
    def __init__(self):
        self.db = DatabaseManager()

    def create_table(self, table_name, columns):
        """
        Create a new SQL table.
        columns: List of dicts {name, type, constraints}
        """
        try:
            col_defs = []
            for col in columns:
                definition = f"{col['name']} {col['type']}"
                if col.get('primary_key'):
                    definition += " PRIMARY KEY"
                if col.get('not_null'):
                    definition += " NOT NULL"
                if col.get('unique'):
                    definition += " UNIQUE"
                # Add check for auto_increment if INT and PK? simplify for now
                col_defs.append(definition)
            
            query = f"CREATE TABLE {table_name} ({', '.join(col_defs)});"
            
            # Use execute_query but expect no results for DDL usually, 
            # or use cursor directly. DatabaseManager.execute_query works for now
            # but creates dictionary cursor. It's fine for DDL too (returns empty list).
            self.db.execute_query(query)
            return {"message": f"Table {table_name} created successfully"}
        except Exception as e:
            raise Exception(f"Failed to create table: {str(e)}")

    def list_tables(self):
        """List all tables in the database."""
        try:
            results = self.db.execute_query("SHOW TABLES")
            # results is [{'Tables_in_dbname': 'tablename'}, ...]
            tables = [list(row.values())[0] for row in results]
            return tables
        except Exception as e:
            raise Exception(f"Failed to list tables: {str(e)}")

    def delete_table(self, table_name):
        """Drop a table."""
        try:
            self.db.execute_query(f"DROP TABLE IF EXISTS {table_name}")
            return {"message": f"Table {table_name} deleted successfully"}
        except Exception as e:
            raise Exception(f"Failed to delete table: {str(e)}")
