import React from 'react';
import { motion } from 'framer-motion';

const LoadingDots = () => {
  return (
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
};

export default LoadingDots;
