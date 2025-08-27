import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserService } from './userService';
import { PostService } from './postService';
import { WalletService } from './walletService';
import { CashoutService } from './cashoutService';
import { SubscriptionService } from './subscriptionService';
import { PaymentMethodService } from './paymentMethodService';

export interface DashboardStats {
  // User Stats
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  
  // Post Stats
  totalPosts: number;
  activePosts: number;
  completedPosts: number;
  cancelledPosts: number;
  subscribedPosts: number;
  postsToday: number;
  postsThisWeek: number;
  
  // Financial Stats
  totalRevenue: number;
  totalCashedOut: number;
  adminEarnings: number;
  pendingCashouts: number;
  totalTransactions: number;
  averageTransactionValue: number;
  
  // Subscription Stats
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  
  // Payment Methods
  totalPaymentMethods: number;
  activePaymentMethods: number;
  
  // Wallet Stats
  totalWalletBalance: number;
  totalWallets: number;
}

export interface ChartData {
  userGrowth: Array<{ date: string; users: number; }>;
  postActivity: Array<{ date: string; posts: number; completed: number; cancelled: number; }>;
  revenueFlow: Array<{ date: string; revenue: number; cashouts: number; profit: number; }>;
  subscriptionTrends: Array<{ date: string; subscriptions: number; revenue: number; }>;
  postStatusDistribution: Array<{ status: string; count: number; color: string; }>;
  userStatusDistribution: Array<{ status: string; count: number; color: string; }>;
  topCountries: Array<{ country: string; users: number; posts: number; }>;
  topUsers: Array<{ name: string; email: string; posts: number; earnings: number; spent: number; }>;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'post_created' | 'subscription_created' | 'cashout_requested' | 'wallet_recharged';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  count?: number;
}

