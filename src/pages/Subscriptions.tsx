import React, { useState, useEffect } from 'react';
import { SubscriptionService } from '../services/subscriptionService';
import { UserService } from '../services/userService';
import { WalletService } from '../services/walletService';
import { NotificationService } from '../services/notificationService';
import { PostService } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import type { PostSubscription, SubscriptionFilters } from '../types/post';
import type { User } from '../types/user';
import type { Post } from '../types/post';
import type { UserWallet } from '../types/wallet';
import type { Notification } from '../types/notification';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionStatsCards from '../components/SubscriptionStatsCards';
import CreateSubscriptionModal from '../components/CreateSubscriptionModal';
import { 
  MagnifyingGlassIcon,
  Cross2Icon,
  ReloadIcon,
  RocketIcon,
  PlusIcon
} from '@radix-ui/react-icons';

const Subscriptions: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState<PostSubscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'active' | 'cancelled'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscriptionsData, usersData, postsData, statsData] = await Promise.all([
        SubscriptionService.getAllSubscriptions({
          ...filters,
          status: activeTab === 'active' ? 'active' : activeTab === 'cancelled' ? 'cancelled' : undefined
        }),
        UserService.getUsers(),
        PostService.getPosts(), // This will use the original method with optional filters
        SubscriptionService.getSubscriptionStats()
      ]);

      setSubscriptions(subscriptionsData);
      setUsers(usersData);
      setPosts(postsData);
      setStats(statsData);
      
      // Add debugging
      console.log('Fetched posts:', postsData);
      console.log('Posts with cost > 0:', postsData.filter(p => p.cost > 0));
      console.log('Active posts:', postsData.filter(p => p.status === 'active'));
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  const handleFilterChange = (key: keyof SubscriptionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCancelSubscription = async (subscriptionId: string, reason: string) => {
    try {
      await SubscriptionService.cancelSubscription(subscriptionId, reason);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post Subscriptions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage post subscriptions and monitor revenue
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Subscription
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ReloadIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && <SubscriptionStatsCards stats={stats} />}

      {/* Tabs and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', count: stats?.totalSubscriptions || 0 },
              { id: 'all', label: 'All Subscriptions', count: subscriptions.length },
              { id: 'active', label: 'Active', count: stats?.activeSubscriptions || 0 },
              { id: 'cancelled', label: 'Cancelled', count: stats?.cancelledSubscriptions || 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Subscriptions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Subscriptions</h3>
                  <div className="space-y-3">
                    {subscriptions.slice(0, 5).map((subscription) => (
                      <div key={subscription.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {subscription.postTitle}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              by {subscription.authorName} → {subscription.subscriberName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                              {subscription.postCost} pts
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {subscription.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Authors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Authors</h3>
                  <div className="space-y-3">
                    {/* Calculate top authors by earnings */}
                    {Object.entries(
                      subscriptions.reduce((acc, sub) => {
                        acc[sub.authorId] = (acc[sub.authorId] || 0) + sub.postCost;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([authorId, earnings]) => {
                        const author = getUserById(authorId);
                        return (
                          <div key={authorId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {author?.fullName || 'Unknown Author'}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {author?.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                                {earnings} pts
                              </p>
                              <p className="text-xs text-gray-500">Total earned</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'active' || activeTab === 'cancelled') && (
            <div>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subscriptions..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <select
                  value={filters.subscriberId || ''}
                  onChange={(e) => handleFilterChange('subscriberId', e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Subscribers</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.authorId || ''}
                  onChange={(e) => handleFilterChange('authorId', e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Authors</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subscriptions List */}
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <RocketIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subscriptions</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No subscriptions found matching your criteria.
                    </p>
                  </div>
                ) : (
                  subscriptions.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      subscriber={getUserById(subscription.subscriberId)}
                      author={getUserById(subscription.authorId)}
                      onCancel={handleCancelSubscription}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <CreateSubscriptionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          adminId={currentAdmin?.uid || ''}
          posts={posts}
          users={users}
        />
      )}
    </div>
  );
};

export default Subscriptions;
