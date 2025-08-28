import React, { useState, useEffect } from 'react';
import { PostService } from '../services/postService';
import { UserService } from '../services/userService';
import { CountryService } from '../services/countryService';
import type { PostWithDetails, PostFilters } from '../types/post';
import type { User, Country } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import ViewPostModal from '../components/ViewPostModal';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  ReloadIcon,
  RocketIcon,
  CalendarIcon,
  PersonIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons';

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState<PostFilters>({
    search: '',
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchCountries();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await PostService.getPostsWithDetails(filters);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
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

  const fetchCountries = async () => {
    try {
      const fetchedCountries = await CountryService.getActiveCountries();
      setCountries(fetchedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleCreatePost = () => {
    setShowCreateModal(false);
    fetchPosts();
  };

  const handlePostUpdate = () => {
    fetchPosts();
  };

  const handleFilterChange = (key: keyof PostFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
    });
  };

  // Stats calculations
  const activePostsCount = posts.filter(p => p.status === 'active' || p.status === 'subscribed').length;
  const completedPostsCount = posts.filter(p => p.status === 'completed').length;
  const todayPostsCount = posts.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.departureDate === today && (p.status === 'active' || p.status === 'subscribed');
    return p.departureDate === today && p.isActive;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <RocketIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage travel posts, deliveries, and taxi services
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RocketIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activePostsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayPostsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedPostsCount}</p>
            </div>
          </div>
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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

          {/* Gender Filter */}
          <select
            value={filters.userGender || ''}
            onChange={(e) => handleFilterChange('userGender', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Genders</option>
            <option value="male">♂ Male Users</option>
            <option value="female">♀ Female Users</option>
          </select>

          {/* From Country Filter */}
          <select
            value={filters.fromCountryId || ''}
            onChange={(e) => handleFilterChange('fromCountryId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">From Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>

          {/* To Country Filter */}
          <select
            value={filters.toCountryId || ''}
            onChange={(e) => handleFilterChange('toCountryId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">To Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>

          {/* Travel Type Filter */}
          <select
            value={filters.travelType || ''}
            onChange={(e) => handleFilterChange('travelType', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Travel Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="airplane">Airplane</option>
          </select>

          {/* Service Type Filter */}
          <select
            value={filters.serviceType || ''}
            onChange={(e) => handleFilterChange('serviceType', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Services</option>
            <option value="delivery">Delivery Only</option>
            <option value="taxi">Taxi Only</option>
            <option value="both">Taxi & Delivery</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Posts ({posts.length})
          </h2>
          <button
            onClick={fetchPosts}
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
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <RocketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No posts found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
              >
                Create your first post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreatePost}
          adminId={currentUser?.uid || ''}
          users={users}
          countries={countries}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <ViewPostModal
          post={posts.find(p => p.id === showViewModal) || null}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
};

export default Posts;
