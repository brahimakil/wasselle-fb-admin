import React, { useState } from 'react';
import type { City, Country } from '../types/country';
import { CountryService } from '../services/countryService';
import EditCityModal from './EditCityModal';
import { 
  TrashIcon,
  Pencil1Icon
} from '@radix-ui/react-icons';

interface CityCardProps {
  city: City;
  country: Country;
  onUpdate: () => void;
}

const CityCard: React.FC<CityCardProps> = ({ city, country, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleStatusUpdate = async (isActive: boolean) => {
    try {
      setLoading(true);
      await CountryService.updateCityStatus(city.id, isActive);
      onUpdate();
    } catch (error) {
      console.error('Error updating city status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${city.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await CountryService.deleteCity(city.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting city:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center space-x-3">
        <div>
          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
            {city.name}
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {country.name}
          </p>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded-full ${
          city.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {city.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleStatusUpdate(!city.isActive)}
          disabled={loading}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            city.isActive
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {city.isActive ? 'Deactivate' : 'Activate'}
        </button>

        <button
          onClick={() => setShowEditModal(true)}
          disabled={loading}
          className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 transition-colors"
          title="Edit city"
        >
          <Pencil1Icon className="w-3 h-3" />
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
          title="Delete city"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCityModal
          city={city}
          country={country}
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

export default CityCard;
