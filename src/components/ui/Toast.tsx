import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        bg-white dark:bg-gray-800 border-l-4 ${getBorderColor()}
        rounded-lg shadow-lg p-4 mb-3 max-w-sm w-full
        border border-gray-200 dark:border-gray-700
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onClose(id)}
            className="
              inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              rounded-md p-1
            "
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const { notifications, deleteNotification } = useAppStore();
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>>([]);

  // Convert notifications to toasts
  useEffect(() => {
    const newToasts = notifications
      .filter(n => !n.read)
      .slice(0, 5) // Limit to 5 toasts
      .map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
      }));
    setToasts(newToasts);
  }, [notifications]);

  const handleClose = (id: string) => {
    deleteNotification(id);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={handleClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { Toast, ToastContainer };
export default ToastContainer;