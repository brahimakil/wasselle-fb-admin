import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CashoutRequest, CreateCashoutData, CashoutFilters, CashoutStats } from '../types/cashout';
import { WalletService } from './walletService';

export class CashoutService {
  private static readonly CASHOUTS_COLLECTION = 'cashoutRequests';

  // Add a new method to check if transaction ID is used by other cashouts
  static async isTransactionIdUsedByOthers(externalTransactionId: string, excludeCashoutId?: string): Promise<boolean> {
    try {
      // Check in cashouts collection
      const cashoutQuery = query(
        collection(db, this.CASHOUTS_COLLECTION),
        where('externalTransactionId', '==', externalTransactionId)
      );
      const cashoutSnapshot = await getDocs(cashoutQuery);
      
      // If found in cashouts, check if it's the same cashout we're editing
      if (!cashoutSnapshot.empty) {
        const foundInSameCashout = cashoutSnapshot.docs.some(doc => doc.id === excludeCashoutId);
        if (foundInSameCashout && cashoutSnapshot.docs.length === 1) {
          // Only found in the current cashout being edited, so it's not used by others
          return false;
        }
        // Found in other cashouts or multiple places
        return true;
      }
      
      // Also check if it exists as a wallet transaction ID (but not created by this cashout)
      const walletQuery = query(
        collection(db, 'transactions'),
        where('id', '==', externalTransactionId)
      );
      const walletSnapshot = await getDocs(walletQuery);
      
      if (!walletSnapshot.empty) {
        // Check if this transaction was created by the current cashout
        const transaction = walletSnapshot.docs[0].data();
        const isFromCurrentCashout = transaction.metadata?.cashoutId === excludeCashoutId;
        return !isFromCurrentCashout; // Used by others if not from current cashout
      }
      
      return false;
    } catch (error) {
      console.error('Error checking transaction ID usage:', error);
      return false;
    }
  }

  // Keep the original method for backward compatibility
  static async isTransactionIdUsed(externalTransactionId: string): Promise<boolean> {
    return this.isTransactionIdUsedByOthers(externalTransactionId);
  }

  // Calculate cashout amounts with fee
  static calculateCashoutAmounts(requestedPoints: number, feePercentage: number) {
    const requestedDollars = requestedPoints; // 1 point = 1 dollar
    
    // Use integer arithmetic to avoid floating-point precision issues
    const requestedCents = Math.round(requestedDollars * 100); // Convert to cents
    const feeCents = Math.round(requestedCents * (feePercentage / 100)); // Calculate fee in cents
    const finalCents = requestedCents - feeCents; // Subtract in cents
    
    return {
      requestedAmount: Math.round(requestedPoints), // Ensure integer points
      requestedDollars: requestedCents / 100,
      feeAmount: feeCents / 100,
      finalAmount: finalCents / 100
    };
  }

