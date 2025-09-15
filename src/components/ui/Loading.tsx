import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'md':
      default:
        return 'w-6 h-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="mb-2"
      >
        <Loader2 className={`${getSizeClasses()} text-indigo-600 dark:text-indigo-400`} />
      </motion.div>
      {text && (
        <p className={`${getTextSize()} text-gray-600 dark:text-gray-400 text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Loading Components
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
}) => {
  return (
    <div
      className={`
        ${width} ${height} ${className}
        bg-gray-200 dark:bg-gray-700 rounded-md
        animate-pulse
      `}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton width="w-10" height="h-10" className="rounded-full" />
          <div className="flex-1">
            <Skeleton width="w-3/4" height="h-4" className="mb-2" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton width="w-full" height="h-3" />
          <Skeleton width="w-5/6" height="h-3" />
          <Skeleton width="w-4/6" height="h-3" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton width="w-20" height="h-6" className="rounded-full" />
          <Skeleton width="w-16" height="h-8" className="rounded" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} width="flex-1" height="h-4" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex space-x-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={colIndex} width="flex-1" height="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Button Loading State
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center
        px-4 py-2 border border-transparent text-sm font-medium rounded-md
        text-white bg-indigo-600 hover:bg-indigo-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute left-3"
        >
          <Loader2 className="w-4 h-4" />
        </motion.div>
      )}
      <span className={loading ? 'ml-6' : ''}>
        {children}
      </span>
    </button>
  );
};

export default Loading;