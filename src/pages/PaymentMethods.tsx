import React, { useState, useEffect } from 'react';
import { PaymentMethodService } from '../services/paymentMethodService';
import type { PaymentMethod, PaymentMethodFilters, PaymentMethodStats } from '../types/paymentMethod';
import PaymentMethodCard from '../components/PaymentMethodCard';
import CreatePaymentMethodModal from '../components/CreatePaymentMethodModal';
import PaymentMethodStatsCards from '../components/PaymentMethodStatsCards';
import { PlusIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

const PaymentMethods: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState<PaymentMethodStats>({
    totalMethods: 0,
    activeMethods: 0,
    inactiveMethods: 0
  });
  const [filters, setFilters] = useState<PaymentMethodFilters>({
    search: '',
    isActive: null
  });

  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = PaymentMethodService.subscribeToPaymentMethods((methods) => {
      setMethods(methods);
      setLoading(false);
      
      // Update stats
      setStats({
        totalMethods: methods.length,
        activeMethods: methods.filter(method => method.isActive).length,
        inactiveMethods: methods.filter(method => !method.isActive).length
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = methods;

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(method =>
        method.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.phoneNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.accountName?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by status
    if (filters.isActive !== null) {
      filtered = filtered.filter(method => method.isActive === filters.isActive);
    }

    setFilteredMethods(filtered);
  }, [methods, filters]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleUpdateMethod = () => {
    // Methods will auto-update via subscription
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage payment methods for transactions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Stats Cards */}
      <PaymentMethodStatsCards stats={stats} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search methods..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.isActive === null ? '' : filters.isActive.toString()}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              isActive: e.target.value === '' ? null : e.target.value === 'true'
            }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredMethods.length} of {methods.length} payment methods
          </div>
        </div>
      </div>

      {/* Payment Methods Grid */}
      {filteredMethods.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No payment methods found</div>
          <p className="text-gray-400 dark:text-gray-500">
            {methods.length === 0 ? 'Create your first payment method to get started' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onUpdate={handleUpdateMethod}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePaymentMethodModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default PaymentMethods;
