import React, { useState } from 'react';
import type { Country, City } from '../types/country';
import { CountryService } from '../services/countryService';
import EditCountryModal from './EditCountryModal';
import CreateCityModal from './CreateCityModal';
import CityCard from './CityCard';
import { 
  GlobeIcon,
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@radix-ui/react-icons';

interface CountryCardProps {
  country: Country;
  onUpdate: () => void;
}

const CountryCard: React.FC<CountryCardProps> = ({ country, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateCityModal, setShowCreateCityModal] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const handleStatusUpdate = async (isActive: boolean) => {
    try {
      setLoading(true);
      await CountryService.updateCountryStatus(country.id, isActive);
      onUpdate();
    } catch (error) {
      console.error('Error updating country status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${country.name}" and all its cities? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await CountryService.deleteCountry(country.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting country:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    if (cities.length > 0) return; // Already loaded

    try {
      setCitiesLoading(true);
      const fetchedCities = await CountryService.getCitiesByCountry(country.id);
      setCities(fetchedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setCitiesLoading(false);
    }
  };

  const toggleCities = () => {
    if (!showCities) {
      loadCities();
    }
    setShowCities(!showCities);
  };

  const handleCityUpdate = () => {
    loadCities(); // Reload cities
  };

  const handleCreateCity = () => {
    setShowCreateCityModal(false);
    loadCities(); // Reload cities
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {country.flag ? (
              <span className="text-2xl">{country.flag}</span>
            ) : (
              <GlobeIcon className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {country.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code: {country.code}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`text-xs px-2 py-1 rounded-full ${
            country.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {country.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Created Date */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Created: {formatDate(country.createdAt)}
        </div>

        {/* Cities Toggle */}
        <div className="mb-4">
          <button
            onClick={toggleCities}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {showCities ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
            <span>Cities ({cities.length})</span>
          </button>
        </div>

        {/* Cities List */}
        {showCities && (
          <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cities</h4>
              <button
                onClick={() => setShowCreateCityModal(true)}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <PlusIcon className="w-3 h-3" />
                <span>Add City</span>
              </button>
            </div>

            {citiesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                No cities yet
              </div>
            ) : (
              <div className="space-y-2">
                {cities.map((city) => (
                  <CityCard
                    key={city.id}
                    city={city}
                    country={country}
                    onUpdate={handleCityUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleStatusUpdate(!country.isActive)}
            disabled={loading}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              country.isActive
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
            }`}
          >
            {country.isActive ? 'Deactivate' : 'Activate'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
              title="Edit country"
            >
              <Pencil1Icon className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
              title="Delete country"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Country Modal */}
      {showEditModal && (
        <EditCountryModal
          country={country}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Create City Modal */}
      {showCreateCityModal && (
        <CreateCityModal
          country={country}
          onClose={() => setShowCreateCityModal(false)}
          onSuccess={handleCreateCity}
        />
      )}
    </div>
  );
};

export default CountryCard;
