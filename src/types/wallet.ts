export interface UserWallet {
  userId: string;
  balance: number; // Points (1 point = 1 USD)
  totalEarnings: number;
  totalSpent: number;
  totalCashouts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string; // This will be the external transaction ID from admin
  userId: string;
  type: 'recharge' | 'post_payment' | 'post_earning' | 'cashout' | 'admin_adjustment';
  amount: number; // Positive for credits, negative for debits
  description: string;
  relatedPostId?: string;
  relatedUserId?: string; // For post payments/earnings
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'admin' | 'stripe' | 'paypal'; // For future payment gateways
  paymentMethodId?: string; // Reference to PaymentMethod collection
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletFilters {
  userId?: string;
  type?: Transaction['type'];
  status?: Transaction['status'];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface WalletStats {
  totalUsers: number;
  totalBalance: number;
  totalTransactions: number;
  todayTransactions: number;
  pendingTransactions: number;
}