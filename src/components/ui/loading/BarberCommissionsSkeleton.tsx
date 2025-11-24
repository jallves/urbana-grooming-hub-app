import React from 'react';
import { motion } from 'framer-motion';

const BarberCommissionsSkeleton: React.FC = () => {
  return (
    <div className="w-full px-4 space-y-4 sm:space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-700 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="h-8 bg-gray-700 rounded w-24"></div>
              <div className="h-3 bg-gray-700 rounded w-28"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Commissions List Skeleton */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 bg-gray-700 rounded w-48 mb-2"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                repeatType: 'reverse',
                delay: i * 0.1 
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-700 rounded"></div>
                    <div className="h-5 bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-40"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-700 rounded w-24"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarberCommissionsSkeleton;
