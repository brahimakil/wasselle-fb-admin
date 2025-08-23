export interface Notification {
  id: string;
  userId: string;
  type: 'transaction' | 'subscription' | 'system' | 'post';
  title: string;
  message: string;
  data?: {
    transactionId?: string;
    subscriptionId?: string;
    postId?: string;
    amount?: number;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Notification['data'];
}
