import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    info: 'bg-blue-50 border-blue-100',
    error: 'bg-red-50 border-red-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-8 right-8 z-[100] flex items-center space-x-3 px-6 py-4 rounded-2xl border shadow-xl ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="font-bold text-zinc-900">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
        <X className="h-4 w-4 text-zinc-400" />
      </button>
    </motion.div>
  );
};

export default Toast;
