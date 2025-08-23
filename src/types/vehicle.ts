export interface Vehicle {
  id: string;
  userId: string; // Owner's user ID
  model: string;
  color: string;
  numberOfSeats: number;
  licensePlate: string;
  frontPhotoUrl: string;
  backPhotoUrl: string;
  papersPhotoUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created/approved the vehicle
}

export interface CreateVehicleData {
  model: string;
  color: string;
  numberOfSeats: number;
  licensePlate: string;
  frontPhoto: File;
  backPhoto: File;
  papersPhoto: File;
}

export interface VehicleFilters {
  search: string;
  userId?: string;
  model?: string;
  color?: string;
  numberOfSeats?: number;
  isActive?: boolean;
}
