import React from 'react';
import type { PaymentMethodStats } from '../types/paymentMethod';
import { CardStackIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

interface PaymentMethodStatsCardsProps {
  stats: PaymentMethodStats;
}

const PaymentMethodStatsCards: React.FC<PaymentMethodStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Methods',
      value: stats.totalMethods,
      icon: CardStackIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Active Methods',
      value: stats.activeMethods,
      icon: CheckCircledIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Inactive Methods',
      value: stats.inactiveMethods,
      icon: CrossCircledIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

export default PaymentMethodStatsCards;