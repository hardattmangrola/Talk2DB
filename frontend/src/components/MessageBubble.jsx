import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, isUser }) => {
  const { role, content, sql, results, explanation, timestamp, type } = message;
  const [showResults, setShowResults] = useState(false);

  const renderResults = () => {
    if (!results || results.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.3 }}
        className="mt-3 p-3 bg-gray-800 dark:bg-gray-900 rounded-lg overflow-x-auto"
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-emerald-400 dark:text-emerald-300">
            Query Results ({results.length} rows)
          </h4>
          <button
            onClick={() => setShowResults(!showResults)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showResults ? 'Hide' : 'Show'} Results
          </button>
        </div>
        
        {showResults && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  {Object.keys(results[0] || {}).map((key, index) => (
                    <th key={index} className="text-left py-2 px-2 text-emerald-400 dark:text-emerald-300">
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
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-colors duration-200 ${
          isUser
            ? 'bg-emerald-100 dark:bg-emerald-900 rounded-tr-sm text-gray-800 dark:text-gray-100'
            : 'bg-gray-100 dark:bg-gray-700 rounded-tl-sm text-gray-800 dark:text-gray-100'
        }`}
      >
        {/* Message Content */}
        <div className={`text-sm md:text-base`}>
          {content}
        </div>

        {/* SQL Query Display */}
        {sql && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.2 }}
            className="mt-3 p-3 bg-gray-800 dark:bg-gray-900 rounded-lg overflow-x-auto"
          >
            <h4 className="text-sm font-medium text-emerald-400 dark:text-emerald-300 mb-2">
              Generated SQL Query:
            </h4>
            <pre className="text-xs md:text-sm text-emerald-400 dark:text-emerald-300 whitespace-pre-wrap font-mono">
              {sql}
            </pre>
          </motion.div>
        )}

        {/* Query Results */}
        {renderResults()}

        {/* Analysis Results for CSV */}
        {type === 'csv_analysis' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.4 }}
            className="mt-3 p-3 bg-blue-900/20 dark:bg-blue-800/20 rounded-lg border border-blue-500/30"
          >
            <h4 className="text-sm font-medium text-blue-400 dark:text-blue-300 mb-2">
              CSV Analysis:
            </h4>
            <p className="text-sm text-blue-300 dark:text-blue-200">
              {content}
            </p>
          </motion.div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className={`text-xs mt-2 ${isUser ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
