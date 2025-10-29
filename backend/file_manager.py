"""File manager utilities for handling CSV uploads.

This module provides a small wrapper around filesystem operations and
pandas to read, summarize and prepare CSV data for the AI manager.
Each method has defensive error handling so the API can continue even if
one uploaded file is malformed.
"""

import os
import pandas as pd
from config import Config


class FileManager:
    """Manage file uploads and provide lightweight CSV summaries.

    Attributes:
        config: loaded configuration values
        upload_folder: path where uploaded files are saved
    """

    def __init__(self):
        # Load configuration (upload folder path, limits, etc.)
        self.config = Config()
        self.upload_folder = self.config.UPLOAD_FOLDER
        # Ensure the upload directory exists
        self.ensure_upload_folder()

    def ensure_upload_folder(self):
        """Create upload folder if it doesn't exist."""
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_uploaded_files(self, files):
        """Save uploaded files to the upload folder.

        - Accepts the Werkzeug FileStorage list from Flask request.files
        - Only saves files that end with '.csv'
        - Returns a list of saved file system paths
        """
        uploaded_paths = []

        for file in files:
            # Basic filename-based validation; extend as needed
            if file.filename.endswith('.csv'):
                path = os.path.join(self.upload_folder, file.filename)
                # Save file to disk
                file.save(path)
                uploaded_paths.append(path)

        if not uploaded_paths:
            # If no CSVs saved, raise an error the API route can report
            raise ValueError("No valid CSV files uploaded.")

        return uploaded_paths

    def get_csv_files(self):
        """Return a list of CSV filenames in upload folder."""
        files = os.listdir(self.upload_folder)
        return [file for file in files if file.endswith('.csv')]

    def get_csv_data_summaries(self):
        """Get light summaries for all CSV files.

        Each entry contains column names and a small sample (first 3 rows)
        suitable for sending to the AI model (keeps payloads small).
        """
        csv_data_summaries = {}
        files = self.get_csv_files()

        for file in files:
            try:
                df = pd.read_csv(os.path.join(self.upload_folder, file))
                csv_data_summaries[file] = {
                    "columns": list(df.columns),
                    "sample": df.head(3).to_dict(orient="records")
                }
            except Exception as e:
                # On error, print/log and skip the problematic file
                print(f"Error reading {file}: {e}")
                continue

        return csv_data_summaries

    def get_csv_data_for_query(self):
        """Return CSV data prepared for querying by the AI manager.

        This includes column lists and a slightly larger sample (first 5 rows)
        to give the model enough context for answering user queries.
        """
        csv_data = {}
        files = self.get_csv_files()

        for file in files:
            try:
                df = pd.read_csv(os.path.join(self.upload_folder, file))
                csv_data[file] = {
                    "columns": list(df.columns),
                    "sample": df.head(5).to_dict(orient="records")
                }
            except Exception as e:
                print(f"Error reading {file}: {e}")
                continue

        return csv_data

    def clear_upload_folder(self):
        """Remove all CSVs from the upload folder (used for cleanup/testing)."""
        files = self.get_csv_files()
        for file in files:
            try:
                os.remove(os.path.join(self.upload_folder, file))
            except Exception as e:
                print(f"Error removing {file}: {e}")
