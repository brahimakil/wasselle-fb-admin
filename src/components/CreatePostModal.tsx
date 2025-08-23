import React, { useState, useEffect } from 'react';
import { PostService } from '../services/postService';
import { CountryService } from '../services/countryService';
import { VehicleService } from '../services/vehicleService';
import type { CreatePostData } from '../types/post';
import type { User } from '../types/user';
import type { Country, City } from '../types/country';
import type { Vehicle } from '../types/vehicle';
import { Cross2Icon, RocketIcon, PersonIcon, CalendarIcon } from '@radix-ui/react-icons';

interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  users: User[];
  countries: Country[];
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  onClose, 
  onSuccess, 
  adminId,
  users,
  countries
}) => {
  const [formData, setFormData] = useState<CreatePostData>({
    userId: '',
    fromCountryId: '',
    fromCityId: '',
    toCountryId: '',
    toCityId: '',
    vehicleId: '',
    departureDate: '',
    departureTime: '',
    hasReturnTrip: false,  // Add this
    returnDate: '',        // Add this
    returnTime: '',        // Add this
    travelType: 'vehicle',
    cost: 0,
    serviceType: 'delivery',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dynamic data based on selections
  const [fromCities, setFromCities] = useState<City[]>([]);
  const [toCities, setToCities] = useState<City[]>([]);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Load cities when country is selected
  useEffect(() => {
    if (formData.fromCountryId) {
      loadFromCities();
    } else {
      setFromCities([]);
      setFormData(prev => ({ ...prev, fromCityId: '' }));
    }
  }, [formData.fromCountryId]);

  useEffect(() => {
    if (formData.toCountryId) {
      loadToCities();
    } else {
      setToCities([]);
      setFormData(prev => ({ ...prev, toCityId: '' }));
    }
  }, [formData.toCountryId]);

  // Load vehicles when user is selected
  useEffect(() => {
    if (formData.userId && formData.travelType === 'vehicle') {
      loadUserVehicles();
    } else {
      setUserVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.userId, formData.travelType]);

  const loadFromCities = async () => {
    try {
      setLoadingCities(true);
      const cities = await CountryService.getActiveCitiesByCountry(formData.fromCountryId);
      setFromCities(cities);
    } catch (error) {
      console.error('Error loading from cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadToCities = async () => {
    try {
      setLoadingCities(true);
      const cities = await CountryService.getActiveCitiesByCountry(formData.toCountryId);
      setToCities(cities);
    } catch (error) {
      console.error('Error loading to cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadUserVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const vehicles = await VehicleService.getVehicles({ 
        search: '', 
        userId: formData.userId, 
        isActive: true 
      });
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
    if (!formData.userId) {
      setError('Please select a user');
      return;
    }

    if (!formData.fromCountryId || !formData.fromCityId) {
      setError('Please select departure location');
      return;
    }

    if (!formData.toCountryId || !formData.toCityId) {
      setError('Please select destination location');
      return;
    }

    if (formData.travelType === 'vehicle' && !formData.vehicleId) {
      setError('Please select a vehicle for vehicle travel');
      return;
    }

    if (!formData.departureDate || !formData.departureTime) {
      setError('Please select departure date and time');
      return;
    }

    if (formData.cost <= 0) {
      setError('Please enter a valid cost');
      return;
    }

    // Check if departure date is not in the past
    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
    if (departureDateTime < new Date()) {
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
      await PostService.createPost(formData, adminId);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Get selected user's name for display
  const selectedUser = users.find(u => u.id === formData.userId);
  const selectedFromCountry = countries.find(c => c.id === formData.fromCountryId);
  const selectedToCountry = countries.find(c => c.id === formData.toCountryId);
  const selectedFromCity = fromCities.find(c => c.id === formData.fromCityId);
  const selectedToCity = toCities.find(c => c.id === formData.toCityId);
  const selectedVehicle = userVehicles.find(v => v.id === formData.vehicleId);

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <RocketIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Post</h2>
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

          {/* User Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Post Owner</h3>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a user</option>
              {users.filter(u => u.isActive && !u.isBanned).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
            {selectedUser && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedUser.fullName}
              </p>
            )}
          </div>

          {/* Route Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Travel Route</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Location */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">From</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Country</label>
                  <select
                    name="fromCountryId"
                    value={formData.fromCountryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">City</label>
                  <select
                    name="fromCityId"
                    value={formData.fromCityId}
                    onChange={handleInputChange}
                    disabled={!formData.fromCountryId || loadingCities}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    required
                  >
                    <option value="">Select city</option>
                    {fromCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* To Location */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">To</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Country</label>
                  <select
                    name="toCountryId"
                    value={formData.toCountryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">City</label>
                  <select
                    name="toCityId"
                    value={formData.toCityId}
                    onChange={handleInputChange}
                    disabled={!formData.toCountryId || loadingCities}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    required
                  >
                    <option value="">Select city</option>
                    {toCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

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
                  disabled={!formData.userId || loadingVehicles}
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
                {formData.userId && userVehicles.length === 0 && !loadingVehicles && (
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
                  min={today}
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

          {/* Preview */}
          {selectedUser && selectedFromCountry && selectedFromCity && selectedToCountry && selectedToCity && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
              <div className="space-y-2 text-sm">
                <p><strong>User:</strong> {selectedUser.fullName}</p>
                <p><strong>Route:</strong> {selectedFromCity.name}, {selectedFromCountry.name} → {selectedToCity.name}, {selectedToCountry.name}</p>
                <p><strong>Travel:</strong> {formData.travelType === 'vehicle' ? 'Vehicle' : 'Airplane'} {selectedVehicle && `(${selectedVehicle.model})`}</p>
                <p><strong>Departure:</strong> {formData.departureDate} at {formData.departureTime}</p>
                <p><strong>Service:</strong> {formData.serviceType === 'delivery' ? 'Delivery Only' : formData.serviceType === 'taxi' ? 'Taxi Only' : 'Taxi & Delivery'}</p>
                <p><strong>Cost:</strong> {formData.cost} points</p>
                {formData.hasReturnTrip && (
                  <p><strong>Return:</strong> {formData.returnDate} at {formData.returnTime}</p>
                )}
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
              {loading ? 'Creating Post...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
