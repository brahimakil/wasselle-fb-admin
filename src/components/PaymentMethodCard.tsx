import React, { useState } from 'react';
import type { PaymentMethod } from '../types/paymentMethod';
import { PaymentMethodService } from '../services/paymentMethodService';
import EditPaymentMethodModal from './EditPaymentMethodModal';
import {
  CardStackIcon,
  PersonIcon,
  MobileIcon,
  Pencil1Icon,
  TrashIcon,
  EyeOpenIcon,
  EyeClosedIcon
} from '@radix-ui/react-icons';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onUpdate: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      await PaymentMethodService.togglePaymentMethodStatus(method.id);
      onUpdate();
    } catch (error) {
      console.error('Error toggling payment method status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await PaymentMethodService.deletePaymentMethod(method.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CardStackIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {method.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created {formatDate(method.createdAt)}
              </p>
            </div>
          </div>
          
          <span className={`text-xs px-2 py-1 rounded-full ${
            method.isActive 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {method.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Method Details */}
        <div className="space-y-2">
          {method.phoneNumber && (
            <div className="flex items-center space-x-2">
              <MobileIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {method.phoneNumber}
              </span>
            </div>
          )}
          
          {method.accountName && (
            <div className="flex items-center space-x-2">
              <PersonIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {method.accountName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleStatus}
              disabled={loading}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                method.isActive
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
              }`}
            >
              {method.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
              title="Edit payment method"
            >
              <Pencil1Icon className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
              title="Delete payment method"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPaymentMethodModal
          method={method}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default PaymentMethodCard;
