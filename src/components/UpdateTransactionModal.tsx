import React, { useState } from 'react';
import { WalletService } from '../services/walletService';
import type { Transaction } from '../types/wallet';
import { Cross2Icon, TokensIcon } from '@radix-ui/react-icons';

interface UpdateTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateTransactionModal: React.FC<UpdateTransactionModalProps> = ({
  transaction,
  onClose,
  onSuccess
}) => {
  const [status, setStatus] = useState<'successful' | 'cancelled'>(
    transaction.status === 'pending' ? 'successful' : transaction.status as 'successful' | 'cancelled'
  );
  const [amount, setAmount] = useState<number>(transaction.metadata?.originalAmount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const originalAmount = transaction.metadata?.originalAmount || 0;
  const isRechargeTransaction = transaction.type === 'recharge';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate amount for recharge transactions
    if (isRechargeTransaction && amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      await WalletService.updateTransactionStatus(transaction.id, status, amount);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Update Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Transaction Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{transaction.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {transaction.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {originalAmount} pts
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 capitalize">
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Amount Input - Only for recharge transactions */}
          {isRechargeTransaction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                step="1"
                placeholder={`Original: ${originalAmount}`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Adjust the amount if user paid differently than requested
              </p>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'successful' | 'cancelled')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="successful">✅ Successful</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
            {status === 'successful' && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ {isRechargeTransaction ? amount : originalAmount} points will be added to user's wallet
              </p>
            )}
            {status === 'cancelled' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                ✗ No points will be added, transaction will be marked as cancelled
              </p>
            )}
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTransactionModal;
