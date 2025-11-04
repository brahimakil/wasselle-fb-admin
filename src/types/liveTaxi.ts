import { Timestamp } from 'firebase/firestore';

export interface LiveTaxiPost {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  
  // Location Information
  fromCityId: string;
  fromCityName: string;
  fromCountryId: string;
  fromCountryName: string;
  
  toCityId: string;
  toCityName: string;
  toCountryId: string;
  toCountryName: string;
  
  // Pricing & Contact
  offerPrice: number;
  contactPhone?: string;
  
  // Status Management
  status: 'waiting' | 'accepted' | 'completed' | 'cancelled';
  
  // Accepted Driver Information
  acceptedDriverId?: string;
  acceptedDriverName?: string;
  acceptedApplicationId?: string;
  
  // Timestamps
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface LiveTaxiApplication {
  id: string;
  livePostId: string;
  
  // Driver Information
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverPhoto?: string;
  
  // Vehicle Information
  vehicleId?: string;
  vehicleInfo?: {
    type: 'vehicle';
    model: string;
    color: string;
    plateNumber: string;
  };
  
  // Status
  status: 'pending' | 'accepted' | 'rejected';
  
  // Timestamps
  appliedAt: Date;
}

export interface LiveTaxiPostWithApplications extends LiveTaxiPost {
  applicationsCount: number;
}

export interface LiveTaxiFilters {
  search?: string;
  status?: 'waiting' | 'accepted' | 'completed' | 'cancelled';
  countryId?: string;
  cityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LiveTaxiStats {
  totalPosts: number;
  activePosts: number;
  completedToday: number;
  completedTotal: number;
  cancelledTotal: number;
  totalRevenue: number;
  averagePrice: number;
  totalApplications: number;
}