export class DashboardService {
  
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        users,
        walletStats,
        cashoutStats,
        subscriptionStats,
        paymentMethods
      ] = await Promise.all([
        UserService.getUsers(),
        WalletService.getWalletStats(),
        CashoutService.getCashoutStats(),
        SubscriptionService.getSubscriptionStats(),
        PaymentMethodService.getPaymentMethods()
      ]);

      // Get posts data
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate time ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // User calculations
      const newUsersToday = users.filter(user => {
        const createdAt = user.createdAt instanceof Date ? user.createdAt : user.createdAt.toDate();
        return createdAt >= today;
      }).length;

      const newUsersThisWeek = users.filter(user => {
        const createdAt = user.createdAt instanceof Date ? user.createdAt : user.createdAt.toDate();
        return createdAt >= weekAgo;
      }).length;

      // Post calculations
      const postsToday = posts.filter(post => {
        const createdAt = post.createdAt?.toDate() || new Date();
        return createdAt >= today;
      }).length;

      const postsThisWeek = posts.filter(post => {
        const createdAt = post.createdAt?.toDate() || new Date();
        return createdAt >= weekAgo;
      }).length;

      const postsByStatus = posts.reduce((acc, post) => {
        acc[post.status || 'active'] = (acc[post.status || 'active'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get transactions for revenue calculation
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const transactions = transactionsSnapshot.docs.map(doc => doc.data());
      
      const totalRevenue = transactions
        .filter(t => t.type === 'recharge' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const averageTransactionValue = transactions.length > 0 
        ? totalRevenue / transactions.length 
        : 0;

      return {
        // User Stats
        totalUsers: users.length,
        newUsersToday,
        newUsersThisWeek,
        activeUsers: users.filter(u => u.isActive).length,
        verifiedUsers: users.filter(u => u.isVerified).length,
        bannedUsers: users.filter(u => u.isBanned).length,
        
        // Post Stats
        totalPosts: posts.length,
        activePosts: postsByStatus.active || 0,
        completedPosts: postsByStatus.completed || 0,
        cancelledPosts: postsByStatus.cancelled || 0,
        subscribedPosts: postsByStatus.subscribed || 0,
        postsToday,
        postsThisWeek,
        
        // Financial Stats
        totalRevenue,
        totalCashedOut: cashoutStats.totalCashedOut,
        adminEarnings: cashoutStats.adminEarnings,
        pendingCashouts: cashoutStats.pendingRequests,
        totalTransactions: walletStats.totalTransactions,
        averageTransactionValue,
        
        // Subscription Stats
        totalSubscriptions: subscriptionStats.totalSubscriptions,
        activeSubscriptions: subscriptionStats.activeSubscriptions,
        subscriptionRevenue: subscriptionStats.totalRevenue,
        
        // Payment Methods
        totalPaymentMethods: paymentMethods.length,
        activePaymentMethods: paymentMethods.filter(pm => pm.isActive).length,
        
        // Wallet Stats
        totalWalletBalance: walletStats.totalBalance,
        totalWallets: walletStats.totalUsers
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getChartData(): Promise<ChartData> {
    try {
      // This would typically fetch data for the last 30 days
      const days = 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // For now, we'll generate sample data structure - in real implementation,
      // you'd query your database for historical data
      const userGrowth = [];
      const postActivity = [];
      const revenueFlow = [];
      const subscriptionTrends = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        userGrowth.push({
          date: dateStr,
          users: Math.floor(Math.random() * 10) + 1
        });

        postActivity.push({
          date: dateStr,
          posts: Math.floor(Math.random() * 5) + 1,
          completed: Math.floor(Math.random() * 3),
          cancelled: Math.floor(Math.random() * 2)
        });

        revenueFlow.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 1000) + 100,
          cashouts: Math.floor(Math.random() * 500) + 50,
          profit: Math.floor(Math.random() * 200) + 20
        });

        subscriptionTrends.push({
          date: dateStr,
          subscriptions: Math.floor(Math.random() * 3) + 1,
          revenue: Math.floor(Math.random() * 300) + 50
        });
      }

      // Get real current data for distributions
      const users = await UserService.getUsers();
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const posts = postsSnapshot.docs.map(doc => doc.data());

      const postStatusDistribution = [
        { status: 'Active', count: posts.filter(p => p.status === 'active').length, color: '#10B981' },
        { status: 'Completed', count: posts.filter(p => p.status === 'completed').length, color: '#8B5CF6' },
        { status: 'Cancelled', count: posts.filter(p => p.status === 'cancelled').length, color: '#EF4444' },
        { status: 'Subscribed', count: posts.filter(p => p.status === 'subscribed').length, color: '#F59E0B' }
      ];

      const userStatusDistribution = [
        { status: 'Active', count: users.filter(u => u.isActive && !u.isBanned).length, color: '#10B981' },
        { status: 'Inactive', count: users.filter(u => !u.isActive && !u.isBanned).length, color: '#6B7280' },
        { status: 'Banned', count: users.filter(u => u.isBanned).length, color: '#EF4444' },
        { status: 'Verified', count: users.filter(u => u.isVerified).length, color: '#3B82F6' }
      ];

      // Group users by country
      const countryGroups = users.reduce((acc, user) => {
        const country = user.placeOfLiving || 'Unknown';
        if (!acc[country]) {
          acc[country] = { users: 0, posts: 0 };
        }
        acc[country].users++;
        return acc;
      }, {} as Record<string, { users: number; posts: number }>);

      const topCountries = Object.entries(countryGroups)
        .map(([country, data]) => ({ country, ...data }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 10);

      // Top users by activity
      const topUsers = users
        .map(user => ({
          name: user.fullName,
          email: user.email,
          posts: posts.filter(p => p.userId === user.id).length,
          earnings: 0, // Would calculate from transactions
          spent: 0    // Would calculate from transactions
        }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, 10);

      return {
        userGrowth,
        postActivity,
        revenueFlow,
        subscriptionTrends,
        postStatusDistribution,
        userStatusDistribution,
        topCountries,
        topUsers
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  static async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent users
      const usersQuery = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();
        activities.push({
          id: doc.id,
          type: 'user_registered',
          title: 'New User Registration',
          description: `${user.fullName} (${user.email}) joined the platform`,
          timestamp: user.createdAt.toDate(),
          icon: 'user',
          color: 'blue'
        });
      });

      // Get recent posts
      const postsQuery = query(
        collection(db, 'posts'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      postsSnapshot.docs.forEach(doc => {
        const post = doc.data();
        activities.push({
          id: doc.id,
          type: 'post_created',
          title: 'New Post Created',
          description: `${post.serviceType} service from ${post.fromCity?.name || 'Unknown'} to ${post.toCity?.name || 'Unknown'}`,
          timestamp: post.createdAt.toDate(),
          icon: 'post',
          color: 'green'
        });
      });

      // Get recent transactions
      const transactionsQuery = query(
        collection(db, 'transactions'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      transactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data();
        activities.push({
          id: doc.id,
          type: 'wallet_recharged',
          title: 'Wallet Recharged',
          description: `${Math.abs(transaction.amount)} points ${transaction.type}`,
          timestamp: transaction.createdAt.toDate(),
          icon: 'wallet',
          color: 'purple'
        });
      });

      // Sort by timestamp and return latest 15
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 15);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  static getQuickActions(stats: DashboardStats): QuickAction[] {
    return [
      {
        id: 'create-user',
        title: 'Add New User',
        description: 'Create a new user account',
        icon: 'user-plus',
        color: 'blue',
        path: '/admin/users',
        count: stats.totalUsers
      },
      {
        id: 'recharge-wallet',
        title: 'Recharge Wallet',
        description: 'Add points to user wallets',
        icon: 'wallet',
        color: 'green',
        path: '/admin/wallets'
      },
      {
        id: 'process-cashouts',
        title: 'Process Cashouts',
        description: 'Handle pending cashout requests',
        icon: 'cashout',
        color: 'orange',
        path: '/admin/cashouts',
        count: stats.pendingCashouts
      },
      {
        id: 'manage-subscriptions',
        title: 'Subscriptions',
        description: 'Manage post subscriptions',
        icon: 'subscription',
        color: 'purple',
        path: '/admin/subscriptions',
        count: stats.activeSubscriptions
      },
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        description: 'Manage payment options',
        icon: 'payment',
        color: 'indigo',
        path: '/admin/payment-methods',
        count: stats.activePaymentMethods
      },
      {
        id: 'view-posts',
        title: 'Active Posts',
        description: 'Monitor active posts',
        icon: 'posts',
        color: 'teal',
        path: '/admin/posts',
        count: stats.activePosts
      }
    ];
  }
}