  // Create cashout request
  static async createCashoutRequest(
    data: CreateCashoutData,
    adminId: string,
    userName: string,
    userEmail: string,
    paymentMethodName: string
  ): Promise<string> {
    try {
      // Check if user has sufficient balance
      const userWallet = await WalletService.getUserWallet(data.userId);
      if (!userWallet || userWallet.balance < data.requestedAmount) {
        throw new Error('Insufficient balance for cashout');
      }

      // Determine final status based on user selection
      const finalStatus = data.initialStatus || 'pending';
      
      // For completed status, transaction ID is required
      if (finalStatus === 'completed' && !data.externalTransactionId) {
        throw new Error('Transaction ID is required for completed status');
      }

      // Check if external transaction ID is provided and not already used
      if (data.externalTransactionId) {
        const isUsed = await this.isTransactionIdUsed(data.externalTransactionId);
        if (isUsed) {
          throw new Error('This transaction ID has already been used');
        }
      }

      // Calculate amounts
      const amounts = this.calculateCashoutAmounts(data.requestedAmount, data.feePercentage);

      const cashoutRequest = {
        userId: data.userId,
        userName,
        userEmail,
        requestedAmount: data.requestedAmount,
        feePercentage: data.feePercentage,
        feeAmount: amounts.feeAmount,
        finalAmount: amounts.finalAmount,
        paymentMethodId: data.paymentMethodId,
        paymentMethodName,
        externalTransactionId: data.externalTransactionId || null,
        status: finalStatus,  // Use the selected status
        notes: data.notes || null,
        adminId,
        adminNotes: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        processedAt: finalStatus === 'completed' ? Timestamp.now() : null
      };

      const docRef = await addDoc(collection(db, this.CASHOUTS_COLLECTION), cashoutRequest);

      // If status is completed, deduct points immediately
      if (finalStatus === 'completed') {
        await WalletService.addTransaction({
          userId: data.userId,
          type: 'cashout',
          amount: -data.requestedAmount,
          description: `Cashout via ${paymentMethodName} (Fee: ${data.feePercentage}%)`,
          status: 'completed',
          paymentMethod: 'admin',
          paymentMethodId: data.paymentMethodId,
          metadata: { 
            adminId,
            cashoutId: docRef.id,
            feePercentage: data.feePercentage,
            feeAmount: amounts.feeAmount,
            finalAmount: amounts.finalAmount
          }
        }, data.externalTransactionId);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating cashout request:', error);
      throw error;
    }
  }

  // Process cashout (deduct from wallet)
  static async processCashout(
    cashoutId: string, 
    externalTransactionId: string, 
    adminId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const cashoutRef = doc(db, this.CASHOUTS_COLLECTION, cashoutId);
      const cashoutDoc = await getDoc(cashoutRef);

      if (!cashoutDoc.exists()) {
        throw new Error('Cashout request not found');
      }

      const cashout = cashoutDoc.data() as CashoutRequest;

      if (cashout.status !== 'pending' && cashout.status !== 'processing') {
        throw new Error('Cashout request is not in pending or processing status');
      }

      // Check if external transaction ID is already used by others (exclude current cashout)
      if (externalTransactionId && externalTransactionId !== cashout.externalTransactionId) {
        const isUsed = await this.isTransactionIdUsedByOthers(externalTransactionId, cashoutId);
        if (isUsed) {
          throw new Error('This transaction ID has already been used');
        }
      }

      const batch = writeBatch(db);

      // Create or update wallet transaction
      await WalletService.addTransaction({
        userId: cashout.userId,
        type: 'cashout',
        amount: -cashout.requestedAmount,
        description: `Cashout via ${cashout.paymentMethodName} (Fee: ${cashout.feePercentage}%)`,
        status: 'completed',
        paymentMethod: 'admin',
        paymentMethodId: cashout.paymentMethodId,
        metadata: { 
          adminId,
          cashoutId,
          feePercentage: cashout.feePercentage,
          feeAmount: cashout.feeAmount,
          finalAmount: cashout.finalAmount
        }
      }, externalTransactionId);

      // Update cashout request
      batch.update(cashoutRef, {
        status: 'completed',
        externalTransactionId,
        adminNotes,
        updatedAt: Timestamp.now(),
        processedAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error processing cashout:', error);
      throw error;
    }
  }

  // Get all cashout requests
  static async getCashoutRequests(filters?: CashoutFilters): Promise<CashoutRequest[]> {
    try {
      let q = query(collection(db, this.CASHOUTS_COLLECTION), orderBy('createdAt', 'desc'));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.paymentMethodId) {
        q = query(q, where('paymentMethodId', '==', filters.paymentMethodId));
      }

      const snapshot = await getDocs(q);
      let cashouts: CashoutRequest[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        cashouts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate()
        } as CashoutRequest);
      });

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        cashouts = cashouts.filter(cashout =>
          cashout.userName.toLowerCase().includes(searchTerm) ||
          cashout.userEmail.toLowerCase().includes(searchTerm) ||
          cashout.paymentMethodName.toLowerCase().includes(searchTerm) ||
          cashout.externalTransactionId?.toLowerCase().includes(searchTerm) ||
          cashout.notes?.toLowerCase().includes(searchTerm)
        );
      }

      return cashouts;
    } catch (error) {
      console.error('Error getting cashout requests:', error);
      return [];
    }
  }

  // Get cashout statistics
  static async getCashoutStats(): Promise<CashoutStats> {
    try {
      const snapshot = await getDocs(collection(db, this.CASHOUTS_COLLECTION));
      
      let totalRequests = 0;
      let pendingRequests = 0;
      let completedRequests = 0;
      let totalCashedOut = 0;
      let adminEarnings = 0;  // Changed from totalFees
      let todayRequests = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const cashout = doc.data() as CashoutRequest;
        totalRequests++;

        if (cashout.status === 'pending' || cashout.status === 'processing') {
          pendingRequests++;
        } else if (cashout.status === 'completed') {
          completedRequests++;
          totalCashedOut += cashout.finalAmount;
          adminEarnings += cashout.feeAmount;  // Changed from totalFees
        }

        if (cashout.createdAt.toDate() >= today) {
          todayRequests++;
        }
      });

      return {
        totalRequests,
        pendingRequests,
        completedRequests,
        totalCashedOut: Math.round(totalCashedOut * 100) / 100,
        adminEarnings: Math.round(adminEarnings * 100) / 100,  // Changed from totalFees
        todayRequests
      };
    } catch (error) {
      console.error('Error getting cashout stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        totalCashedOut: 0,
        adminEarnings: 0,  // Changed from totalFees
        todayRequests: 0
      };
    }
  }

  // Update cashout status
  static async updateCashoutStatus(
    cashoutId: string, 
    newStatus: CashoutRequest['status'],
    adminId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const cashoutRef = doc(db, this.CASHOUTS_COLLECTION, cashoutId);
      const cashoutDoc = await getDoc(cashoutRef);

      if (!cashoutDoc.exists()) {
        throw new Error('Cashout request not found');
      }

      const cashout = cashoutDoc.data() as CashoutRequest;
      const oldStatus = cashout.status;

      // Prevent changing from cancelled status
      if (oldStatus === 'cancelled') {
        throw new Error('Cannot change status of a cancelled cashout request');
      }

      // Prevent setting to same status
      if (oldStatus === newStatus) {
        throw new Error(`Cashout is already ${newStatus}`);
      }

      const batch = writeBatch(db);

      // Handle point transactions based on status transitions
      if (oldStatus === 'pending' && newStatus === 'completed') {
        // Deduct points from user
        await WalletService.addTransaction({
          userId: cashout.userId,
          type: 'cashout',
          amount: -cashout.requestedAmount,
          description: `Cashout via ${cashout.paymentMethodName} (Fee: ${cashout.feePercentage}%)`,
          status: 'completed',
          paymentMethod: 'admin',
          paymentMethodId: cashout.paymentMethodId,
          metadata: { 
            adminId,
            cashoutId,
            feePercentage: cashout.feePercentage,
            feeAmount: cashout.feeAmount,
            finalAmount: cashout.finalAmount,
            statusTransition: `${oldStatus} → ${newStatus}`
          }
        });
      } else if (oldStatus === 'completed' && newStatus === 'cancelled') {
        // Add points back to user (reverse the deduction)
        await WalletService.addTransaction({
          userId: cashout.userId,
          type: 'admin_adjustment',
          amount: cashout.requestedAmount, // Positive amount to add back
          description: `Cashout cancellation refund - ${cashout.paymentMethodName}`,
          status: 'completed',
          paymentMethod: 'admin',
          metadata: { 
            adminId,
            cashoutId,
            originalFeePercentage: cashout.feePercentage,
            originalFeeAmount: cashout.feeAmount,
            originalFinalAmount: cashout.finalAmount,
            statusTransition: `${oldStatus} → ${newStatus}`,
            refundReason: 'Cashout cancelled after completion'
          }
        });
      }
      // For pending → cancelled, no point transaction needed

      // Update cashout document
      const updateData: any = {
        status: newStatus,
        adminNotes: adminNotes || cashout.adminNotes,
        updatedAt: Timestamp.now()
      };

      if (newStatus === 'completed') {
        updateData.processedAt = Timestamp.now();
      }

      batch.update(cashoutRef, updateData);
      await batch.commit();

    } catch (error) {
      console.error('Error updating cashout status:', error);
      throw error;
    }
  }
}