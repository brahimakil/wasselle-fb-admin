import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface AppSettings {
  defaultCashoutFeePercentage: number;
  updatedAt: Date;
  updatedBy: string;
}

export class SettingsService {
  private static readonly SETTINGS_DOC = 'settings';
  private static readonly SETTINGS_ID = 'app';

  // Get app settings
  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsRef = doc(db, this.SETTINGS_DOC, this.SETTINGS_ID);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          defaultCashoutFeePercentage: data.defaultCashoutFeePercentage || 5,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || ''
        };
      }

      // Return default settings if not found
      return {
        defaultCashoutFeePercentage: 5,
        updatedAt: new Date(),
        updatedBy: ''
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return default on error
      return {
        defaultCashoutFeePercentage: 5,
        updatedAt: new Date(),
        updatedBy: ''
      };
    }
  }

  // Update default cashout fee percentage
  static async updateDefaultCashoutFee(
    feePercentage: number,
    adminId: string
  ): Promise<void> {
    try {
      if (feePercentage < 0 || feePercentage > 100) {
        throw new Error('Fee percentage must be between 0 and 100');
      }

      const settingsRef = doc(db, this.SETTINGS_DOC, this.SETTINGS_ID);
      await setDoc(settingsRef, {
        defaultCashoutFeePercentage: feePercentage,
        updatedAt: new Date(),
        updatedBy: adminId
      }, { merge: true });
    } catch (error) {
      console.error('Error updating default cashout fee:', error);
      throw error;
    }
  }
}
