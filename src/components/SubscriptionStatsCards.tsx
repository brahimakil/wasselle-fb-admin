import React from 'react';
import { 
  RocketIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  TokensIcon,
  ActivityLogIcon
} from '@radix-ui/react-icons';

interface SubscriptionStatsCardsProps {
  stats: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    totalRevenue: number;
    todaySubscriptions: number;
  };
}

const SubscriptionStatsCards: React.FC<SubscriptionStatsCardsProps> = ({ stats }) => {
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
      label: 'Total Subscriptions',
      value: stats.totalSubscriptions.toLocaleString(),
      subValue: 'All time',
      icon: RocketIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      subValue: 'Currently active',
      icon: CheckCircledIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Total Revenue',
      value: `${stats.totalRevenue.toLocaleString()} pts`,
      subValue: `≈ ${formatCurrency(stats.totalRevenue)}`,
      icon: TokensIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'Today\'s Activity',
      value: stats.todaySubscriptions.toLocaleString(),
      subValue: `${stats.cancelledSubscriptions} cancelled total`,
      icon: ActivityLogIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
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

export default SubscriptionStatsCards;