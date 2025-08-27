import React, { useState, useEffect } from 'react';
import { WalletService } from '../services/walletService';
import { PaymentMethodService } from '../services/paymentMethodService';
import type { User } from '../types/user';
import type { PaymentMethod } from '../types/paymentMethod';
import { Cross2Icon, TokensIcon, CardStackIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface RechargeWalletModalProps {
  userId?: string;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
}

const RechargeWalletModal: React.FC<RechargeWalletModalProps> = ({
  userId,
  users,
  onClose,
  onSuccess,
  adminId
}) => {
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [externalTransactionId, setExternalTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingTransaction, setCheckingTransaction] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactionIdStatus, setTransactionIdStatus] = useState<'checking' | 'valid' | 'duplicate' | null>(null);

  const selectedUser = users.find(user => user.id === selectedUserId);
  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethodId);

  // Calculate dollar equivalent
  const dollarAmount = amount ? parseFloat(amount) : 0;

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await PaymentMethodService.getPaymentMethods();
        setPaymentMethods(methods.filter(method => method.isActive));
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }
    };

    loadPaymentMethods();
  }, []);

  // Check transaction ID when it changes
  useEffect(() => {
    const checkTransactionId = async () => {
      if (!externalTransactionId.trim()) {
        setTransactionIdStatus(null);
        return;
      }

      setTransactionIdStatus('checking');
      setCheckingTransaction(true);

      try {
        const isUsed = await WalletService.isTransactionIdUsed(externalTransactionId.trim());
        setTransactionIdStatus(isUsed ? 'duplicate' : 'valid');
      } catch (error) {
        console.error('Error checking transaction ID:', error);
        setTransactionIdStatus(null);
      } finally {
        setCheckingTransaction(false);
      }
    };

    const timeoutId = setTimeout(checkTransactionId, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [externalTransactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId || !amount || !description || !paymentMethodId) {
      setError('Please fill in all required fields');
      return;
    }

    if (!externalTransactionId.trim()) {
      setError('Transaction ID is required for wallet recharge');
      return;
    }

    if (transactionIdStatus === 'duplicate') {
      setError('This transaction ID has already been used');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await WalletService.rechargeWallet(
        selectedUserId,
        amountNum,
        description,
        adminId,
        paymentMethodId,
        externalTransactionId.trim() // This becomes the primary transaction ID
      );
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to recharge wallet');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recharge Wallet</h2>
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

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select User *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose payment method...</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                  {method.phoneNumber && ` (${method.phoneNumber})`}
                  {method.accountName && ` (${method.accountName})`}
                </option>
              ))}
            </select>
            {paymentMethods.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                No active payment methods found. Please add a payment method first.
              </p>
            )}
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transaction ID *
            </label>
            <div className="relative">
              <input
                type="text"
                value={externalTransactionId}
                onChange={(e) => setExternalTransactionId(e.target.value)}
                placeholder="Enter transaction ID from payment provider"
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

          {/* Amount with Live Calculator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (Points) *
            </label>
            <div className="relative">
              <TokensIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {/* Live Calculator */}
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Dollar Equivalent:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  ${dollarAmount.toFixed(2)} USD
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                1 point = $1 USD
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Admin wallet recharge via Whish Money"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Recharging wallet for:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {selectedUser.fullName} ({selectedUser.email})
              </p>
            </div>
          )}

          {/* Selected Payment Method Info */}
          {selectedPaymentMethod && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Payment Method: {selectedPaymentMethod.name}
              </p>
              {selectedPaymentMethod.phoneNumber && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Phone: {selectedPaymentMethod.phoneNumber}
                </p>
              )}
              {selectedPaymentMethod.accountName && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Account: {selectedPaymentMethod.accountName}
                </p>
              )}
            </div>
          )}

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
              {loading ? 'Processing...' : 'Recharge Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RechargeWalletModal;