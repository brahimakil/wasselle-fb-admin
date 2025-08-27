export interface CashoutRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAmount: number; // Points requested by user
  feePercentage: number; // Admin-set fee percentage (e.g., 5 for 5%)
  feeAmount: number; // Calculated fee amount in dollars
  finalAmount: number; // Amount user receives after fee
  paymentMethodId: string;
  paymentMethodName: string;
  externalTransactionId?: string; // Transaction ID from payment provider
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  notes?: string;
  adminId: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface CreateCashoutData {
  userId: string;
  requestedAmount: number;
  feePercentage: number;
  paymentMethodId: string;
  notes?: string;
  externalTransactionId?: string;
  initialStatus?: 'pending' | 'completed';  // Add this field
}

export interface CashoutFilters {
  search?: string;
  userId?: string;
  status?: CashoutRequest['status'];
  paymentMethodId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CashoutStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalCashedOut: number;
  adminEarnings: number;  // Changed from totalFees to adminEarnings
  todayRequests: number;
}