export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  imageUrls?: string[];
  videoUrls?: string[];
  cost: number; // Points required to subscribe (0 = free)
  isPaid: boolean; // Whether this is a paid post
  category: string;
  tags: string[];
  viewCount: number;
  subscriptionCount: number; // How many times this post was subscribed to
  totalEarnings: number;
  status: 'active' | 'cancelled' | 'completed' | 'subscribed'; // Updated status
  subscriberId?: string; // ID of the user who subscribed (if any)
  subscribedAt?: Date; // When the subscription happened
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  title: string;
  content: string;
  cost: number;
  category: string;
  tags: string[];
  images?: File[];
  videos?: File[];
}

export interface PostSubscription {
  id: string;
  postId: string;
  postTitle: string;
  postCost: number;
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  transactionId: string;
  status: 'active' | 'cancelled';
  subscribedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface SubscriptionFilters {
  search?: string;
  subscriberId?: string;
  authorId?: string;
  status?: 'active' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PostPurchase {
  id: string;
  postId: string;
  userId: string;
  authorId: string;
  amount: number;
  transactionId: string;
  purchasedAt: Date;
}

export interface PostFilters {
  search: string;
  userId?: string;
  userGender?: 'male' | 'female';
  fromCountryId?: string;
  fromCityId?: string;
  toCountryId?: string;
  toCityId?: string;
  travelType?: 'vehicle' | 'airplane';
  serviceType?: 'delivery' | 'taxi' | 'both';
  isActive?: boolean;
  isCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// For tracking user cancellations
export interface UserCancellationRecord {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  cancellationCount: number;
  lastCancellation: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced post with related data for display
export interface PostWithDetails extends Post {
  user: {
    id: string;
    fullName: string;
    email: string;
    gender?: 'male' | 'female';
  };
  fromCountry: {
    id: string;
    name: string;
    flag?: string;
  };
  fromCity: {
    id: string;
    name: string;
  };
  toCountry: {
    id: string;
    name: string;
    flag?: string;
  };
  toCity: {
    id: string;
    name: string;
  };
  vehicle?: {
    id: string;
    model: string;
    licensePlate: string;
  };
}
