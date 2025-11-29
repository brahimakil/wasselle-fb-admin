import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  setDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Country, City, CreateCountryData, CreateCityData, CountryFilters, CityFilters, CountryWithCities } from '../types/country';

export class CountryService {
  private static readonly COUNTRIES_COLLECTION = 'countries';
  private static readonly CITIES_COLLECTION = 'cities';

  // ==================== COUNTRIES ====================

  // Create a new country
  static async createCountry(countryData: CreateCountryData, adminId: string): Promise<string> {
    try {
      const countryId = doc(collection(db, this.COUNTRIES_COLLECTION)).id;

      const countryDoc: Omit<Country, 'id'> = {
        name: countryData.name,
        code: countryData.code.toUpperCase(),
        phoneCountryCode: countryData.phoneCountryCode || '',
        phoneNumberLength: countryData.phoneNumberLength,
        flag: countryData.flag || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      await setDoc(doc(db, this.COUNTRIES_COLLECTION, countryId), countryDoc);
      return countryId;
    } catch (error) {
      console.error('Error creating country:', error);
      throw error;
    }
  }

  // Get countries with filters
  static async getCountries(filters?: CountryFilters): Promise<Country[]> {
    try {
      let q = query(collection(db, this.COUNTRIES_COLLECTION));

      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const querySnapshot = await getDocs(q);
      let countries: Country[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        countries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Country);
      });

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        countries = countries.filter(country => 
          country.name.toLowerCase().includes(searchTerm) ||
          country.code.toLowerCase().includes(searchTerm)
        );
      }

      countries.sort((a, b) => a.name.localeCompare(b.name));
      return countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  // Get countries with their cities
  static async getCountriesWithCities(filters?: CountryFilters): Promise<CountryWithCities[]> {
    try {
      const countries = await this.getCountries(filters);
      const countriesWithCities: CountryWithCities[] = [];

      for (const country of countries) {
        const cities = await this.getCitiesByCountry(country.id);
        countriesWithCities.push({
          ...country,
          cities,
          citiesCount: cities.length
        });
      }

      return countriesWithCities;
    } catch (error) {
      console.error('Error fetching countries with cities:', error);
      throw error;
    }
  }

