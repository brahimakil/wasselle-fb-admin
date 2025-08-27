import React, { useState, useEffect } from 'react';
import { CashoutService } from '../services/cashoutService';
import { WalletService } from '../services/walletService';
import type { User } from '../types/user';
import type { PaymentMethod } from '../types/paymentMethod';
import type { UserWallet } from '../types/wallet';
import { Cross2Icon, GearIcon, TokensIcon } from '@radix-ui/react-icons';

interface CreateCashoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
  paymentMethods: PaymentMethod[];
  adminId: string;
}

const CreateCashoutModal: React.FC<CreateCashoutModalProps> = ({
  onClose,
  onSuccess,
  users,
  paymentMethods,
  adminId
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [requestedPoints, setRequestedPoints] = useState('');
  const [feePercentage, setFeePercentage] = useState('5'); // Default 5%
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [externalTransactionId, setExternalTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingTransaction, setCheckingTransaction] = useState(false);
  const [error, setError] = useState('');
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [transactionIdStatus, setTransactionIdStatus] = useState<'checking' | 'valid' | 'duplicate' | null>(null);
  const [initialStatus, setInitialStatus] = useState<'pending' | 'completed'>('pending');

  const selectedUser = users.find(user => user.id === selectedUserId);
  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethodId);

  // Calculate amounts with live updates
  const pointsNum = parseFloat(requestedPoints) || 0;
  const feePercentageNum = parseFloat(feePercentage) || 0;
  const calculatedAmounts = CashoutService.calculateCashoutAmounts(pointsNum, feePercentageNum);

  // Load user wallet when user is selected
  useEffect(() => {
    const loadUserWallet = async () => {
      if (selectedUserId) {
        try {
          const wallet = await WalletService.getUserWallet(selectedUserId);
          setUserWallet(wallet);
        } catch (error) {
          console.error('Error loading user wallet:', error);
          setUserWallet(null);
        }
      } else {
        setUserWallet(null);
      }
    };

    loadUserWallet();
  }, [selectedUserId]);

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
        const isUsed = await CashoutService.isTransactionIdUsed(externalTransactionId.trim());
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
  }, [externalTransactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId || !requestedPoints || !feePercentage || !paymentMethodId) {
      setError('Please fill in all required fields');
      return;
    }

    // Add balance validation
    if (!userWallet || userWallet.balance === 0) {
      setError('Selected user has no balance available for cashout');
      return;
    }

    const pointsToRequest = parseFloat(requestedPoints);
    if (isNaN(pointsToRequest) || pointsToRequest <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (userWallet.balance < pointsToRequest) {
      setError('User has insufficient balance for this cashout');
      return;
    }

    const feePercent = parseFloat(feePercentage);
    if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      setError('Please enter a valid fee percentage (0-100)');
      return;
    }

    // Validate transaction ID for completed status
    if (initialStatus === 'completed') {
      if (!externalTransactionId.trim()) {
        setError('Transaction ID is required for completed status');
        return;
      }
      
      if (transactionIdStatus === 'duplicate') {
        setError('This transaction ID has already been used');
        return;
      }
    }

    setLoading(true);

    try {
      await CashoutService.createCashoutRequest(
        {
          userId: selectedUserId,
          requestedAmount: pointsToRequest,
          feePercentage: feePercent,
          paymentMethodId,
          notes: notes.trim() || undefined,
          externalTransactionId: externalTransactionId.trim() || undefined,
          initialStatus  // Add this new field
        },
        adminId,
        selectedUser!.fullName,
        selectedUser!.email,
        selectedPaymentMethod!.name
      );

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create cashout request');
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Cashout Request</h2>
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
                  {user.fullName} ({user.email}) - {user.phoneNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Status *
            </label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as 'pending' | 'completed')}
              disabled={!userWallet || userWallet.balance === 0}
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !userWallet || userWallet.balance === 0 
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="pending">Pending (No points deducted yet)</option>
              <option value="completed">Completed (Deduct points immediately)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {initialStatus === 'pending' 
                ? 'Points will be deducted when status is changed to completed'
                : 'Points will be deducted immediately upon creation'
              }
            </p>
          </div>

          {/* Enhanced User Info Display */}
          {selectedUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Selected User: {selectedUser.fullName}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Email: {selectedUser.email}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Phone: {selectedUser.phoneNumber}
                  </p>
                </div>
                {userWallet && (
                  <div className="border-t border-blue-200 dark:border-blue-600 pt-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Current Balance: {userWallet.balance} points (${userWallet.balance} USD)
                    </p>
                    {userWallet.balance === 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        ⚠️ User has no balance available for cashout
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Updated Requested Amount with disable logic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount to Cash Out (Points) *
            </label>
            <div className="relative">
              <TokensIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={requestedPoints}
                onChange={(e) => setRequestedPoints(e.target.value)}
                placeholder="0"
                min="1"
                max={userWallet?.balance || undefined}
                step="1"
                disabled={!userWallet || userWallet.balance === 0}  // Disable if no wallet or balance is 0
                className={`w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !userWallet || userWallet.balance === 0 
                    ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                required
              />
            </div>
            {userWallet && userWallet.balance === 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Cannot create cashout request - user has zero balance
              </p>
            )}
          </div>

          {/* Updated Fee Percentage with disable logic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fee Percentage (%) *
            </label>
            <div className="relative">
              <GearIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
                step="0.1"
                disabled={!userWallet || userWallet.balance === 0}  // Disable if no wallet or balance is 0
                className={`w-full pl-10 pr-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !userWallet || userWallet.balance === 0 
                    ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                required
              />
            </div>
          </div>

          {/* Live Calculator */}
          {pointsNum > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cashout Calculation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Requested Amount:</span>
                  <span className="font-medium">{pointsNum} points (${calculatedAmounts.requestedDollars})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee ({feePercentageNum}%):</span>
                  <span className="font-medium text-red-600">-${calculatedAmounts.feeAmount}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">User Receives:</span>
                    <span className="font-bold text-green-600">${calculatedAmounts.finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method with disable logic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              disabled={!userWallet || userWallet.balance === 0}  // Disable if no wallet or balance is 0
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !userWallet || userWallet.balance === 0 
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">Choose payment method...</option>
              {paymentMethods.filter(method => method.isActive).map((method) => (
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

          {/* Transaction ID with disable logic */}
          {initialStatus === 'completed' && (
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
                  disabled={!userWallet || userWallet.balance === 0}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    transactionIdStatus === 'duplicate' 
                      ? 'border-red-300 dark:border-red-600' 
                      : transactionIdStatus === 'valid'
                      ? 'border-green-300 dark:border-green-600'
                      : !userWallet || userWallet.balance === 0
                      ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                  required={initialStatus === 'completed'}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required for completed status - confirms payment has been processed
              </p>
            </div>
          )}

          {initialStatus === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transaction ID (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={externalTransactionId}
                  onChange={(e) => setExternalTransactionId(e.target.value)}
                  placeholder="Leave empty for pending status"
                  disabled={!userWallet || userWallet.balance === 0}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !userWallet || userWallet.balance === 0
                    ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Can be added later when processing the cashout
              </p>
            </div>
          )}

          {/* Notes with disable logic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this cashout..."
              rows={3}
              disabled={!userWallet || userWallet.balance === 0}  // Disable if no wallet or balance is 0
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !userWallet || userWallet.balance === 0 
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>

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
              disabled={
                loading || 
                (initialStatus === 'completed' && !externalTransactionId) || 
                (initialStatus === 'completed' && transactionIdStatus === 'duplicate') || 
                checkingTransaction ||
                !userWallet || 
                userWallet.balance === 0  // Disable if balance is 0
              }
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Cashout Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCashoutModal;