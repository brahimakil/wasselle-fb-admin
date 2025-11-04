import React, { useState, useEffect } from 'react';
import { LiveTaxiService } from '../services/liveTaxiService';
import { UserService } from '../services/userService';
import { CountryService } from '../services/countryService';
import type { LiveTaxiPostWithApplications, LiveTaxiFilters, LiveTaxiStats } from '../types/liveTaxi';
import type { User } from '../types/user';
import type { Country } from '../types/country';
import LiveTaxiPostCard from '../components/LiveTaxiPostCard';
import { 
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  ReloadIcon,
  RocketIcon,
  CalendarIcon,
  PersonIcon,
} from '@radix-ui/react-icons';

const LiveTaxi: React.FC = () => {
  const [posts, setPosts] = useState<LiveTaxiPostWithApplications[]>([]);
  const [stats, setStats] = useState<LiveTaxiStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LiveTaxiFilters>({
    search: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedPosts, fetchedStats, fetchedUsers, fetchedCountries] = await Promise.all([
        LiveTaxiService.getLiveTaxiPostsWithApplications(filters),
        LiveTaxiService.getLiveTaxiStats(),
        UserService.getUsers(),
        CountryService.getActiveCountries(),
      ]);
      
      setPosts(fetchedPosts);
      setStats(fetchedStats);
      setUsers(fetchedUsers);
      setCountries(fetchedCountries);
    } catch (error) {
      console.error('Error fetching live taxi data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof LiveTaxiFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🚕</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Taxi Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor and manage live taxi ride requests and driver applications
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <ReloadIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RocketIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTotal}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PersonIcon className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.averagePrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelledTotal}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="waiting">⏳ Waiting</option>
            <option value="accepted">✅ Accepted</option>
            <option value="completed">🏁 Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>

          {/* User Filter */}
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>

          {/* Country Filter */}
          <select
            value={filters.countryId || ''}
            onChange={(e) => handleFilterChange('countryId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>

          {/* Start Date Filter */}
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start Date"
          />

          {/* End Date Filter */}
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Posts List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ReloadIcon className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading live taxi posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🚕</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No live taxi posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {Object.keys(filters).some(key => filters[key as keyof LiveTaxiFilters])
                ? 'Try adjusting your filters'
                : 'Live taxi posts will appear here when users create them'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <strong>{posts.length}</strong> post{posts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map((post) => (
                <LiveTaxiPostCard
                  key={post.id}
                  post={post}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveTaxi;
