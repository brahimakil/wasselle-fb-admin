import React, { useState, useEffect } from 'react';
import { BlacklistService, BlacklistedPlate } from '../services/blacklistService';
import { VehicleService } from '../services/vehicleService';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  TrashIcon,
  ReloadIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons';
import type { Vehicle } from '../types/vehicle';

const Blacklist: React.FC = () => {
  const [blacklistedPlates, setBlacklistedPlates] = useState<BlacklistedPlate[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlate, setNewPlate] = useState({
    licensePlate: '',
    reason: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blacklistedData, vehiclesData] = await Promise.all([
        BlacklistService.getAllBlacklisted(),
        VehicleService.getVehicles()
      ]);
      setBlacklistedPlates(blacklistedData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToBlacklist = async () => {
    if (!newPlate.licensePlate.trim()) {
      alert('Please enter a license plate');
      return;
    }

    try {
      await BlacklistService.addToBlacklist(
        newPlate.licensePlate,
        user?.uid || '',
        newPlate.reason
      );
      setShowAddModal(false);
      setNewPlate({ licensePlate: '', reason: '' });
      fetchData();
      alert('License plate added to blacklist successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to add to blacklist');
    }
  };

  const handleRemoveFromBlacklist = async (licensePlate: string) => {
    if (!confirm(`Remove ${licensePlate} from blacklist?`)) return;

    try {
      await BlacklistService.removeFromBlacklist(licensePlate);
      fetchData();
      alert('License plate removed from blacklist');
    } catch (error) {
      alert('Failed to remove from blacklist');
    }
  };

  const getVehiclesWithPlate = (licensePlate: string): Vehicle[] => {
    return vehicles.filter(v => 
      v.licensePlate?.toUpperCase() === licensePlate.toUpperCase()
    );
  };

  const filteredPlates = blacklistedPlates.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.licensePlate.toLowerCase().includes(searchLower) ||
      entry.reason?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blacklisted License Plates</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage blocked license plates ({blacklistedPlates.length} total)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <ReloadIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add to Blacklist</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by license plate or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Blacklisted Plates List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                License Plate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Blacklisted At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Affected Vehicles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPlates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No blacklisted plates found matching your search' : 'No blacklisted plates yet'}
                </td>
              </tr>
            ) : (
              filteredPlates.map((entry) => {
                const affectedVehicles = getVehiclesWithPlate(entry.licensePlate);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CrossCircledIcon className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.licensePlate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {entry.reason || 'No reason provided'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.blacklistedAt.toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {affectedVehicles.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {affectedVehicles.map(vehicle => (
                            <span key={vehicle.id} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveFromBlacklist(entry.licensePlate)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove from blacklist"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add to Blacklist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add License Plate to Blacklist
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  value={newPlate.licensePlate}
                  onChange={(e) => setNewPlate(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={newPlate.reason}
                  onChange={(e) => setNewPlate(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Reason for blacklisting..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPlate({ licensePlate: '', reason: '' });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToBlacklist}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Add to Blacklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blacklist;
