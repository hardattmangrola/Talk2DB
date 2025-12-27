// API service layer for backend communication
const API_BASE_URL = '/api';

class ApiService {
  static getHeaders(token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // SQL Query endpoint
  static async queryDatabase(query, token, language = 'English') {
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ query, language }),
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
  static async uploadCSVFiles(files, token) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload_csv`, {
        method: 'POST',
        headers: headers, // FormData automatically sets Content-Type to multipart/form-data with boundary
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
  static async analyzeCSVFiles(token, language = 'English') {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze_csvs`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ language }),
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
  static async queryCSVData(query, token, language = 'English') {
    try {
      const response = await fetch(`${API_BASE_URL}/query_csv`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ query, language }),
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

  // Analytics endpoints
  static async getFileStats(filename, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Stats error:', error);
      throw error;
    }
  }

  static async generateReport(filename, type, token, language = 'English') {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/report`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ filename, type, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return await response.json();
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  static async getAnalyticsFiles(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/files`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics files');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch analytics files error:', error);
      throw error;
    }
  }

  static async getVisualizations(filename, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/visualize`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ filename }),
      });
      if (!response.ok) throw new Error('Failed to fetch visualizations');
      return await response.json();
    } catch (error) {
      console.error('Visualizations error:', error);
      throw error;
    }
  }

  static async getDetailedInsights(filename, token, language = 'English') {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/insights`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ filename, language }),
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return await response.json();
    } catch (error) {
      console.error('Insights error:', error);
      throw error;
    }
  }

  // Schema Management endpoints
  static async listTables(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/schema/tables`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      return await response.json();
    } catch (error) {
      console.error('List tables error:', error);
      throw error;
    }
  }

  static async createTable(tableName, columns, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/schema/tables`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          table_name: tableName,
          columns: columns
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create table');
      }

      return await response.json();
    } catch (error) {
      console.error('Create table error:', error);
      throw error;
    }
  }

  static async deleteTable(tableName, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/schema/tables/${tableName}`, {
        method: 'DELETE',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to delete table');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete table error:', error);
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
