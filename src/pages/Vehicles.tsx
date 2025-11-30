import React, { useState, useEffect } from 'react';
import { VehicleService } from '../services/vehicleService';
import { UserService } from '../services/userService';
import type { Vehicle, VehicleFilters } from '../types/vehicle';
import type { User } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import CreateVehicleModal from '../components/CreateVehicleModal';
import VehicleCard from '../components/VehicleCard';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  MixerHorizontalIcon,  // Change from FilterIcon
  ReloadIcon
} from '@radix-ui/react-icons';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [filters, setFilters] = useState<VehicleFilters>({
    search: '',
  });
  const [models, setModels] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchVehicles();
    fetchUsers();
    fetchModels();
    fetchColors();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const fetchedVehicles = await VehicleService.getVehicles(filters);
      setVehicles(fetchedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await UserService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const fetchedModels = await VehicleService.getUniqueModels();
      setModels(fetchedModels);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchColors = async () => {
    try {
      const fetchedColors = await VehicleService.getUniqueColors();
      setColors(fetchedColors);
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const handleCreateVehicle = () => {
    setShowCreateModal(false);
    setSelectedUserId('');
    fetchVehicles();
    fetchModels();
    fetchColors();
  };

  const handleVehicleUpdate = () => {
    fetchVehicles();
  };

  const handleFilterChange = (key: keyof VehicleFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.fullName : 'Unknown User';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'No email';
  };

  // Filter vehicles including user email and name in search
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const user = users.find(u => u.id === vehicle.userId);
    const userName = user?.fullName?.toLowerCase() || '';
    const userEmail = user?.email?.toLowerCase() || '';
    
    return (
      vehicle.model.toLowerCase().includes(searchTerm) ||
      vehicle.color.toLowerCase().includes(searchTerm) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm) ||
      userName.includes(searchTerm) ||
      userEmail.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicles Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user vehicles and registrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <MixerHorizontalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* User Filter */}
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </select>

          {/* Model Filter */}
          <select
            value={filters.model || ''}
            onChange={(e) => handleFilterChange('model', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>

          {/* Seats Filter */}
          <select
            value={filters.numberOfSeats || ''}
            onChange={(e) => handleFilterChange('numberOfSeats', e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Seats</option>
            <option value="2">2 Seats</option>
            <option value="4">4 Seats</option>
            <option value="5">5 Seats</option>
            <option value="7">7 Seats</option>
            <option value="8">8+ Seats</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="false">🔴 NEW (Pending Approval)</option>
            <option value="true">✅ Approved</option>
          </select>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vehicles ({filteredVehicles.length}{vehicles.length !== filteredVehicles.length ? ` of ${vehicles.length}` : ''})
          </h2>
          <button
            onClick={fetchVehicles}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <ReloadIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading vehicles...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {vehicles.length === 0 ? 'No vehicles found' : 'No vehicles match your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  userName={getUserName(vehicle.userId)}
                  userEmail={getUserEmail(vehicle.userId)}
                  onUpdate={handleVehicleUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Vehicle Modal */}
      {showCreateModal && (
        <CreateVehicleModal
          onClose={() => {
            setShowCreateModal(false);
            setSelectedUserId('');
          }}
          onSuccess={handleCreateVehicle}
          adminId={currentUser?.uid || ''}
          users={users}
          preSelectedUserId={selectedUserId}
        />
      )}
    </div>
  );
};

export default Vehicles;
