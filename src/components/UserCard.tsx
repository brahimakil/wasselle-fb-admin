import React, { useState } from 'react';
import type { User } from '../types/user';
import { UserService } from '../services/userService';
import { 
  CheckCircledIcon, 
  CrossCircledIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  PersonIcon,
  CalendarIcon,
  EnvelopeClosedIcon,
  MobileIcon,
  HomeIcon,
  GlobeIcon,
  Cross1Icon
} from '@radix-ui/react-icons';
import EditUserModal from './EditUserModal';
import UserCancellationStats from './UserCancellationStats';
import { useAuth } from '../contexts/AuthContext';

interface UserCardProps {
  user: User;
  onUpdate: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const { user: currentAdmin } = useAuth();

  const handleStatusUpdate = async (updates: Partial<Pick<User, 'isActive' | 'isVerified' | 'isBanned'>>) => {
    try {
      setLoading(true);
      const adminId = currentAdmin?.uid || '';
      
      // Handle different types of updates with notifications
      if ('isActive' in updates) {
        await UserService.updateUserStatus(user.id, updates.isActive!, adminId);
      } else if ('isVerified' in updates) {
        await UserService.updateUserVerification(user.id, updates.isVerified!, adminId);
      } else if ('isBanned' in updates) {
        if (updates.isBanned) {
          // For banning, we need a reason - for now use a default
          await UserService.banUser(user.id, 'Banned by admin', adminId);
        } else {
          // For unbanning, use the general update method
          await UserService.updateUser(user.id, updates);
        }
      } else {
        // For other updates, use the general method
        await UserService.updateUser(user.id, updates);
      }
      
      onUpdate();
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (isActive: boolean, isVerified: boolean, isBanned: boolean) => {
    if (isBanned) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (!isActive) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    if (isVerified) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean, isBanned: boolean) => {
    if (isBanned) return 'Banned';
    if (!isActive) return 'Inactive';
    if (isVerified) return 'Active & Verified';
    return 'Active & Unverified';
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* User Avatar */}
          <div className="relative">
            {user.facePhotoUrl ? (
              <img
                src={user.facePhotoUrl}
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <PersonIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            {user.liveLocation && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" title="Live location available"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.fullName}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive, user.isVerified, user.isBanned)}`}>
                {getStatusText(user.isActive, user.isVerified, user.isBanned)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <EnvelopeClosedIcon className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MobileIcon className="w-4 h-4" />
                <span>{user.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <HomeIcon className="w-4 h-4" />
                <span>{user.placeOfLiving}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Born {user.dateOfBirth}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-full">
                  {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not specified'}
                </span>
              </div>
            </div>

            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {user.driverLicenseUrl && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Driver License</label>
                      <img 
                        src={user.driverLicenseUrl} 
                        alt="Driver License" 
                        className="mt-1 w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setSelectedImage({ url: user.driverLicenseUrl!, title: 'Driver License' })}
                      />
                    </div>
                  )}
                  {user.passportUrl && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Passport</label>
                      <img 
                        src={user.passportUrl} 
                        alt="Passport" 
                        className="mt-1 w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setSelectedImage({ url: user.passportUrl!, title: 'Passport' })}
                      />
                    </div>
                  )}
                  {user.facePhotoUrl && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Face Photo</label>
                      <img 
                        src={user.facePhotoUrl} 
                        alt="Face Photo" 
                        className="mt-1 w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setSelectedImage({ url: user.facePhotoUrl!, title: 'Face Photo' })}
                      />
                    </div>
                  )}
                  {user.idSelfieUrl && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Selfie 🆕</label>
                      <img 
                        src={user.idSelfieUrl} 
                        alt="ID Selfie" 
                        className="mt-1 w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border-2 border-blue-500" 
                        onClick={() => setSelectedImage({ url: user.idSelfieUrl!, title: 'ID Selfie Verification' })}
                      />
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Created: {formatDate(user.createdAt)}</p>
                  <p>Last Updated: {formatDate(user.updatedAt)}</p>
                  {user.liveLocation && (
                    <p>Live Location: {user.liveLocation.latitude.toFixed(6)}, {user.liveLocation.longitude.toFixed(6)}</p>
                  )}
                </div>

                {/* Ban Information */}
                {user.isBanned && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h5 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Ban Information</h5>
                    <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <p><strong>Reason:</strong> {user.banReason || 'No reason specified'}</p>
                      {user.banDate && (
                        <p><strong>Banned on:</strong> {formatDate(user.banDate)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancellation Stats */}
                <div className="mb-4">
                  <UserCancellationStats userId={user.id} userName={user.fullName} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? (
              <EyeClosedIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <EyeOpenIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {!user.isBanned && (
            <button
              onClick={() => handleStatusUpdate({ isActive: !user.isActive })}
              disabled={loading}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                user.isActive
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
              }`}
              title={user.isActive ? 'Deactivate' : 'Activate'}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}

          <button
            onClick={() => handleStatusUpdate({ isVerified: !user.isVerified })}
            disabled={loading || user.isBanned}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              user.isVerified
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
            }`}
            title={user.isVerified ? 'Remove verification' : 'Verify user'}
          >
            {user.isVerified ? 'Unverify' : 'Verify'}
          </button>

          <button
            onClick={() => handleStatusUpdate({ isBanned: !user.isBanned })}
            disabled={loading}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              user.isBanned
                ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
            }`}
            title={user.isBanned ? 'Unban user' : 'Ban user'}
          >
            {user.isBanned ? 'Unban' : 'Ban'}
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            disabled={loading}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            Edit
          </button>

          <button
            onClick={async () => {
              if (confirm(`Reset password for ${user.fullName}?\n\nThe password will be reset to: APPLE1515`)) {
                try {
                  setLoading(true);
                  await UserService.resetUserPassword(user.id, user.email, 'APPLE1515', currentAdmin?.uid || '');
                  alert(`Password reset successfully!\n\nUser: ${user.fullName}\nEmail: ${user.email}\nNew Password: APPLE1515`);
                  onUpdate();
                } catch (error: any) {
                  alert(`Error: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }
            }}
            disabled={loading}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition-colors"
            title="Reset user password"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditUserModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Image Modal Viewer */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <Cross1Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </button>
            <div className="text-center mb-2">
              <h3 className="text-xl font-semibold text-white">{selectedImage.title}</h3>
            </div>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
