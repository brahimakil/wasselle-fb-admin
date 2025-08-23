import React, { useState } from 'react';
import type { PostWithDetails } from '../types/post';
import { PostService } from '../services/postService';
import EditPostModal from './EditPostModal';
import ViewPostModal from './ViewPostModal';
import { 
  RocketIcon,
  TrashIcon,
  Pencil1Icon,
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  GlobeIcon,
  Cross1Icon,
  CheckIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons';

interface PostCardProps {
  post: PostWithDetails;
  onUpdate: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await PostService.updatePostStatus(post.id, newStatus);
      onUpdate();
    } catch (error) {
      console.error('Error updating post status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this post as completed? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await PostService.completePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Error completing post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this post? This will count towards the user\'s monthly cancellation limit.')) {
      return;
    }

    try {
      setLoading(true);
      await PostService.cancelPost(post.id, post.userId);
      onUpdate();
    } catch (error) {
      console.error('Error cancelling post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await PostService.deletePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:mm
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'delivery': return 'Delivery Only';
      case 'taxi': return 'Taxi Only';
      case 'both': return 'Taxi & Delivery';
      default: return serviceType;
    }
  };

  const getStatusColor = () => {
    if (post.status === 'completed') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    if (post.status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    if (post.status === 'subscribed') return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };

  const getStatusLabel = () => {
    if (post.status === 'cancelled') return 'Cancelled';
    if (post.status === 'completed') return 'Completed';
    if (post.status === 'subscribed') return 'Subscribed';
    return 'Active';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {post.travelType === 'airplane' ? (
              <RocketIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <PersonIcon className="w-5 h-5 text-green-600" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {post.fromCity.name} → {post.toCity.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {post.fromCountry.flag} {post.fromCountry.name} → {post.toCountry.flag} {post.toCountry.name}
              </p>
            </div>
          </div>

          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 mb-3">
          <PersonIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{post.user.fullName}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            post.user.gender === 'male' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
          }`}>
            {post.user.gender === 'male' ? '♂ Male' : '♀ Female'}
          </span>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDate(post.departureDate)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatTime(post.departureTime)}
            </span>
          </div>
        </div>

        {/* Return Trip */}
        {post.hasReturnTrip && post.returnDate && post.returnTime && (
          <div className="mb-3 pl-4 border-l-2 border-blue-200 dark:border-blue-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Return: {formatDate(post.returnDate)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatTime(post.returnTime)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Info */}
        {post.vehicle && (
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <PersonIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {post.vehicle.model} ({post.vehicle.licensePlate})
              </span>
            </div>
          </div>
        )}

        {/* Service Type & Cost */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
            {getServiceTypeLabel(post.serviceType)}
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {post.cost} pts
          </span>
        </div>

        {/* Description */}
        {post.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.description}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {post.status === 'active' && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition-colors"
              >
                Complete
              </button>
            )}

            {post.status === 'active' && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 transition-colors"
              >
                Cancel
              </button>
            )}

            {post.status === 'cancelled' && (
              <button
                onClick={() => handleStatusUpdate('active')}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition-colors"
              >
                Reactivate
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowViewModal(true)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
              title="View post details"
            >
              <EyeOpenIcon className="w-4 h-4" />
            </button>

            {post.status === 'active' && (
              <button
                onClick={() => setShowEditModal(true)}
                disabled={loading}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                title="Edit post"
              >
                <Pencil1Icon className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
              title="Delete post"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <ViewPostModal
          post={post}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
