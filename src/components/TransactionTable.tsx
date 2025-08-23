import React, { useState } from 'react';
import type { Transaction } from '../types/wallet';
import type { User } from '../types/user';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircledIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons';

interface TransactionTableProps {
  transactions: Transaction[];
  users: User[];
  onRefresh: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'recharge':
      case 'post_earning':
        return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
      case 'post_payment':
      case 'cashout':
        return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
      case 'admin_adjustment':
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircledIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <CrossCircledIcon className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAmount = (amount: number) => {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const user = getUserById(transaction.userId);
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === '' || transaction.type === filterType;
    const matchesStatus = filterStatus === '' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="recharge">Recharge</option>
          <option value="post_payment">Post Payment</option>
          <option value="post_earning">Post Earning</option>
          <option value="cashout">Cashout</option>
          <option value="admin_adjustment">Admin Adjustment</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Transaction</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => {
                const user = getUserById(transaction.userId);
                return (
                  <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-xs">
                          {transaction.id}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {transaction.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Unknown User</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold text-sm ${
                        transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatAmount(transaction.amount)} pts
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`text-sm capitalize ${
                          transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                          transaction.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
};

export default TransactionTable;
