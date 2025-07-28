
import React from 'react';
import { motion } from 'framer-motion';

interface AppointmentSkeletonProps {
  count?: number;
}

const AppointmentSkeleton: React.FC<AppointmentSkeletonProps> = ({ count = 3 }) => {
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full relative overflow-hidden">
                <motion.div
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
                />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-700 rounded relative overflow-hidden">
                  <motion.div
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
                  />
                </div>
                <div className="h-3 w-24 bg-gray-700 rounded relative overflow-hidden">
                  <motion.div
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-700 rounded-full relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.6 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-4 w-40 bg-gray-700 rounded relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.8 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
              />
            </div>
            <div className="h-4 w-20 bg-gray-700 rounded relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1.0 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-gray-700 rounded relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
              />
            </div>
            <div className="h-8 w-20 bg-gray-700 rounded relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1.4 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AppointmentSkeleton;
