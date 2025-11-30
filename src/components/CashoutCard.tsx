import React, { useState } from 'react';
import type { CashoutRequest } from '../types/cashout';
import { CashoutService } from '../services/cashoutService';
import { 
  TokensIcon,  // Use this instead
  PersonIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  Pencil1Icon,
  CardStackIcon
} from '@radix-ui/react-icons';

interface CashoutCardProps {
  cashout: CashoutRequest;
  adminId: string;  // Add this
  onProcess: () => void;
  onUpdate: () => void;
}

const CashoutCard: React.FC<CashoutCardProps> = ({ cashout, adminId, onProcess, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: CashoutRequest['status'], adminNotes?: string) => {
    try {
      setLoading(true);
      await CashoutService.updateCashoutStatus(cashout.id, newStatus, adminId, adminNotes);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating cashout status:', error);
      alert(error.message || 'Failed to update cashout status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (cashout.status) {
      case 'completed':
        return <CheckCircledIcon className="w-5 h-5 text-green-500" />;
      case 'cancelled':
      case 'failed':
        return <CrossCircledIcon className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (cashout.status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow relative">
      {/* NEW Badge for pending cashouts */}
      {cashout.status === 'pending' && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse">
            NEW
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <TokensIcon className="w-6 h-6 text-green-600" />  {/* Use TokensIcon */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ${cashout.finalAmount} USD
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {cashout.id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
              {cashout.status.charAt(0).toUpperCase() + cashout.status.slice(1)}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 mb-3">
          <PersonIcon className="w-4 h-4 text-gray-500" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {cashout.userName}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {cashout.userEmail}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center space-x-2 mb-3">
          <CardStackIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {cashout.paymentMethodName}
          </span>
        </div>

        {/* Amount Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Requested:</span>
              <span className="font-medium">{cashout.requestedAmount} pts (${cashout.requestedAmount})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fee ({cashout.feePercentage}%):</span>
              <span className="font-medium text-red-600">-${cashout.feeAmount}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">User Receives:</span>
                <span className="font-bold text-green-600">${cashout.finalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction ID */}
        {cashout.externalTransactionId && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Transaction ID:</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {cashout.externalTransactionId}
            </p>
          </div>
        )}

        {/* Notes */}
        {cashout.notes && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Notes:</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {cashout.notes}
            </p>
          </div>
        )}

        {/* Admin Notes */}
        {cashout.adminNotes && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Admin Notes:</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {cashout.adminNotes}
            </p>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-3 h-3" />
            <span>Created: {formatDate(cashout.createdAt)}</span>
          </div>
          {cashout.processedAt && (
            <div className="flex items-center space-x-1">
              <CheckCircledIcon className="w-3 h-3" />
              <span>Processed: {formatDate(cashout.processedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {cashout.status === 'pending' && (
              <>
                <button
                  onClick={onProcess}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled', 'Cancelled by admin from pending status')}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {cashout.status === 'processing' && (
              <button
                onClick={onProcess}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
              >
                Complete
              </button>
            )}

            {cashout.status === 'completed' && (
              <button
                onClick={() => {
                  if (confirm('Cancel this completed cashout? This will refund the points back to the user. This action cannot be undone.')) {
                    handleStatusChange('cancelled', 'Cancelled by admin - points refunded to user');
                  }
                }}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 transition-colors"
              >
                Cancel & Refund
              </button>
            )}
          </div>

          {cashout.status === 'completed' && !loading && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircledIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Completed</span>
            </div>
          )}

          {cashout.status === 'cancelled' && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <CrossCircledIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Cancelled</span>
            </div>
          )}
        </div>

        {/* Status transition warning for completed cashouts */}
        {cashout.status === 'completed' && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Cancelling will refund {cashout.requestedAmount} points to user
          </div>
        )}
      </div>
    </div>
  );
};

export default CashoutCard;
