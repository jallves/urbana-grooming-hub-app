
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: string;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStep, 
  className = '' 
}) => {
  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <Circle className="h-4 w-4 text-red-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepColor = (step: Step) => {
    switch (step.status) {
      case 'loading':
        return 'border-blue-500 bg-blue-500/10';
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start space-x-3"
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
            {getStepIcon(step)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${
              step.status === 'completed' ? 'text-green-400' :
              step.status === 'loading' ? 'text-blue-400' :
              step.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {step.title}
            </h3>
            
            {step.description && (
              <p className="text-xs text-gray-500 mt-1">
                {step.description}
              </p>
            )}
          </div>
          
          {step.status === 'loading' && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ProgressIndicator;
