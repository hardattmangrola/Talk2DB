import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "./components/FileUpload";
import ApiService from "./services/apiService";

// DarkMode Context
const DarkModeContext = React.createContext();

const useDarkMode = () => {
  const context = React.useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within DarkModeProvider");
  }
  return context;
};

const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Sidebar Component
const Sidebar = ({ isOpen, onClose, messageCount, onClearChat }) => {
  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed left-0 top-0 h-full w-64 bg-[#0f1419] border-r border-gray-800 z-50 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Chat Info</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Message Count */}
          <div className="bg-[#1a2332] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Messages</p>
                <p className="text-white text-2xl font-bold">{messageCount}</p>
              </div>
            </div>
          </div>

          {/* Clear Chat Button */}
          <button
            onClick={onClearChat}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Chat
          </button>
        </div>
      </motion.div>
    </>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isUser }) => {
  const { content, sql, results, timestamp } = message;
  const [showResults, setShowResults] = useState(false);

  const renderResults = () => {
    if (!results || results.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ delay: 0.3 }}
        className="mt-3 p-3 bg-[#0f1419] rounded-lg overflow-x-auto border border-gray-800"
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-cyan-400">
            Query Results ({results.length} rows)
          </h4>
          <button
            onClick={() => setShowResults(!showResults)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showResults ? "Hide" : "Show"} Results
          </button>
        </div>

        {showResults && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {Object.keys(results[0] || {}).map((key, index) => (
                    <th
                      key={index}
                      className="text-left py-2 px-2 text-cyan-400"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-800">
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="py-2 px-2 text-gray-300">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing first 10 rows of {results.length} total results
              </p>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="flex items-start gap-3 max-w-[85%] md:max-w-[75%]">
        {!isUser && (
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-[#1e2a3a] text-gray-100 border border-gray-700"
          }`}
        >
          <div className="text-sm md:text-base whitespace-pre-wrap">
            {content}
          </div>

          {sql && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.2 }}
              className="mt-3 p-3 bg-[#0f1419] rounded-lg overflow-x-auto border border-gray-800"
            >
              <h4 className="text-sm font-medium text-cyan-400 mb-2">
                Generated SQL Query:
              </h4>
              <pre className="text-xs md:text-sm text-cyan-300 whitespace-pre-wrap font-mono">
                {sql}
              </pre>
            </motion.div>
          )}

          {renderResults()}

          {timestamp && (
            <div className="text-xs mt-2 text-gray-400">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main App Component
function App() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm your AI-powered database assistant. Ask me anything about your data using natural language, or upload CSV files for instant analysis.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState("sql");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate API call
    try {
      let response;

      if (queryType === "sql") {
        response = await ApiService.queryDatabase(input.trim());
      } else if (queryType === "csv") {
        if (!hasUploadedFiles) {
          throw new Error(
            "Please upload CSV files first before querying them."
          );
        }
        response = await ApiService.queryCSVData(input.trim());
      }

      const assistantMessage = {
        role: "assistant",
        content: response.reply || response.response || "No response received",
        sql: response.sql,
        results: response.results,
        explanation: response.explanation,
        timestamp: new Date().toISOString(),
        type: queryType === "csv" ? "csv_query" : "sql_query",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your backend is running and try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "👋 Hello! I'm your AI-powered database assistant. Ask me anything about your data using natural language, or upload CSV files for instant analysis. Try queries like 'Show me top customers' or 'Analyze sales trends'.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setSidebarOpen(false);
  };

  const handleFilesUploaded = (result) => {
    const uploadMessage = {
      role: "assistant",
      content: `Successfully uploaded ${result.files.length} file(s). You can now ask questions about your CSV data.`,
      timestamp: new Date().toISOString(),
      type: "upload_success",
    };
    setMessages((prev) => [...prev, uploadMessage]);
    setHasUploadedFiles(true);
  };

  const handleAnalysisComplete = (result) => {
    const analysisMessage = {
      role: "assistant",
      content: result.analysis,
      timestamp: new Date().toISOString(),
      type: "csv_analysis",
    };
    setMessages((prev) => [...prev, analysisMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-[#0a0f16]" : "bg-gray-50"
      } transition-colors duration-200`}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        messageCount={messages.length}
        onClearChat={handleClearChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav
          className={`${darkMode ? "bg-[#0f1419]" : "bg-white"} border-b ${
            darkMode ? "border-gray-800" : "border-gray-200"
          } px-4 py-3 transition-colors duration-200`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-cyan-500 text-white"
                    : "bg-cyan-100 text-cyan-600"
                } hover:opacity-80 transition-opacity`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Logo */}
              <div
                className={`w-10 h-10 ${
                  darkMode ? "bg-cyan-500" : "bg-cyan-600"
                } rounded-lg flex items-center justify-center`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>

              <div>
                <h1
                  className={`text-xl font-bold ${
                    darkMode ? "text-cyan-400" : "text-cyan-600"
                  }`}
                >
                  Talk2DB
                </h1>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Natural Language Database Interface
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-800 text-yellow-400"
              } transition-colors duration-200`}
            >
              {darkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        </nav>

        {/* Query Type Toggle */}
        <div
          className={`${darkMode ? "bg-[#0f1419]" : "bg-white"} border-b ${
            darkMode ? "border-gray-800" : "border-gray-200"
          } px-4 py-3`}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <div
              className={`flex ${
                darkMode ? "bg-[#1a2332]" : "bg-gray-100"
              } rounded-lg p-1`}
            >
              <button
                onClick={() => setQueryType("sql")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  queryType === "sql"
                    ? "bg-blue-600 text-white shadow-lg"
                    : `${
                        darkMode
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`
                }`}
              >
                SQL Database
              </button>
              <button
                onClick={() => setQueryType("csv")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  queryType === "csv"
                    ? "bg-blue-600 text-white shadow-lg"
                    : `${
                        darkMode
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`
                }`}
              >
                CSV Files
              </button>
            </div>
          </div>
        </div>

        {/* File Upload Section (only for CSV mode) */}
        {queryType === "csv" && (
          <div
            className={`${darkMode ? "bg-[#0f1419]" : "bg-white"} border-b ${
              darkMode ? "border-gray-800" : "border-gray-200"
            } px-4 py-4`}
          >
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
                <MessageBubble
                  key={index}
                  message={message}
                  isUser={message.role === "user"}
                />
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 mb-4"
              >
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div
                  className={`${
                    darkMode ? "bg-[#1e2a3a]" : "bg-gray-100"
                  } rounded-2xl px-4 py-3 border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div
          className={`${darkMode ? "bg-[#0f1419]" : "bg-white"} border-t ${
            darkMode ? "border-gray-800" : "border-gray-200"
          } px-4 py-4 transition-colors duration-200`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your database..."
                  className={`w-full px-4 py-3 border ${
                    darkMode
                      ? "border-gray-700 bg-[#1a2332] text-white placeholder-gray-500"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                  } rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  rows={1}
                  style={{
                    minHeight: "48px",
                    maxHeight: "120px",
                  }}
                  disabled={loading}
                />
                <div
                  className={`absolute right-3 bottom-3 text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {input.length}/1000
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
                  !input.trim() || loading
                    ? `${
                        darkMode
                          ? "bg-gray-700 text-gray-500"
                          : "bg-gray-300 text-gray-500"
                      } cursor-not-allowed`
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </motion.button>
            </div>
            <div className="flex items-center justify-between mt-2 px-2">
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Press Enter to send • Shift+Enter for new line
                </span>
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap App with DarkModeProvider
export default function Root() {
  return (
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  );
}
