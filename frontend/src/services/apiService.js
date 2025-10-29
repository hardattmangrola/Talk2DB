// API service layer for backend communication
const API_BASE_URL = '/api';

class ApiService {
  // SQL Query endpoint
  static async queryDatabase(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // CSV Upload endpoint
  static async uploadCSVFiles(files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/upload_csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('CSV upload error:', error);
      throw error;
    }
  }

  // CSV Analysis endpoint
  static async analyzeCSVFiles() {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze_csvs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('CSV analysis error:', error);
      throw error;
    }
  }

  // CSV Query endpoint
  static async queryCSVData(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/query_csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'CSV query failed');
      }

      return await response.json();
    } catch (error) {
      console.error('CSV query error:', error);
      throw error;
    }
  }

  // Health check endpoint
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('Backend is not responding');
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

export default ApiService;