  // Get active countries only (for dropdowns)
  static async getActiveCountries(): Promise<Country[]> {
    try {
      const q = query(collection(db, this.COUNTRIES_COLLECTION), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      const countries: Country[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        countries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Country);
      });

      countries.sort((a, b) => a.name.localeCompare(b.name));
      return countries;
    } catch (error) {
      console.error('Error fetching active countries:', error);
      throw error;
    }
  }

  // Update country status
  static async updateCountryStatus(countryId: string, isActive: boolean): Promise<void> {
    try {
      const countryRef = doc(db, this.COUNTRIES_COLLECTION, countryId);
      
      const countryDoc = await getDoc(countryRef);
      if (!countryDoc.exists()) {
        throw new Error(`Country document not found: ${countryId}`);
      }
      
      await updateDoc(countryRef, {
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating country status:', error);
      throw error;
    }
  }

  // Update country
  static async updateCountry(countryId: string, updates: Partial<Omit<Country, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const countryRef = doc(db, this.COUNTRIES_COLLECTION, countryId);
      
      const countryDoc = await getDoc(countryRef);
      if (!countryDoc.exists()) {
        throw new Error(`Country document not found: ${countryId}`);
      }

      if (updates.code) {
        updates.code = updates.code.toUpperCase();
      }
      
      await updateDoc(countryRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating country:', error);
      throw error;
    }
  }

  // Delete country (and all its cities)
  static async deleteCountry(countryId: string): Promise<void> {
    try {
      const countryRef = doc(db, this.COUNTRIES_COLLECTION, countryId);
      
      const countryDoc = await getDoc(countryRef);
      if (!countryDoc.exists()) {
        throw new Error(`Country document not found: ${countryId}`);
      }

      // Delete all cities in this country first
      const cities = await this.getCitiesByCountry(countryId);
      for (const city of cities) {
        await this.deleteCity(city.id);
      }

      // Delete country document
      await deleteDoc(countryRef);
    } catch (error) {
      console.error('Error deleting country:', error);
      throw error;
    }
  }

  // Check if country code exists (for validation)
  static async checkCountryCodeExists(code: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(collection(db, this.COUNTRIES_COLLECTION), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        const docs = querySnapshot.docs.filter(doc => doc.id !== excludeId);
        return docs.length > 0;
      }
      
      return querySnapshot.size > 0;
    } catch (error) {
      console.error('Error checking country code:', error);
      return false;
    }
  }

  // Get country by code
  static async getCountryByCode(code: string): Promise<Country | null> {
    try {
      const q = query(collection(db, this.COUNTRIES_COLLECTION), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Country;
    } catch (error) {
      console.error('Error fetching country by code:', error);
      return null;
    }
  }

  // ==================== CITIES ====================

  // Create a new city
  static async createCity(cityData: CreateCityData, adminId: string): Promise<string> {
    try {
      const cityId = doc(collection(db, this.CITIES_COLLECTION)).id;

      const cityDoc: Omit<City, 'id'> = {
        countryId: cityData.countryId,
        name: cityData.name,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      await setDoc(doc(db, this.CITIES_COLLECTION, cityId), cityDoc);
      return cityId;
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  }

  // Get cities with filters
  static async getCities(filters?: CityFilters): Promise<City[]> {
    try {
      let q = query(collection(db, this.CITIES_COLLECTION));

      if (filters?.countryId) {
        q = query(q, where('countryId', '==', filters.countryId));
      }

      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const querySnapshot = await getDocs(q);
      let cities: City[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cities.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as City);
      });

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        cities = cities.filter(city => 
          city.name.toLowerCase().includes(searchTerm)
        );
      }

      cities.sort((a, b) => a.name.localeCompare(b.name));
      return cities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }

  // Get cities by country
  static async getCitiesByCountry(countryId: string): Promise<City[]> {
    return this.getCities({ search: '', countryId, isActive: undefined });
  }

  // Get active cities by country (for dropdowns)
  static async getActiveCitiesByCountry(countryId: string): Promise<City[]> {
    return this.getCities({ search: '', countryId, isActive: true });
  }

  // Update city status
  static async updateCityStatus(cityId: string, isActive: boolean): Promise<void> {
    try {
      const cityRef = doc(db, this.CITIES_COLLECTION, cityId);
      
      const cityDoc = await getDoc(cityRef);
      if (!cityDoc.exists()) {
        throw new Error(`City document not found: ${cityId}`);
      }
      
      await updateDoc(cityRef, {
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating city status:', error);
      throw error;
    }
  }

  // Update city
  static async updateCity(cityId: string, updates: Partial<Omit<City, 'id' | 'countryId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const cityRef = doc(db, this.CITIES_COLLECTION, cityId);
      
      const cityDoc = await getDoc(cityRef);
      if (!cityDoc.exists()) {
        throw new Error(`City document not found: ${cityId}`);
      }
      
      await updateDoc(cityRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating city:', error);
      throw error;
    }
  }

  // Delete city
  static async deleteCity(cityId: string): Promise<void> {
    try {
      const cityRef = doc(db, this.CITIES_COLLECTION, cityId);
      
      const cityDoc = await getDoc(cityRef);
      if (!cityDoc.exists()) {
        throw new Error(`City document not found: ${cityId}`);
      }

      await deleteDoc(cityRef);
    } catch (error) {
      console.error('Error deleting city:', error);
      throw error;
    }
  }

  // Check if city name exists in country (for validation)
  static async checkCityNameExists(countryId: string, cityName: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.CITIES_COLLECTION), 
        where('countryId', '==', countryId),
        where('name', '==', cityName)
      );
      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        const docs = querySnapshot.docs.filter(doc => doc.id !== excludeId);
        return docs.length > 0;
      }
      
      return querySnapshot.size > 0;
    } catch (error) {
      console.error('Error checking city name:', error);
      return false;
    }
  }

  // Get city by id
  static async getCityById(cityId: string): Promise<City | null> {
    try {
      const cityRef = doc(db, this.CITIES_COLLECTION, cityId);
      const cityDoc = await getDoc(cityRef);
      
      if (!cityDoc.exists()) {
        return null;
      }

      const data = cityDoc.data();
      return {
        id: cityDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as City;
    } catch (error) {
      console.error('Error fetching city by id:', error);
      return null;
    }
  }
}
