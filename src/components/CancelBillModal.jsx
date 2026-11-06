import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LoadingButton } from './loaders';

export const CancelBillModal = ({ isOpen, onClose, onConfirm, billNumber, loading = false }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific reason for cancellation.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Cancel Bill #{billNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Cancelling this bill will restore any deducted product stock and mark the invoice as cancelled with an immutable audit trail.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Mandatory Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="e.g., Customer requested rescheduling, accidental duplicate entry, wrong service billed..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
            >
              Close
            </button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Cancelling..."
              variant="danger"
              size="sm"
            >
              Confirm Cancellation
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelBillModal;
