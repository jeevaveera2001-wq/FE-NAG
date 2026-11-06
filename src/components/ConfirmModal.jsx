import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { LoadingButton } from './loaders';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-charcoal-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${isDanger ? 'text-red-500' : 'text-gold-500'}`} />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{message}</p>

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
          >
            {cancelText}
          </button>
          <LoadingButton
            type="button"
            onClick={onConfirm}
            loading={loading}
            loadingText="Processing..."
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
