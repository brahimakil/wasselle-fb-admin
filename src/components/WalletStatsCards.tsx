import React from 'react';
import type { WalletStats } from '../types/wallet';
import { 
  TokensIcon,
  PersonIcon,
  ActivityLogIcon,
  ClockIcon
} from '@radix-ui/react-icons';

interface WalletStatsCardsProps {
  stats: WalletStats;
}

const WalletStatsCards: React.FC<WalletStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statsData = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      subValue: 'Active wallets',
      icon: PersonIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Total Balance',
      value: `${stats.totalBalance.toLocaleString()} pts`,
      subValue: `≈ ${formatCurrency(stats.totalBalance)}`,
      icon: TokensIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      subValue: 'All time',
      icon: ActivityLogIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Today\'s Activity',
      value: stats.todayTransactions.toLocaleString(),
      subValue: `${stats.pendingTransactions} pending`,
      icon: ClockIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-lg p-6`}>
          <div className="flex items-center">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stat.subValue}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletStatsCards;
