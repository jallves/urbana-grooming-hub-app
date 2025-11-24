import React from 'react';
import { motion } from 'framer-motion';

const BarberScheduleSkeleton: React.FC = () => {
  return (
    <div className="w-full px-4 space-y-6">
      {/* Toggle Skeleton */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="bg-gray-900 border border-gray-700 rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-700 rounded w-64"></div>
          </div>
          <div className="h-6 w-12 bg-gray-700 rounded-full"></div>
        </div>
      </motion.div>

      {/* Main Card Skeleton */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="h-7 bg-gray-700 rounded w-64"></div>
          <div className="h-4 bg-gray-700 rounded w-80"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 bg-gray-700/50 p-1 rounded-lg">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-600/50 rounded"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                repeatType: 'reverse',
                delay: i * 0.05 
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-5 bg-gray-700 rounded w-24"></div>
                  <div className="h-5 bg-gray-700 rounded w-20"></div>
                  <div className="h-5 bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-9 w-20 bg-gray-700 rounded"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarberScheduleSkeleton;
