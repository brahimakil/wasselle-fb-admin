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
  writeBatch 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  createUserWithEmailAndPassword,
  updatePassword 
} from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import type { User, CreateUserData, UserFilters } from '../types/user';
import { WalletService } from './walletService';
import type { Transaction, UserWallet } from '../types/wallet';

export class UserService {
  private static readonly COLLECTION_NAME = 'users';
  private static readonly STORAGE_PATH = 'users';

  // Upload image to Firebase Storage
  static async uploadImage(file: File, userId: string, imageType: 'driverLicense' | 'passport' | 'facePhoto'): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${imageType}.${fileExtension}`;
    const storageRef = ref(storage, `${this.STORAGE_PATH}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Create a new user
  static async createUser(userData: CreateUserData, adminId: string): Promise<string> {
    try {
      // First create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const userId = userCredential.user.uid;

      // Upload images if provided
      const imageUrls: { [key: string]: string } = {};
      
      if (userData.driverLicense) {
        imageUrls.driverLicenseUrl = await this.uploadImage(userData.driverLicense, userId, 'driverLicense');
      }
      
      if (userData.passport) {
        imageUrls.passportUrl = await this.uploadImage(userData.passport, userId, 'passport');
      }
      
      if (userData.facePhoto) {
        imageUrls.facePhotoUrl = await this.uploadImage(userData.facePhoto, userId, 'facePhoto');
      }

      // Create user document in Firestore
      const userDoc: Omit<User, 'id'> = {
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        placeOfLiving: userData.placeOfLiving,
        gender: userData.gender,
        ...imageUrls,
        isActive: false, // Default inactive
        isVerified: false,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      await setDoc(doc(db, this.COLLECTION_NAME, userId), userDoc);

      return userId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get all users with optional filters
  static async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      // Remove orderBy to avoid needing composite indexes
      let q = query(collection(db, this.COLLECTION_NAME));

      if (filters?.placeOfLiving) {
        q = query(q, where('placeOfLiving', '==', filters.placeOfLiving));
      }

      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      if (filters?.isVerified !== undefined) {
        q = query(q, where('isVerified', '==', filters.isVerified));
      }

      if (filters?.isBanned !== undefined) {
        q = query(q, where('isBanned', '==', filters.isBanned));
      }

      if (filters?.gender) {
        q = query(q, where('gender', '==', filters.gender));
      }

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as User);
      });

      // Apply search filter on client side
      let finalUsers = users;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        finalUsers = users.filter(user => 
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phoneNumber.includes(searchTerm)
        );
      }

      // Sort by createdAt on client side instead of Firestore
      finalUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return finalUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get unique home locations for filtering
  static async getHomeLocations(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const locations = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.placeOfLiving) {
          locations.add(data.placeOfLiving);
        }
      });

      return Array.from(locations).sort();
    } catch (error) {
      console.error('Error fetching home locations:', error);
      return [];
    }
  }

  // Get unique places of living for autocomplete
  static async getUniquePlacesOfLiving(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const places = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.placeOfLiving && data.placeOfLiving.trim()) {
          places.add(data.placeOfLiving.trim());
        }
      });
      
      return Array.from(places).sort();
    } catch (error) {
      console.error('Error fetching places of living:', error);
      return [];
    }
  }

  // Update user status with ban details
  static async updateUserStatus(
    userId: string, 
    updates: Partial<Pick<User, 'isActive' | 'isVerified' | 'isBanned'>> & { 
      banReason?: string; 
      banDate?: Date 
    }
  ): Promise<void> {
    try {
      console.log('Attempting to update user with ID:', userId);
      console.log('Collection name:', this.COLLECTION_NAME);
      console.log('Updates:', updates);
      
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      console.log('Document path:', `${this.COLLECTION_NAME}/${userId}`);
      
      // Check if document exists first
      const userDoc = await getDoc(userRef);
      console.log('Document exists:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('Document data:', userDoc.data());
        throw new Error(`User document not found at path: ${this.COLLECTION_NAME}/${userId}`);
      }
      
      console.log('Current document data:', userDoc.data());
      
      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // If unbanning, clear ban fields
      if (updates.isBanned === false) {
        updateData.banReason = null;
        updateData.banDate = null;
      }
      
      await updateDoc(userRef, updateData);
      
      console.log('Update successful');
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Update user live location (called from mobile app)
  static async updateLiveLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        liveLocation: {
          latitude,
          longitude,
          timestamp: new Date()
        },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating live location:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error(`User document not found at path: ${this.COLLECTION_NAME}/${userId}`);
      }
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async initializeAllUserWallets(): Promise<void> {
    try {
      const users = await this.getUsers();
      const { WalletService } = await import('./walletService');
      
      for (const user of users) {
        await WalletService.initializeWallet(user.id);
      }
    } catch (error) {
      console.error('Error initializing user wallets:', error);
    }
  }
}
