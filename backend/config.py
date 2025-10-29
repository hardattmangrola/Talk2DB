"""Application configuration loader.

This module centralizes configuration values used by the backend. Values are
loaded from environment variables (via python-dotenv) with sensible defaults
so the app runs in a development environment out-of-the-box.
"""

import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()


class Config:
    """Container for configuration values used across the backend."""

    # Gemini API Configuration - set your real key in the environment
    # No hard-coded default here for security; set GEMINI_API_KEY in your .env
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # Database Configuration - defaults suitable for local dev
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'root')
    DB_NAME = os.getenv('DB_NAME', 'library_db')

    # File Upload Configuration
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 16 * 1024 * 1024))  # 16MB

    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    # CORS Configuration - comma-separated list supported
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
