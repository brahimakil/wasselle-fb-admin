import React, { useState, useEffect } from 'react';
import { WalletService } from '../services/walletService';
import { UserService } from '../services/userService';
import type { UserWallet, Transaction, WalletFilters, WalletStats } from '../types/wallet';
import type { User } from '../types/user';
import WalletCard from '../components/WalletCard';
import TransactionTable from '../components/TransactionTable';
import WalletStatsCards from '../components/WalletStatsCards';
import RechargeWalletModal from '../components/RechargeWalletModal';
import UpdateTransactionModal from '../components/UpdateTransactionModal';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  Cross2Icon,
  ReloadIcon,
  TokensIcon
} from '@radix-ui/react-icons';

const Wallets: React.FC = () => {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'transactions'>('overview');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    fetchData();
    
    // Set up real-time transaction updates
    const unsubscribe = WalletService.subscribeToTransactions((newTransactions) => {
      setTransactions(newTransactions);
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletsData, usersData, transactionsData, statsData] = await Promise.all([
        WalletService.getAllWallets(),
        UserService.getUsers(),
        WalletService.getTransactions(),
        WalletService.getWalletStats()
      ]);

      setWallets(walletsData);
      setUsers(usersData);
      setTransactions(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  const filteredWallets = wallets.filter(wallet => {
    const user = getUserById(wallet.userId);
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.fullName || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      wallet.userId.toLowerCase().includes(searchLower)
    );
  });

  const handleRecharge = async () => {
    setShowRechargeModal(false);
    setSelectedUserId('');
    await fetchData(); // Refresh data
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setSelectedTransaction(null);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user wallets, transactions, and payments
          </p>
        </div>
        <button
          onClick={() => setShowRechargeModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Recharge Wallet
        </button>
        <button
          onClick={() => {
            fetchData();
            window.location.reload(); // Force complete refresh if needed
          }}
          className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700"
        >
          <ReloadIcon className="w-4 h-4 mr-2" />
          Force Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && <WalletStatsCards stats={stats} />}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', count: stats?.totalUsers || 0 },
              { id: 'wallets', label: 'User Wallets', count: wallets.length },
              { id: 'transactions', label: 'Recent Transactions', count: transactions.length }
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
                {/* Top Wallets */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Wallets</h3>
                  <div className="space-y-3">
                    {wallets
                      .sort((a, b) => b.balance - a.balance) // Sort by balance descending
                      .slice(0, 5)
                      .map((wallet) => {
                        const user = getUserById(wallet.userId);
                        return user ? (
                          <div key={wallet.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 dark:text-green-400">{wallet.balance} pts</p>
                              <p className="text-xs text-gray-500">≈ ${wallet.balance}</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {transactions
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by date descending
                      .slice(0, 6) // Show 6 instead of 5
                      .map((transaction) => {
                        const user = getUserById(transaction.userId);
                        const getTransactionIcon = () => {
                          switch (transaction.type) {
                            case 'recharge': return '💰';
                            case 'cashout': return '💸';
                            case 'subscription': return '📝';
                            case 'admin_adjustment': return '⚙️';
                            default: return '💳';
                          }
                        };
                        
                        const getStatusColor = () => {
                          switch (transaction.status) {
                            case 'completed': return 'text-green-600';
                            case 'successful': return 'text-green-600';
                            case 'pending': return 'text-yellow-600';
                            case 'cancelled': return 'text-red-600';
                            default: return 'text-gray-600';
                          }
                        };

                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getTransactionIcon()}</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {user?.fullName || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {transaction.type} • {transaction.status}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-sm ${
                                transaction.amount > 0 ? 'text-green-600' : 
                                transaction.amount < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                              </p>
                              <p className={`text-xs ${getStatusColor()}`}>
                                {transaction.status}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transaction Summary (Today)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const todayTransactions = transactions.filter(t => 
                      new Date(t.createdAt) >= today
                    );
                    
                    const recharges = todayTransactions.filter(t => t.type === 'recharge' && (t.status === 'successful' || t.status === 'completed'));
                    const cashouts = todayTransactions.filter(t => t.type === 'cashout' && (t.status === 'successful' || t.status === 'completed'));
                    const pending = todayTransactions.filter(t => t.status === 'pending');
                    
                    const rechargeTotal = recharges.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const cashoutTotal = cashouts.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    
                    return [
                      { label: 'Recharges', value: recharges.length, amount: `+${rechargeTotal} pts`, color: 'text-green-600' },
                      { label: 'Cashouts', value: cashouts.length, amount: `-${cashoutTotal} pts`, color: 'text-red-600' },
                      { label: 'Pending', value: pending.length, amount: '', color: 'text-yellow-600' },
                      { label: 'Total Transactions', value: todayTransactions.length, amount: '', color: 'text-blue-600' }
                    ];
                  })().map((item, index) => (
                    <div key={index} className="text-center">
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                      {item.amount && (
                        <p className={`text-xs font-medium ${item.color}`}>{item.amount}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wallets' && (
            <div>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Wallets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWallets.map((wallet) => {
                  const user = getUserById(wallet.userId);
                  return user ? (
                    <WalletCard
                      key={wallet.userId}
                      wallet={wallet}
                      user={user}
                      onRecharge={() => {
                        setSelectedUserId(wallet.userId);
                        setShowRechargeModal(true);
                      }}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionTable 
              transactions={transactions} 
              users={users}
              onEditTransaction={handleEditTransaction}
            />
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <RechargeWalletModal
          userId={selectedUserId}
          users={users}
          onClose={() => {
            setShowRechargeModal(false);
            setSelectedUserId('');
          }}
          onSuccess={handleRecharge}
          adminId={currentAdmin?.uid || ''}
        />
      )}

      {showUpdateModal && selectedTransaction && (
        <UpdateTransactionModal
          transaction={selectedTransaction}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default Wallets;
