import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './components/MessageBubble';
import FileUpload from './components/FileUpload';
import { useDarkMode } from './context/DarkModeContext';
import ApiService from './services/apiService';

function App() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I can help you query your database using natural language and analyze CSV files. Try asking something like 'Show me all customers who ordered in the last week' or upload CSV files for analysis.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState('sql'); // 'sql' or 'csv'
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      
      if (queryType === 'sql') {
        response = await ApiService.queryDatabase(input.trim());
      } else if (queryType === 'csv') {
        if (!hasUploadedFiles) {
          throw new Error('Please upload CSV files first before querying them.');
        }
        response = await ApiService.queryCSVData(input.trim());
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.reply || response.response || 'No response received',
        sql: response.sql,
        results: response.results,
        explanation: response.explanation,
        timestamp: new Date().toISOString(),
        type: queryType === 'csv' ? 'csv_query' : 'sql_query'
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your backend is running and try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (result) => {
    const uploadMessage = {
      role: 'assistant',
      content: `Successfully uploaded ${result.files.length} file(s). You can now ask questions about your CSV data.`,
      timestamp: new Date().toISOString(),
      type: 'upload_success'
    };
    setMessages((prev) => [...prev, uploadMessage]);
    setHasUploadedFiles(true);
  };

  const handleAnalysisComplete = (result) => {
    const analysisMessage = {
      role: 'assistant',
      content: result.analysis,
      timestamp: new Date().toISOString(),
      type: 'csv_analysis'
    };
    setMessages((prev) => [...prev, analysisMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Natural Language to SQL</h1>
          </div>
          
          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-5h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.button>
        </div>
      </nav>

      {/* Query Type Toggle */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Query Type:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setQueryType('sql')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  queryType === 'sql'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                SQL Database
              </button>
              <button
                onClick={() => setQueryType('csv')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  queryType === 'csv'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                CSV Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section (only for CSV mode) */}
      {queryType === 'csv' && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <FileUpload 
              onFilesUploaded={handleFilesUploaded}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} isUser={message.role === 'user'} />
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start mb-4"
            >
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={queryType === 'sql' ? "Ask your database anything..." : "Ask questions about your CSV data..."}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent shadow-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
                disabled={loading}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
                !input.trim() || loading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
