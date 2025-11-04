import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardService, type DashboardStats, type ChartData, type RecentActivity, type QuickAction } from '../services/dashboardService';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import PostExpirationMonitor from '../components/PostExpirationMonitor';
import { 
  PersonIcon, 
  FileTextIcon, 
  TokensIcon, 
  CheckCircledIcon,
  ClockIcon,
  BarChartIcon,
  ReloadIcon, 
  PlusIcon,
  ArrowRightIcon,
  CalendarIcon,
  GlobeIcon
} from '@radix-ui/react-icons';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activity'>('overview');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData, activityData] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getChartData(),
        DashboardService.getRecentActivity()
      ]);
      
      setStats(statsData);
      setChartData(chartsData);
      setRecentActivity(activityData);
      setQuickActions(DashboardService.getQuickActions(statsData));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return PersonIcon;
      case 'post_created': return FileTextIcon;
      case 'wallet_recharged': return TokensIcon;
      case 'subscription_created': return CheckCircledIcon;
      case 'cashout_requested': return TokensIcon;
      default: return ClockIcon;
    }
  };

  const getActivityColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      red: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats || !chartData) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ReloadIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'activity', label: 'Recent Activity' }
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(stats.totalUsers)}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    +{stats.newUsersToday} today, +{stats.newUsersThisWeek} this week
                  </p>
                </div>
                <PersonIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Admin earned</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.adminEarnings)}</p>
                
                </div>
                <BarChartIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Posts</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(stats.activePosts)}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    +{stats.postsToday} today, +{stats.postsThisWeek} this week
                  </p>
                </div>
                <FileTextIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Wallet Balance</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(stats.totalWalletBalance)}</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Across {stats.totalWallets} wallets
                  </p>
                </div>
                <TokensIcon className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20`}>
                      <PlusIcon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {action.count !== undefined && (
                      <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {action.count}
                      </span>
                    )}
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubscriptions}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{stats.activeSubscriptions} active</p>
                </div>
                <CheckCircledIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Cashouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingCashouts}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Needs attention</p>
                </div>
                <ClockIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verifiedUsers}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <CheckCircledIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transaction</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageTransactionValue)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{stats.totalTransactions} total</p>
                </div>
                <TokensIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Live Taxi Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🚕</span>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live Taxi Overview</h2>
              </div>
              <button
                onClick={() => navigate('/admin/live-taxi')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">-</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Requests</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">-</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Completed Today</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">-</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Applications</p>
              </div>
            </div>
          </div>

          {/* Post Expiration Monitor */}
          <PostExpirationMonitor />
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={chartData.userGrowth}
              lines={[
                { key: 'users', color: '#3B82F6', name: 'New Users' }
              ]}
              title="User Growth (30 Days)"
            />

            <LineChart
              data={chartData.revenueFlow}
              lines={[
                { key: 'revenue', color: '#10B981', name: 'Revenue' },
                { key: 'cashouts', color: '#EF4444', name: 'Cashouts' },
                { key: 'profit', color: '#8B5CF6', name: 'Admin Profit' }
              ]}
              title="Revenue Flow (30 Days)"
            />

            <PieChart
              data={chartData.postStatusDistribution}
              title="Post Status Distribution"
            />

            <PieChart
              data={chartData.userStatusDistribution}
              title="User Status Distribution"
            />
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={chartData.topCountries.map(country => ({
                label: country.country,
                value: country.users,
                color: '#6366F1'
              }))}
              title="Top Countries by Users"
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Users by Activity</h3>
              <div className="space-y-3">
                {chartData.topUsers.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{user.posts} posts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(user.earnings)} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activity.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.newUsersToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Posts</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.postsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Cashouts</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.pendingCashouts}</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment Methods</span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">{stats.activePaymentMethods} Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User Wallets</span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">{stats.totalWallets} Initialized</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;