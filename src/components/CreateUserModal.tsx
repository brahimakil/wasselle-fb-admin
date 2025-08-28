import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { CountryService } from '../services/countryService';
import type { CreateUserData } from '../types/user';
import { Cross2Icon, UploadIcon, PersonIcon } from '@radix-ui/react-icons';
import AutocompleteInput from './AutocompleteInput';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess, adminId }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    countryId: '',
    cityId: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await CountryService.getActiveCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      if (formData.countryId) {
        try {
          const citiesData = await CountryService.getCitiesByCountry(formData.countryId);
          setCities(citiesData);
        } catch (error) {
          console.error('Error loading cities:', error);
        }
      } else {
        setCities([]);
      }
    };
    loadCities();
  }, [formData.countryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'driverLicense' | 'passport' | 'facePhoto') => {
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

  const removeFile = (fieldName: 'driverLicense' | 'passport' | 'facePhoto') => {
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
    if (!formData.email || !formData.password || !formData.fullName || !formData.phoneNumber || 
        !formData.dateOfBirth || !formData.countryId || !formData.cityId) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.driverLicense || !formData.passport || !formData.facePhoto) {
      setError('Please upload all required documents (Driver License, Passport, Face Photo)');
      return;
    }

    setLoading(true);

    try {
      await UserService.createUser(formData, adminId);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h2>
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

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country *
                </label>
                <select
                  name="countryId"
                  value={formData.countryId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, countryId: e.target.value, cityId: '' }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cityId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.countryId}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Driver License */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Driver License *
                </label>
                <FileUpload
                  fieldName="driverLicense"
                  previewUrl={previewUrls.driverLicense}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                />
              </div>

              {/* Passport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passport *
                </label>
                <FileUpload
                  fieldName="passport"
                  previewUrl={previewUrls.passport}
                  onFileChange={handleFileChange}
                  onRemove={removeFile}
                />
              </div>

              {/* Face Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Face Photo *
                </label>
                <FileUpload
                  fieldName="facePhoto"
                  previewUrl={previewUrls.facePhoto}
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  fieldName: 'driverLicense' | 'passport' | 'facePhoto';
  previewUrl?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'driverLicense' | 'passport' | 'facePhoto') => void;
  onRemove: (fieldName: 'driverLicense' | 'passport' | 'facePhoto') => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ fieldName, previewUrl, onFileChange, onRemove }) => {
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

export default CreateUserModal;