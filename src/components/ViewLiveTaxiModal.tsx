import React from 'react';
import type { LiveTaxiPost } from '../types/liveTaxi';
import { Cross2Icon, CalendarIcon, ClockIcon, PersonIcon } from '@radix-ui/react-icons';

interface ViewLiveTaxiModalProps {
  post: LiveTaxiPost;
  onClose: () => void;
}

const ViewLiveTaxiModal: React.FC<ViewLiveTaxiModalProps> = ({ post, onClose }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Live Taxi Post Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Post ID & Status */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Post ID</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">{post.id}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(post.status)}`}>
              {post.status.toUpperCase()}
            </span>
          </div>

          {/* Route */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{post.fromCityName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{post.fromCountryName}</p>
              </div>
              <div className="text-2xl">→</div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{post.toCityName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{post.toCountryName}</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Offer Price</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{post.offerPrice} points</p>
          </div>

          {/* Creator Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Creator Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <PersonIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">{post.userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">🆔</span>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">{post.userId}</p>
                </div>
              </div>
              {post.userPhone && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">📞</span>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{post.userPhone}</p>
                  </div>
                </div>
              )}
              {post.contactPhone && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">📱</span>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact Phone</p>
                    <p className="text-gray-900 dark:text-white">{post.contactPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver Information (if accepted) */}
          {post.acceptedDriverId && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accepted Driver</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <PersonIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{post.acceptedDriverName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">🆔</span>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Driver ID</p>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{post.acceptedDriverId}</p>
                  </div>
                </div>
                {post.acceptedApplicationId && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">📋</span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Application ID</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{post.acceptedApplicationId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(post.createdAt)} at {formatTime(post.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expires</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(post.expiresAt)} at {formatTime(post.expiresAt)}
                  </p>
                </div>
              </div>
              {post.acceptedAt && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">✅</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(post.acceptedAt)} at {formatTime(post.acceptedAt)}
                    </p>
                  </div>
                </div>
              )}
              {post.completedAt && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">🏁</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(post.completedAt)} at {formatTime(post.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLiveTaxiModal;
