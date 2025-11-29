export interface Country {
  id: string;
  name: string;
  code: string; // ISO country code (e.g., "US", "FR", "JP")
  phoneCountryCode?: string; // Phone country code (e.g., "+1", "+33", "+81")
  phoneNumberLength?: number; // Expected phone number length (digits after country code) - Optional reference
  flag?: string; // Optional flag emoji or URL
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created the country
}

export interface City {
  id: string;
  countryId: string; // Reference to the country
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created the city
}

export interface CreateCountryData {
  name: string;
  code: string;
  phoneCountryCode?: string;
  phoneNumberLength?: number;
  flag?: string;
}

export interface CreateCityData {
  name: string;
  countryId: string;
}

export interface CountryFilters {
  search: string;
  isActive?: boolean;
}

export interface CityFilters {
  search: string;
  countryId?: string;
  isActive?: boolean;
}

// Combined type for display purposes
export interface CountryWithCities extends Country {
  cities: City[];
  citiesCount: number;
}
