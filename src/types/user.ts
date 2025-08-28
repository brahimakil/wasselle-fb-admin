export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  countryId: string; // Replace placeOfLiving with countryId
  cityId: string; // Add cityId
  gender?: 'male' | 'female';
  driverLicenseUrl?: string;
  passportUrl?: string;
  facePhotoUrl?: string;
  liveLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string; // Add ban reason
  banDate?: Date; // Add ban date
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created the user
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  countryId: string; // Replace placeOfLiving with countryId
  cityId: string; // Add cityId
  gender: 'male' | 'female';
  driverLicense?: File;
  passport?: File;
  facePhoto?: File;
}

export interface UserFilters {
  search: string;
  countryId: string; // Replace placeOfLiving with countryId
  gender?: 'male' | 'female';
  isActive?: boolean;
  isVerified?: boolean;
  isBanned?: boolean;
}

export interface Post {
  id: string;
  userId: string; // User who created the post
  fromCountryId: string;
  fromCityId: string;
  toCountryId: string;
  toCityId: string;
  vehicleId?: string; // Optional if traveling by airplane
  departureDate: string; // ISO date string
  departureTime: string; // HH:mm format
  travelType: 'vehicle' | 'airplane';
  cost: number; // Cost in points
  serviceType: 'delivery' | 'taxi' | 'both';
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created the post (if admin-created)
}

export interface CreatePostData {
  userId: string;
  fromCountryId: string;
  fromCityId: string;
  toCountryId: string;
  toCityId: string;
  vehicleId?: string;
  departureDate: string;
  departureTime: string;
  travelType: 'vehicle' | 'airplane';
  cost: number;
  serviceType: 'delivery' | 'taxi' | 'both';
  description: string;
}

export interface PostFilters {
  search: string;
  userId?: string;
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
