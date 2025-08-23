import React from 'react';
import type { UserWallet } from '../types/wallet';
import type { User } from '../types/user';
import { 
  TokensIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  PersonIcon
} from '@radix-ui/react-icons';

interface WalletCardProps {
  wallet: UserWallet;
  user: User;
  onRecharge: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, user, onRecharge }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-4">
        {user.facePhotoUrl ? (
          <img
            src={user.facePhotoUrl}
            alt={user.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <PersonIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <TokensIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {wallet.balance}
          </p>
          <span className="text-sm text-gray-500 dark:text-gray-400">pts</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ≈ {formatCurrency(wallet.balance)} USD
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ArrowUpIcon className="w-3 h-3 text-green-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {wallet.totalEarnings}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ArrowDownIcon className="w-3 h-3 text-red-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {wallet.totalSpent}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ArrowDownIcon className="w-3 h-3 text-orange-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {wallet.totalCashouts}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Cashed</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onRecharge}
          className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Recharge Wallet
        </button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {formatDate(wallet.updatedAt)}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
