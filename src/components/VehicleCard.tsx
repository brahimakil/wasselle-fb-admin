import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types/vehicle';
import { VehicleService } from '../services/vehicleService';
import { BlacklistService } from '../services/blacklistService';
import EditVehicleModal from './EditVehicleModal';
import { 
  EyeOpenIcon,
  EyeClosedIcon,
  TrashIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

interface VehicleCardProps {
  vehicle: Vehicle;
  userName: string;
  userEmail: string;
  onUpdate: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, userName, userEmail, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    checkBlacklist();
  }, [vehicle.licensePlate]);

  const checkBlacklist = async () => {
    if (vehicle.licensePlate) {
      const blacklisted = await BlacklistService.isBlacklisted(vehicle.licensePlate);
      setIsBlacklisted(blacklisted);
      if (blacklisted) {
        const entry = await BlacklistService.getBlacklistEntry(vehicle.licensePlate);
        setBlacklistReason(entry?.reason || 'No reason provided');
      }
    }
  };

  const handleStatusUpdate = async (isActive: boolean) => {
    try {
      setLoading(true);
      await VehicleService.updateVehicleStatus(vehicle.id, isActive, currentAdmin?.uid || '');
      onUpdate();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await VehicleService.deleteVehicle(vehicle.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {vehicle.model}
              </h3>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                {vehicle.licensePlate}
              </span>
            </div>
            
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userEmail}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{vehicle.color}</span>
              <span>•</span>
              <span>{vehicle.numberOfSeats} seats</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end space-y-2">
            {isBlacklisted && (
              <div className="flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold" title={`Blacklisted: ${blacklistReason}`}>
                <CrossCircledIcon className="w-3 h-3" />
                <span>BLACKLISTED</span>
              </div>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              vehicle.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {vehicle.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Created Date */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Created: {formatDate(vehicle.createdAt)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
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
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusUpdate(!vehicle.isActive)}
              disabled={loading}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                vehicle.isActive
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
              }`}
            >
              {vehicle.isActive ? 'Deactivate' : 'Activate'}
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              disabled={loading}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
            >
              Edit
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
              title="Delete vehicle"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Vehicle Photos</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Front Photo */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Front View</label>
              <div className="relative">
                <img
                  src={vehicle.frontPhotoUrl}
                  alt="Vehicle front"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => window.open(vehicle.frontPhotoUrl, '_blank')}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center"
                >
                  <EyeOpenIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Back Photo */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Back View</label>
              <div className="relative">
                <img
                  src={vehicle.backPhotoUrl}
                  alt="Vehicle back"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => window.open(vehicle.backPhotoUrl, '_blank')}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center"
                >
                  <EyeOpenIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Papers Photo */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vehicle Papers</label>
              <div className="relative">
                <img
                  src={vehicle.papersPhotoUrl}
                  alt="Vehicle papers"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => window.open(vehicle.papersPhotoUrl, '_blank')}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center"
                >
                  <EyeOpenIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(vehicle.updatedAt)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditVehicleModal
          vehicle={vehicle}
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

export default VehicleCard;
