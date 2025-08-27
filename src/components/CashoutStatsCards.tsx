import React from 'react';
import type { CashoutStats } from '../types/cashout';
import { 
  TokensIcon,
  ClockIcon, 
  CheckCircledIcon,
  GearIcon,  // Use this instead of CalculatorIcon
  CalendarIcon
} from '@radix-ui/react-icons';

interface CashoutStatsCardsProps {
  stats: CashoutStats;
}

const CashoutStatsCards: React.FC<CashoutStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: TokensIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Pending',
      value: stats.pendingRequests,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Completed',
      value: stats.completedRequests,
      icon: CheckCircledIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Total Cashed Out',
      value: `$${stats.totalCashedOut}`,
      icon: TokensIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Admin Earnings',  // Changed from 'Total Fees'
      value: `$${stats.adminEarnings}`,  // Changed from stats.totalFees
      icon: GearIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Today',
      value: stats.todayRequests,
      icon: CalendarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CashoutStatsCards;