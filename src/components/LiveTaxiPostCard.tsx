import React, { useState } from 'react';
import type { LiveTaxiPostWithApplications } from '../types/liveTaxi';
import { LiveTaxiService } from '../services/liveTaxiService';
import ViewLiveTaxiModal from './ViewLiveTaxiModal';
import ViewApplicationsModal from './ViewApplicationsModal';
import { 
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  RocketIcon,
  Cross1Icon,
  EyeOpenIcon,
  CounterClockwiseClockIcon
} from '@radix-ui/react-icons';

interface LiveTaxiPostCardProps {
  post: LiveTaxiPostWithApplications;
  onUpdate: () => void;
}

const LiveTaxiPostCard: React.FC<LiveTaxiPostCardProps> = ({ post, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Cancel this live taxi post? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await LiveTaxiService.cancelLiveTaxiPost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Error cancelling live taxi post:', error);
      alert('Failed to cancel post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const isExpired = new Date(post.expiresAt) < new Date();

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {post.fromCityName} → {post.toCityName}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                {post.status.toUpperCase()}
              </span>
              {isExpired && post.status === 'waiting' && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  EXPIRED
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Post ID: {post.id.substring(0, 8)}...
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {post.offerPrice} pts
            </p>
          </div>
        </div>

        {/* Creator Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <PersonIcon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Creator: <strong>{post.userName}</strong>
            </span>
          </div>
          
          {post.contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">📞</span>
              <span className="text-gray-700 dark:text-gray-300">
                {post.contactPhone}
              </span>
            </div>
          )}

          {post.acceptedDriverName && (
            <div className="flex items-center gap-2 text-sm">
              <RocketIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Driver: <strong>{post.acceptedDriverName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Created</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Expires</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatTime(post.expiresAt)}
              </p>
            </div>
          </div>
        </div>

        {post.completedAt && (
          <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
            <p className="text-green-700 dark:text-green-400">
              Completed on {formatDate(post.completedAt)} at {formatTime(post.completedAt)}
            </p>
          </div>
        )}

        {/* Applications Count */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Driver Applications
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {post.applicationsCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowViewModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <EyeOpenIcon className="w-4 h-4" />
            View Details
          </button>

          {post.applicationsCount > 0 && (
            <button
              onClick={() => setShowApplicationsModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CounterClockwiseClockIcon className="w-4 h-4" />
              Applications ({post.applicationsCount})
            </button>
          )}

          {(post.status === 'waiting' || post.status === 'accepted') && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cross1Icon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showViewModal && (
        <ViewLiveTaxiModal
          post={post}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showApplicationsModal && (
        <ViewApplicationsModal
          postId={post.id}
          onClose={() => setShowApplicationsModal(false)}
        />
      )}
    </>
  );
};

export default LiveTaxiPostCard;
