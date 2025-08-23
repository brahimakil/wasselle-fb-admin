import React from 'react';
import type { PostWithDetails } from '../types/post';
import { Cross2Icon, RocketIcon, PersonIcon, CalendarIcon, ClockIcon, GlobeIcon } from '@radix-ui/react-icons';

interface ViewPostModalProps {
  post: PostWithDetails;
  onClose: () => void;
}

const ViewPostModal: React.FC<ViewPostModalProps> = ({ post, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
    if (post.isCompleted) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    if (!post.isActive) return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };

  const getStatusLabel = () => {
    if (post.isCompleted) return 'Completed';
    if (!post.isActive) return 'Cancelled';
    return 'Active';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {post.travelType === 'airplane' ? (
              <RocketIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <PersonIcon className="w-5 h-5 text-green-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {post.fromCity.name} → {post.toCity.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {post.fromCountry.flag} {post.fromCountry.name} → {post.toCountry.flag} {post.toCountry.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Cross2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Trip Owner</h3>
            <div className="flex items-center space-x-3">
              <PersonIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{post.user.fullName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{post.user.email}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                  post.user.gender === 'male' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
                }`}>
                  {post.user.gender === 'male' ? '♂ Male' : '♀ Female'}
                </span>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Trip Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Departure:</strong> {formatDate(post.departureDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Time:</strong> {formatTime(post.departureTime)}
                  </span>
                </div>
                {post.hasReturnTrip && (
                  <>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Return:</strong> {formatDate(post.returnDate!)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Return Time:</strong> {formatTime(post.returnTime!)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Travel Method:</strong> {post.travelType === 'vehicle' ? 'Vehicle' : 'Airplane'}
                  </span>
                </div>
                {post.vehicle && (
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Vehicle:</strong> {post.vehicle.model} ({post.vehicle.licensePlate})
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Service:</strong> {getServiceTypeLabel(post.serviceType)}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {post.cost} pts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {post.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Description</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">{post.description}</p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created on {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPostModal;
