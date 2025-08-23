import React, { useState, useEffect } from 'react';
import { PostService } from '../services/postService';
import { CountryService } from '../services/countryService';
import { VehicleService } from '../services/vehicleService';
import type { PostWithDetails } from '../types/post';
import type { City, Vehicle } from '../types/country';
import { Cross2Icon, RocketIcon, PersonIcon } from '@radix-ui/react-icons';

interface EditPostModalProps {
  post: PostWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departureDate: post.departureDate,
    departureTime: post.departureTime,
    hasReturnTrip: post.hasReturnTrip,        // Add this
    returnDate: post.returnDate || '',        // Add this
    returnTime: post.returnTime || '',        // Add this
    cost: post.cost,
    serviceType: post.serviceType,
    description: post.description,
    vehicleId: post.vehicle?.id || '',
    travelType: post.travelType,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    if (formData.travelType === 'vehicle') {
      loadUserVehicles();
    }
  }, [formData.travelType]);

  const loadUserVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const vehicles = await VehicleService.getVehicles({ userId: post.userId, isActive: true });
      setUserVehicles(vehicles);
    } catch (error) {
      console.error('Error loading user vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleTravelTypeChange = (travelType: 'vehicle' | 'airplane') => {
    setFormData(prev => ({ 
      ...prev, 
      travelType,
      vehicleId: travelType === 'airplane' ? '' : prev.vehicleId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.departureDate || !formData.departureTime) {
      setError('Please select departure date and time');
      return;
    }

    if (formData.travelType === 'vehicle' && !formData.vehicleId) {
      setError('Please select a vehicle for vehicle travel');
      return;
    }

    if (formData.cost <= 0) {
      setError('Please enter a valid cost');
      return;
    }

    // Check if departure date is not in the past (only if changing to future)
    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
    const originalDateTime = new Date(`${post.departureDate}T${post.departureTime}`);
    
    if (departureDateTime < new Date() && departureDateTime.getTime() !== originalDateTime.getTime()) {
      setError('Departure date and time cannot be in the past');
      return;
    }

    if (formData.hasReturnTrip && (!formData.returnDate || !formData.returnTime)) {
      setError('Please select return date and time for round trip');
      return;
    }

    if (formData.hasReturnTrip) {
      const returnDateTime = new Date(`${formData.returnDate}T${formData.returnTime}`);
      const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
      if (returnDateTime <= departureDateTime) {
        setError('Return date and time must be after departure');
        return;
      }
    }

    setLoading(true);

    try {
      await PostService.updatePost(post.id, formData);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = userVehicles.find(v => v.id === formData.vehicleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <RocketIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Post</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {post.fromCity.name} → {post.toCity.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Travel Type & Vehicle */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Travel Method</h3>
            
            {/* Travel Type Toggle */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => handleTravelTypeChange('vehicle')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  formData.travelType === 'vehicle'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                    : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <PersonIcon className="w-4 h-4" />
                <span>Vehicle</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleTravelTypeChange('airplane')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  formData.travelType === 'airplane'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                    : 'bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <RocketIcon className="w-4 h-4" />
                <span>Airplane</span>
              </button>
            </div>

            {/* Vehicle Selection */}
            {formData.travelType === 'vehicle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  disabled={loadingVehicles}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  required={formData.travelType === 'vehicle'}
                >
                  <option value="">Select vehicle</option>
                  {userVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} ({vehicle.licensePlate})
                    </option>
                  ))}
                </select>
                {userVehicles.length === 0 && !loadingVehicles && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    This user has no active vehicles
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Departure Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Return Trip */}
          <div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="hasReturnTrip"
                checked={formData.hasReturnTrip}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  hasReturnTrip: e.target.checked,
                  returnDate: e.target.checked ? prev.returnDate : '',
                  returnTime: e.target.checked ? prev.returnTime : ''
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Round trip (return journey)
              </label>
            </div>

            {formData.hasReturnTrip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200 dark:border-blue-600">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Date</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleInputChange}
                    min={formData.departureDate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.hasReturnTrip}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Time</label>
                  <input
                    type="time"
                    name="returnTime"
                    value={formData.returnTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.hasReturnTrip}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service & Cost */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="delivery">Delivery Available</option>
                  <option value="taxi">Taxi Available</option>
                  <option value="both">Taxi & Delivery Available</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost (Points) *
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 3"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Amount in points (1 point = $1 USD)
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional details about the trip..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
