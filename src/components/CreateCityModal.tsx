import React, { useState } from 'react';
import { CountryService } from '../services/countryService';
import type { CreateCityData, Country } from '../types/country';
import { Cross2Icon, GlobeIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

interface CreateCityModalProps {
  country: Country;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCityModal: React.FC<CreateCityModalProps> = ({ 
  country, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<CreateCityData>({
    name: '',
    countryId: country.id,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name.trim()) {
      setError('City name is required');
      return;
    }

    setLoading(true);

    try {
      // Check if city name already exists in this country
      const cityExists = await CountryService.checkCityNameExists(country.id, formData.name.trim());
      if (cityExists) {
        setError(`City "${formData.name}" already exists in ${country.name}`);
        setLoading(false);
        return;
      }

      await CountryService.createCity(formData, currentUser?.uid || '');
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create city');
    } finally {
      setLoading(false);
    }
  };

  // Common cities for Lebanon (as an example)
  const commonCities = country.code === 'LB' ? [
    'Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Baalbek', 'Jounieh', 'Zahle', 'Byblos', 'Batroun'
  ] : country.code === 'US' ? [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
  ] : country.code === 'FR' ? [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'
  ] : [];

  const handleCitySelect = (cityName: string) => {
    setFormData(prev => ({ ...prev, name: cityName }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <GlobeIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add City</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {country.flag} {country.name}
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

          {/* Quick Select */}
          {commonCities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Select Common Cities in {country.name}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {commonCities.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleCitySelect(cityName)}
                    className="p-2 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={commonCities.length > 0 ? "border-t border-gray-200 dark:border-gray-700 pt-6" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Beirut, New York, Paris"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
              <div className="flex items-center space-x-3">
                {country.flag && <span className="text-lg">{country.flag}</span>}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formData.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {country.name}
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
              {loading ? 'Creating...' : 'Create City'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCityModal;
