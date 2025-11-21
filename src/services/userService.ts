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
  updatePassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import type { User, CreateUserData, UserFilters } from '../types/user';
import { WalletService } from './walletService';
import type { Transaction, UserWallet } from '../types/wallet';
import { NotificationService } from './notificationService';

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
        countryId: userData.countryId,
        cityId: userData.cityId,
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

  // Generate random password
  // Reset user password via Firebase Cloud Function (uses Admin SDK)
  static async resetUserPassword(userId: string, userEmail: string, newPassword: string, adminId: string): Promise<void> {
    try {
      // Import Firebase Functions
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      
      // Call the Cloud Function
      const resetPassword = httpsCallable(functions, 'resetUserPassword');
      const result = await resetPassword({
        userId,
        newPassword,
        adminId
      });

      console.log('Password reset result:', result.data);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  // Get a single user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Get all users with optional filters
  static async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      // Remove orderBy to avoid needing composite indexes
      let q = query(collection(db, this.COLLECTION_NAME));

      if (filters?.countryId) {
        q = query(q, where('countryId', '==', filters.countryId));
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
        const searchTerm = filters.search.toLowerCase().trim();
        finalUsers = users.filter(user => {
          const fullName = (user.fullName || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const phoneNumber = (user.phoneNumber || '');
          
          return fullName.includes(searchTerm) ||
                 email.includes(searchTerm) ||
                 phoneNumber.includes(searchTerm);
        });
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
  static async getHomeLocations(): Promise<Array<{id: string, name: string, flag?: string}>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const countryIds = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.countryId) {
          countryIds.add(data.countryId);
        }
      });

      // Get country details
      const countries: Array<{id: string, name: string, flag?: string}> = [];
      for (const countryId of countryIds) {
        try {
          const countryDoc = await getDoc(doc(db, 'countries', countryId));
          if (countryDoc.exists()) {
            const countryData = countryDoc.data();
            countries.push({
              id: countryId,
              name: countryData.name,
              flag: countryData.flag
            });
          }
        } catch (error) {
          console.error(`Error fetching country ${countryId}:`, error);
        }
      }

      return countries.sort((a, b) => a.name.localeCompare(b.name));
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

  // Update user status (activate/deactivate)
  static async updateUserStatus(userId: string, isActive: boolean, adminId: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: new Date()
      });

      // Add notification
      if (isActive) {
        await NotificationService.createNotification({
          userId,
          type: 'account',
          title: '🎉 Account Activated',
          message: 'Congratulations! Your account has been activated by an admin. You can now create posts and subscribe to other posts.',
          data: { type: 'account_activated', adminId }
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Update user verification status
  static async updateUserVerification(userId: string, isVerified: boolean, adminId: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        isVerified,
        updatedAt: new Date()
      });

      // Add notification
      if (isVerified) {
        await NotificationService.createNotification({
          userId,
          type: 'account',
          title: '✅ Account Verified',
          message: 'Your account has been verified! You now have a verification badge on your profile.',
          data: { type: 'account_verified', adminId }
        });
      }
    } catch (error) {
      console.error('Error updating user verification:', error);
      throw error;
    }
  }

  // Ban user
  static async banUser(userId: string, reason: string, adminId: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        isBanned: true,
        banReason: reason,
        banDate: new Date(),
        updatedAt: new Date()
      });

      // Add notification
      await NotificationService.createNotification({
        userId,
        type: 'account',
        title: '🚫 Account Banned',
        message: `Your account has been banned by an admin.${reason ? ` Reason: ${reason}` : ' Contact support for more information.'}`,
        data: { type: 'account_banned', reason, adminId }
      });
    } catch (error) {
      console.error('Error banning user:', error);
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

  // Send password reset email to user
  static async sendPasswordResetToUser(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
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
