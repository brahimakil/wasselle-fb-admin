export interface WeightBracket {
  id: string;
  minWeight: number; // kg
  maxWeight: number; // kg
  basePrice: number; // base price in points
  pricePerKg: number; // additional price per kg
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightBracketFormData {
  minWeight: number;
  maxWeight: number;
  basePrice: number;
  pricePerKg: number;
  isActive: boolean;
}
