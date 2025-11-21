import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface BlacklistedPlate {
  id: string;
  licensePlate: string;
  reason?: string;
  blacklistedAt: Date;
  blacklistedBy: string;
  updatedAt: Date;
}

export class BlacklistService {
  private static readonly COLLECTION_NAME = 'blacklistedPlates';

  // Add license plate to blacklist
  static async addToBlacklist(
    licensePlate: string,
    adminId: string,
    reason?: string
  ): Promise<string> {
    try {
      const normalizedPlate = licensePlate.toUpperCase().trim();
      
      // Check if already blacklisted
      const existing = await this.isBlacklisted(normalizedPlate);
      if (existing) {
        throw new Error('This license plate is already blacklisted');
      }

      const blacklistData: Omit<BlacklistedPlate, 'id'> = {
        licensePlate: normalizedPlate,
        reason: reason || 'No reason provided',
        blacklistedAt: new Date(),
        blacklistedBy: adminId,
        updatedAt: new Date()
      };

      const docRef = doc(db, this.COLLECTION_NAME, normalizedPlate);
      await setDoc(docRef, blacklistData);

      return normalizedPlate;
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      throw error;
    }
  }

  // Remove license plate from blacklist
  static async removeFromBlacklist(licensePlate: string): Promise<void> {
    try {
      const normalizedPlate = licensePlate.toUpperCase().trim();
      const docRef = doc(db, this.COLLECTION_NAME, normalizedPlate);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      throw error;
    }
  }

  // Check if license plate is blacklisted
  static async isBlacklisted(licensePlate: string): Promise<boolean> {
    try {
      const normalizedPlate = licensePlate.toUpperCase().trim();
      const docRef = doc(db, this.COLLECTION_NAME, normalizedPlate);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false;
    }
  }

  // Get blacklist entry details
  static async getBlacklistEntry(licensePlate: string): Promise<BlacklistedPlate | null> {
    try {
      const normalizedPlate = licensePlate.toUpperCase().trim();
      const docRef = doc(db, this.COLLECTION_NAME, normalizedPlate);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        licensePlate: data.licensePlate,
        reason: data.reason,
        blacklistedAt: data.blacklistedAt?.toDate() || new Date(),
        blacklistedBy: data.blacklistedBy,
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting blacklist entry:', error);
      return null;
    }
  }

  // Get all blacklisted plates
  static async getAllBlacklisted(): Promise<BlacklistedPlate[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          licensePlate: data.licensePlate,
          reason: data.reason,
          blacklistedAt: data.blacklistedAt?.toDate() || new Date(),
          blacklistedBy: data.blacklistedBy,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting blacklisted plates:', error);
      return [];
    }
  }

  // Search blacklisted plates
  static async searchBlacklisted(searchTerm: string): Promise<BlacklistedPlate[]> {
    try {
      const allBlacklisted = await this.getAllBlacklisted();
      const searchLower = searchTerm.toLowerCase();
      
      return allBlacklisted.filter(entry => 
        entry.licensePlate.toLowerCase().includes(searchLower) ||
        entry.reason?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching blacklisted plates:', error);
      return [];
    }
  }
}
