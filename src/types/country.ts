export interface Country {
  id: string;
  name: string;
  code: string; // ISO country code (e.g., "US", "FR", "JP")
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
