import React, { useState, useEffect } from 'react';
import { CashoutService } from '../services/cashoutService';
import type { CashoutRequest } from '../types/cashout';
import { Cross2Icon, CheckCircledIcon } from '@radix-ui/react-icons';

interface ProcessCashoutModalProps {
  cashout: CashoutRequest;
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
}

const ProcessCashoutModal: React.FC<ProcessCashoutModalProps> = ({
  cashout,
  onClose,
  onSuccess,
  adminId
}) => {
  const [externalTransactionId, setExternalTransactionId] = useState(cashout.externalTransactionId || '');
  const [adminNotes, setAdminNotes] = useState(cashout.adminNotes || cashout.notes || '');
  const [loading, setLoading] = useState(false);
  const [checkingTransaction, setCheckingTransaction] = useState(false);
  const [error, setError] = useState('');
  const [transactionIdStatus, setTransactionIdStatus] = useState<'checking' | 'valid' | 'duplicate' | null>(null);

  // Check transaction ID when it changes
  useEffect(() => {
    const checkTransactionId = async () => {
      if (!externalTransactionId.trim()) {
        setTransactionIdStatus(null);
        return;
      }

      // Skip checking if it's the same as the existing transaction ID
      if (externalTransactionId.trim() === cashout.externalTransactionId) {
        setTransactionIdStatus('valid');
        return;
      }

      setTransactionIdStatus('checking');
      setCheckingTransaction(true);

      try {
        // Use the new method that excludes the current cashout
        const isUsed = await CashoutService.isTransactionIdUsedByOthers(
          externalTransactionId.trim(), 
          cashout.id  // Exclude current cashout from the check
        );
        setTransactionIdStatus(isUsed ? 'duplicate' : 'valid');
      } catch (error) {
        console.error('Error checking transaction ID:', error);
        setTransactionIdStatus(null);
      } finally {
        setCheckingTransaction(false);
      }
    };

    const timeoutId = setTimeout(checkTransactionId, 500);
    return () => clearTimeout(timeoutId);
  }, [externalTransactionId, cashout.externalTransactionId, cashout.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!externalTransactionId.trim()) {
      setError('Transaction ID is required to process the cashout');
      return;
    }

    // Only check for duplicates if it's different from the existing transaction ID
    if (externalTransactionId.trim() !== cashout.externalTransactionId && transactionIdStatus === 'duplicate') {
      setError('This transaction ID has already been used');
      return;
    }

    setLoading(true);

    try {
      await CashoutService.processCashout(
        cashout.id,
        externalTransactionId.trim(),
        adminId,
        adminNotes.trim() || ''
      );
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to process cashout');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIdStatusColor = () => {
    switch (transactionIdStatus) {
      case 'valid': return 'text-green-600 dark:text-green-400';
      case 'duplicate': return 'text-red-600 dark:text-red-400';
      case 'checking': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getTransactionIdStatusText = () => {
    switch (transactionIdStatus) {
      case 'valid': return '✓ Transaction ID is available';
      case 'duplicate': return '✗ Transaction ID already used';
      case 'checking': return '⏳ Checking transaction ID...';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Process Cashout</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cashout Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cashout Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">User:</span>
                <span className="font-medium">{cashout.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="font-medium">{cashout.paymentMethodName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                <span className="font-medium">{cashout.requestedAmount} pts (${cashout.requestedAmount})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fee ({cashout.feePercentage}%):</span>
                <span className="font-medium text-red-600">-${cashout.feeAmount}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">User Receives:</span>
                  <span className="font-bold text-green-600">${cashout.finalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Enhanced Transaction ID section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transaction ID *
              </label>
              
              {/* Show existing transaction ID if present */}
              {cashout.externalTransactionId && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Current:</strong> {cashout.externalTransactionId}
                  </p>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  value={externalTransactionId}
                  onChange={(e) => setExternalTransactionId(e.target.value)}
                  placeholder="Enter or update transaction ID"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    transactionIdStatus === 'duplicate' 
                      ? 'border-red-300 dark:border-red-600' 
                      : transactionIdStatus === 'valid'
                      ? 'border-green-300 dark:border-green-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {checkingTransaction && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {transactionIdStatus && (
                <p className={`text-xs mt-1 ${getTransactionIdStatusColor()}`}>
                  {getTransactionIdStatusText()}
                </p>
              )}
            </div>

            {/* Enhanced Admin Notes section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              
              {/* Show existing notes if present */}
              {(cashout.notes || cashout.adminNotes) && (
                <div className="mb-2 space-y-1">
                  {cashout.notes && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Original notes:</strong> {cashout.notes}
                      </p>
                    </div>
                  )}
                  {cashout.adminNotes && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Previous admin notes:</strong> {cashout.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add or update notes about processing this cashout..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircledIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Processing Confirmation
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This will deduct {cashout.requestedAmount} points from the user's wallet and mark the cashout as completed. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || transactionIdStatus === 'duplicate' || checkingTransaction}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Process Cashout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcessCashoutModal;
