import React, { useState } from 'react';
import { CountryService } from '../services/countryService';
import type { CreateCountryData } from '../types/country';
import { Cross2Icon, GlobeIcon } from '@radix-ui/react-icons';

interface CreateCountryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
}

const CreateCountryModal: React.FC<CreateCountryModalProps> = ({ 
  onClose, 
  onSuccess, 
  adminId 
}) => {
  const [formData, setFormData] = useState<CreateCountryData>({
    name: '',
    code: '',
    flag: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'code' ? value.toUpperCase() : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name.trim()) {
      setError('Country name is required');
      return;
    }

    if (!formData.code.trim()) {
      setError('Country code is required');
      return;
    }

    if (formData.code.length !== 2) {
      setError('Country code must be exactly 2 characters (e.g., US, FR, JP)');
      return;
    }

    setLoading(true);

    try {
      // Check if country code already exists
      const codeExists = await CountryService.checkCountryCodeExists(formData.code);
      if (codeExists) {
        setError(`Country code "${formData.code}" already exists`);
        setLoading(false);
        return;
      }

      await CountryService.createCountry(formData, adminId);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create country');
    } finally {
      setLoading(false);
    }
  };

  // Common country suggestions
  const commonCountries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
    { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  ];

  const handleCountrySelect = (country: typeof commonCountries[0]) => {
    setFormData({
      name: country.name,
      code: country.code,
      flag: country.flag,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <GlobeIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Country</h2>
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

          {/* Quick Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Select Common Countries
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="flex items-center space-x-2 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>{country.flag}</span>
                  <span className="truncate">{country.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manual Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., United States"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country Code * (2 letters)
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., US"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ISO 3166-1 alpha-2 code (e.g., US, FR, JP)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Flag (Optional)
                </label>
                <input
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleInputChange}
                  placeholder="🇺🇸 (emoji or URL)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can use flag emoji (🇺🇸) or image URL
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {(formData.name || formData.code || formData.flag) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
              <div className="flex items-center space-x-3">
                {formData.flag ? (
                  <span className="text-2xl">{formData.flag}</span>
                ) : (
                  <GlobeIcon className="w-8 h-8 text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formData.name || 'Country Name'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: {formData.code || 'XX'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Creating...' : 'Create Country'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCountryModal;
