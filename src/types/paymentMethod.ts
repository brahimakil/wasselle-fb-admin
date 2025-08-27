export interface PaymentMethod {
  id: string;
  name: string;
  phoneNumber?: string;
  accountName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreatePaymentMethodData {
  name: string;
  phoneNumber?: string;
  accountName?: string;
}

export interface PaymentMethodFilters {
  search: string;
  isActive: boolean | null;
}

export interface PaymentMethodStats {
  totalMethods: number;
  activeMethods: number;
  inactiveMethods: number;
}
