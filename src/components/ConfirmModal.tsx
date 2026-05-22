import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-black/5"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div className="flex items-center space-x-2">
                {type === 'danger' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
              </div>
              <button onClick={onCancel} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-8">
              <p className="text-zinc-600 leading-relaxed mb-8">{message}</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${
                    type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                      : 'bg-zinc-900 hover:bg-zinc-800 shadow-zinc-100'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
