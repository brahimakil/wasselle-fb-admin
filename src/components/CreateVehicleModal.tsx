import React, { useState, useEffect } from 'react';
import { VehicleService } from '../services/vehicleService';
import { BlacklistService } from '../services/blacklistService';
import type { CreateVehicleData } from '../types/vehicle';
import type { User } from '../types/user';
import { Cross2Icon, UploadIcon } from '@radix-ui/react-icons';
import AutocompleteInput from './AutocompleteInput';

interface CreateVehicleModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  users: User[];
  preSelectedUserId?: string;
}

const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({ 
  onClose, 
  onSuccess, 
  adminId, 
  users,
  preSelectedUserId 
}) => {
  const [formData, setFormData] = useState<CreateVehicleData & { userId: string }>({
    userId: preSelectedUserId || '',
    model: '',
    color: '',
    numberOfSeats: 4,
    licensePlate: '',
    frontPhoto: null as any,
    backPhoto: null as any,
    papersPhoto: null as any,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (formData.userId) {
      checkVehicleCount();
    }
  }, [formData.userId]);

  const loadSuggestions = async () => {
    try {
      const [models, colors] = await Promise.all([
        VehicleService.getUniqueModels(),
        VehicleService.getUniqueColors()
      ]);
      setModelSuggestions(models);
      setColorSuggestions(colors);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const checkVehicleCount = async () => {
    try {
      const count = await VehicleService.getUserVehicleCount(formData.userId);
      setVehicleCount(count);
    } catch (error) {
      console.error('Error checking vehicle count:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'numberOfSeats' ? parseInt(value) : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'frontPhoto' | 'backPhoto' | 'papersPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fieldName]: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls(prev => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fieldName: 'frontPhoto' | 'backPhoto' | 'papersPhoto') => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[fieldName];
      return newData;
    });
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[fieldName];
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.userId) {
      setError('Please select a user');
      return;
    }

    if (!formData.model || !formData.color || !formData.licensePlate) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.frontPhoto || !formData.backPhoto || !formData.papersPhoto) {
      setError('Please upload all required photos (Front, Back, Papers)');
      return;
    }

    // Check vehicle limit
    if (vehicleCount >= 5) {
      setError('This user has reached the maximum limit of 5 vehicles');
      return;
    }

    setLoading(true);

    try {
      // Check if license plate is blacklisted
      const isBlacklisted = await BlacklistService.isBlacklisted(formData.licensePlate);
      if (isBlacklisted) {
        const blacklistEntry = await BlacklistService.getBlacklistEntry(formData.licensePlate);
        setError(`⚠️ This license plate is BLACKLISTED. Reason: ${blacklistEntry?.reason || 'No reason provided'}`);
        setLoading(false);
        return;
      }

      const { userId, ...vehicleData } = formData;
      await VehicleService.createVehicle(vehicleData, userId, adminId);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === formData.userId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Vehicle</h2>
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

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle Owner *
            </label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
            {selectedUser && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Current vehicles: {vehicleCount}/5
                </span>
                {vehicleCount >= 5 && (
                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                    (Limit reached)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model *
                </label>
                <AutocompleteInput
                  value={formData.model}
                  onChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                  suggestions={modelSuggestions}
                  placeholder="e.g., Toyota Camry, BMW X5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  name="model"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color *
                </label>
                <AutocompleteInput
                  value={formData.color}
                  onChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                  suggestions={colorSuggestions}
                  placeholder="e.g., Black, White, Red"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  name="color"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Seats *
                </label>
                <select
                  name="numberOfSeats"
                  value={formData.numberOfSeats}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={2}>2 Seats</option>
                  <option value={4}>4 Seats</option>
                  <option value={5}>5 Seats</option>
                  <option value={7}>7 Seats</option>
                  <option value={8}>8+ Seats</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC-123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Photos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vehicle Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Front Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Front View *
                </label>
                <VehicleFileUpload
                  fieldName="frontPhoto"
                  previewUrl={previewUrls.frontPhoto}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                />
              </div>

              {/* Back Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Back View *
                </label>
                <VehicleFileUpload
                  fieldName="backPhoto"
                  previewUrl={previewUrls.backPhoto}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                />
              </div>

              {/* Papers Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Papers *
                </label>
                <VehicleFileUpload
                  fieldName="papersPhoto"
                  previewUrl={previewUrls.papersPhoto}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                />
              </div>
            </div>
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
              disabled={loading || (formData.userId && vehicleCount >= 5)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Vehicle...' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Vehicle File Upload Component
interface VehicleFileUploadProps {
  fieldName: 'frontPhoto' | 'backPhoto' | 'papersPhoto';
  previewUrl?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'frontPhoto' | 'backPhoto' | 'papersPhoto') => void;
  onRemove: (fieldName: 'frontPhoto' | 'backPhoto' | 'papersPhoto') => void;
}

const VehicleFileUpload: React.FC<VehicleFileUploadProps> = ({ fieldName, previewUrl, onFileChange, onRemove }) => {
  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => onRemove(fieldName)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Cross2Icon className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <div className="text-center">
            <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Image
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG up to 10MB
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e, fieldName)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

export default CreateVehicleModal;
