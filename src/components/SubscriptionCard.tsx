import React, { useState } from 'react';
import type { PostSubscription } from '../types/post';
import type { User } from '../types/user';
import { 
  PersonIcon,
  RocketIcon,
  CalendarIcon,
  CrossCircledIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon
} from '@radix-ui/react-icons';

interface SubscriptionCardProps {
  subscription: PostSubscription;
  subscriber?: User;
  author?: User;
  onCancel: (subscriptionId: string, reason: string) => Promise<void>;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  subscriber,
  author,
  onCancel
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) return;
    
    try {
      setCancelling(true);
      await onCancel(subscription.id, cancellationReason);
      setShowCancelModal(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Post Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <RocketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Subscription Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {subscription.postTitle}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <PersonIcon className="w-4 h-4 mr-2" />
                      <span>Author: {author?.fullName || subscription.authorName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <PersonIcon className="w-4 h-4 mr-2" />
                      <span>Subscriber: {subscriber?.fullName || subscription.subscriberName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span>Subscribed: {formatDate(subscription.subscribedAt)}</span>
                    </div>
                    {subscription.cancelledAt && (
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        <CrossCircledIcon className="w-4 h-4 mr-2" />
                        <span>Cancelled: {formatDate(subscription.cancelledAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Cost */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {subscription.postCost} pts
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Transaction: {subscription.transactionId.slice(-8)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {subscription.status === 'active' ? (
                        <CheckCircledIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <CrossCircledIcon className="w-3 h-3 mr-1" />
                      )}
                      {subscription.status}
                    </span>

                    {subscription.status === 'active' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {subscription.cancellationReason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">
                    <strong>Cancellation reason:</strong> {subscription.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancel Subscription
                </h3>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to cancel this subscription? 
                  <strong className="text-red-600 dark:text-red-400"> This action cannot be undone and no refund will be issued.</strong>
                </p>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancellationReason.trim() || cancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionCard;