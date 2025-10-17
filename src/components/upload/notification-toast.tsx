'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, X, XCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationToastProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, default 15000 (15 seconds)
}

export function NotificationToast({
  isVisible,
  onClose,
  type,
  title,
  message,
  duration = 15000,
}: NotificationToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const interval = 50; // Update every 50ms
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(timer);
            // Use setTimeout to avoid calling onClose during render
            setTimeout(() => onClose(), 0);
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isVisible, onClose, duration]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'from-green-500 to-emerald-600',
          progressBg: 'from-green-500 to-emerald-500',
          contentBg: 'bg-green-50 border-green-200',
          textColor: 'text-green-900',
          subTextColor: 'text-green-700',
        };
      case 'error':
        return {
          icon: XCircle,
          iconBg: 'from-red-500 to-red-600',
          progressBg: 'from-red-500 to-red-500',
          contentBg: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          subTextColor: 'text-red-700',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'from-amber-500 to-orange-500',
          progressBg: 'from-amber-500 to-orange-500',
          contentBg: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-900',
          subTextColor: 'text-amber-700',
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'from-blue-500 to-blue-600',
          progressBg: 'from-blue-500 to-blue-500',
          contentBg: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
          subTextColor: 'text-blue-700',
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            x: 100, 
            scale: 0.8,
            rotateY: 90 
          }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotateY: 0 
          }}
          exit={{ 
            opacity: 0, 
            x: 100, 
            scale: 0.8,
            rotateY: -90 
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6 
          }}
          className="fixed top-6 right-6 z-50 max-w-sm w-full md:max-w-md"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-800">
              <motion.div
                className={`h-full bg-gradient-to-r ${styles.progressBg}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className={`w-10 h-10 bg-gradient-to-br ${styles.iconBg} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-gray-900 dark:text-gray-100 text-sm"
                    >
                      {title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line"
                    >
                      {message}
                    </motion.p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
