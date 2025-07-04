
import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'form';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1 }) => {
  const shimmer = {
    initial: { backgroundPosition: '-200px 0' },
    animate: { backgroundPosition: '200px 0' },
  };

  const SkeletonCard = () => (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
      <motion.div
        className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"
        style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-3/4"
        style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.2 }}
      />
      <motion.div
        className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-1/2"
        style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.4 }}
      />
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full"
            style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
            initial={shimmer.initial}
            animate={shimmer.animate}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
          />
          <div className="flex-1 space-y-2">
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"
              style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
              initial={shimmer.initial}
              animate={shimmer.animate}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
            />
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded w-2/3"
              style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
              initial={shimmer.initial}
              animate={shimmer.animate}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 + 0.2 }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return <SkeletonList />;
      case 'form':
        return (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-10 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"
                style={{ backgroundSize: '200px 100%', backgroundRepeat: 'no-repeat' }}
                initial={shimmer.initial}
                animate={shimmer.animate}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
              />
            ))}
          </div>
        );
      default:
        return (
          <div className="grid gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
