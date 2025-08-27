import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PaymentMethod, CreatePaymentMethodData, PaymentMethodStats } from '../types/paymentMethod';

export class PaymentMethodService {
  private static readonly COLLECTION = 'paymentMethods';

  static async createPaymentMethod(data: CreatePaymentMethodData, createdBy: string): Promise<void> {
    // Validation: At least one of phoneNumber or accountName must be provided
    if (!data.phoneNumber && !data.accountName) {
      throw new Error('Either phone number or account name must be provided');
    }

    const paymentMethodDoc = {
      name: data.name.trim(),
      phoneNumber: data.phoneNumber?.trim() || null,
      accountName: data.accountName?.trim() || null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy
    };

    await addDoc(collection(db, this.COLLECTION), paymentMethodDoc);
  }

  static async updatePaymentMethod(id: string, data: Partial<CreatePaymentMethodData>): Promise<void> {
    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber?.trim() || null;
    if (data.accountName !== undefined) updateData.accountName = data.accountName?.trim() || null;

    // Validation: At least one of phoneNumber or accountName must be provided
    const docRef = doc(db, this.COLLECTION, id);
    const currentDoc = await getDocs(query(collection(db, this.COLLECTION), where('__name__', '==', id)));
    const currentData = currentDoc.docs[0]?.data();
    
    const finalPhoneNumber = updateData.phoneNumber !== undefined ? updateData.phoneNumber : currentData?.phoneNumber;
    const finalAccountName = updateData.accountName !== undefined ? updateData.accountName : currentData?.accountName;
    
    if (!finalPhoneNumber && !finalAccountName) {
      throw new Error('Either phone number or account name must be provided');
    }

    await updateDoc(docRef, updateData);
  }

  static async togglePaymentMethodStatus(id: string): Promise<void> {
    const docRef = doc(db, this.COLLECTION, id);
    const currentDoc = await getDocs(query(collection(db, this.COLLECTION), where('__name__', '==', id)));
    const currentData = currentDoc.docs[0]?.data();
    
    await updateDoc(docRef, {
      isActive: !currentData?.isActive,
      updatedAt: Timestamp.now()
    });
  }

  static async deletePaymentMethod(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, id));
  }

  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as PaymentMethod));
  }

  static subscribeToPaymentMethods(callback: (methods: PaymentMethod[]) => void): () => void {
    const q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const methods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as PaymentMethod));
      
      callback(methods);
    });
  }

  static async getPaymentMethodStats(): Promise<PaymentMethodStats> {
    const methods = await this.getPaymentMethods();
    
    return {
      totalMethods: methods.length,
      activeMethods: methods.filter(method => method.isActive).length,
      inactiveMethods: methods.filter(method => !method.isActive).length
    };
  }
}
