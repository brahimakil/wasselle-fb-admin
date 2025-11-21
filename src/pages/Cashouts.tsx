import React, { useState, useEffect } from 'react';
import { CashoutService } from '../services/cashoutService';
import { UserService } from '../services/userService';
import { PaymentMethodService } from '../services/paymentMethodService';
import { SettingsService } from '../services/settingsService';
import type { CashoutRequest, CashoutFilters, CashoutStats } from '../types/cashout';
import type { User } from '../types/user';
import type { PaymentMethod } from '../types/paymentMethod';
import CashoutCard from '../components/CashoutCard';
import CashoutStatsCards from '../components/CashoutStatsCards';
import CreateCashoutModal from '../components/CreateCashoutModal';
import ProcessCashoutModal from '../components/ProcessCashoutModal';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ReloadIcon,
  TokensIcon,
  GearIcon,
  CheckIcon
} from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Cashouts: React.FC = () => {
  const [cashouts, setCashouts] = useState<CashoutRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedCashout, setSelectedCashout] = useState<CashoutRequest | null>(null);
  const [stats, setStats] = useState<CashoutStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalCashedOut: 0,
    adminEarnings: 0,
    todayRequests: 0
  });
  const [filters, setFilters] = useState<CashoutFilters>({});
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [defaultFeePercentage, setDefaultFeePercentage] = useState('5');
  const [editingDefaultFee, setEditingDefaultFee] = useState(false);
  const [savingDefaultFee, setSavingDefaultFee] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    loadDefaultFee();
  }, [filters, activeTab]);

  // Real-time listener for cashout transactions
  useEffect(() => {
    let q = query(
      collection(db, 'transactions'),
      where('type', '==', 'cashout'),
      orderBy('createdAt', 'desc')
    );

    if (activeTab !== 'all') {
      q = query(
        collection(db, 'transactions'),
        where('type', '==', 'cashout'),
        where('status', '==', activeTab === 'pending' ? 'pending' : 
                              activeTab === 'completed' ? 'completed' : 'cancelled'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const cashoutsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = data.metadata?.userName || 'Unknown';
        let userEmail = data.metadata?.userEmail || '';

        // If user info is missing, fetch it from users collection
        if (userName === 'Unknown' || !userEmail) {
          try {
            const user = await UserService.getUserById(data.userId);
            if (user) {
              userName = user.name || user.displayName || 'Unknown';
              userEmail = user.email || '';
            }
          } catch (error) {
            console.error('Error fetching user data for cashout:', error);
          }
        }

        return {
          id: doc.id,
          userId: data.userId,
          userName,
          userEmail,
          requestedAmount: data.metadata?.requestedAmount || 0,
          feePercentage: data.metadata?.feePercentage || 5,
          feeAmount: data.metadata?.feeAmount || 0,
          finalAmount: data.metadata?.finalAmount || 0,
          status: data.status,
          paymentMethodId: data.paymentMethodId || '',
          paymentMethodName: data.metadata?.paymentMethodName || '',
          externalTransactionId: doc.id,
          notes: data.metadata?.notes,
          adminNotes: data.metadata?.adminNotes,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.metadata?.processedAt?.toDate(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CashoutRequest;
      }));

      setCashouts(cashoutsData);
      
      // Update stats when data changes
      CashoutService.getCashoutStats().then(setStats);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const loadDefaultFee = async () => {
    try {
      const settings = await SettingsService.getSettings();
      setDefaultFeePercentage(settings.defaultCashoutFeePercentage.toString());
    } catch (error) {
      console.error('Error loading default fee:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cashoutsData, usersData, paymentMethodsData, statsData] = await Promise.all([
        CashoutService.getCashoutRequests({
          ...filters,
          status: activeTab === 'pending' ? 'pending' : 
                 activeTab === 'completed' ? 'completed' : 
                 activeTab === 'cancelled' ? 'cancelled' : undefined
        }),
        UserService.getUsers(),
        PaymentMethodService.getPaymentMethods(),
        CashoutService.getCashoutStats()
      ]);

      setCashouts(cashoutsData);
      setUsers(usersData);
      setPaymentMethods(paymentMethodsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching cashout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaultFee = async () => {
    try {
      const feePercent = parseFloat(defaultFeePercentage);
      if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
        alert('Please enter a valid fee percentage (0-100)');
        return;
      }

      setSavingDefaultFee(true);
      await SettingsService.updateDefaultCashoutFee(feePercent, user?.uid || '');
      setEditingDefaultFee(false);
      alert('Default fee percentage updated successfully');
    } catch (error: any) {
      console.error('Error saving default fee:', error);
      alert(error.message || 'Failed to save default fee percentage');
    } finally {
      setSavingDefaultFee(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleProcessCashout = (cashout: CashoutRequest) => {
    setSelectedCashout(cashout);
    setShowProcessModal(true);
  };

  const handleProcessSuccess = () => {
    setShowProcessModal(false);
    setSelectedCashout(null);
    fetchData();
  };

  const filteredCashouts = cashouts;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cashout Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user cashout requests and process payments</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Default Fee Setting */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <GearIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Default Fee:</span>
            {editingDefaultFee ? (
              <>
                <input
                  type="number"
                  value={defaultFeePercentage}
                  onChange={(e) => setDefaultFeePercentage(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-16 px-2 py-1 text-sm border-2 border-blue-500 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                <button
                  onClick={handleSaveDefaultFee}
                  disabled={savingDefaultFee}
                  className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="w-3 h-3" />
                  <span className="text-xs">Save</span>
                </button>
                <button
                  onClick={() => {
                    setEditingDefaultFee(false);
                    loadDefaultFee();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{defaultFeePercentage}%</span>
                <button
                  onClick={() => setEditingDefaultFee(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Cashout</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ReloadIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <CashoutStatsCards stats={stats} />

      {/* Tabs and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Requests', count: stats.totalRequests },
              { id: 'pending', label: 'Pending', count: stats.pendingRequests },
              { id: 'completed', label: 'Completed', count: stats.completedRequests },
              { id: 'cancelled', label: 'Cancelled', count: cashouts.filter(c => c.status === 'cancelled').length }
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
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cashouts..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.userId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>

            <select
              value={filters.paymentMethodId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentMethodId: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Payment Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredCashouts.length} cashout requests
            </div>
          </div>

          {/* Cashouts List */}
          {filteredCashouts.length === 0 ? (
            <div className="text-center py-12">
              <TokensIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No cashout requests</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'all' ? 'No cashout requests found' : `No ${activeTab} cashout requests found`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCashouts.map((cashout) => (
                <CashoutCard
                  key={cashout.id}
                  cashout={cashout}
                  adminId={user?.uid || ''}
                  onProcess={() => handleProcessCashout(cashout)}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCashoutModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          users={users}
          paymentMethods={paymentMethods}
          adminId={user?.uid || ''}
          defaultFeePercentage={defaultFeePercentage}
        />
      )}

      {/* Process Modal */}
      {showProcessModal && selectedCashout && (
        <ProcessCashoutModal
          cashout={selectedCashout}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedCashout(null);
          }}
          onSuccess={handleProcessSuccess}
          adminId={user?.uid || ''}
        />
      )}
    </div>
  );
};

export default Cashouts;
