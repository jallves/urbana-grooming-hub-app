
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';

interface ActionFeedbackProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}

const ActionFeedback: React.FC<ActionFeedbackProps> = ({ 
  status, 
  message, 
  className = '' 
}) => {
  const variants = {
    idle: { opacity: 0, scale: 0.8 },
    loading: { opacity: 1, scale: 1 },
    success: { opacity: 1, scale: 1 },
    error: { opacity: 1, scale: 1 }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  if (status === 'idle') return null;

  return (
    <motion.div
      variants={variants}
      initial="idle"
      animate={status}
      exit="idle"
      transition={{ duration: 0.3 }}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getColor()} ${className}`}
    >
      {getIcon()}
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </motion.div>
  );
};

export default ActionFeedback;
