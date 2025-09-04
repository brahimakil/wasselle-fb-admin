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

      // Create ONLY the transaction (remove the cashoutRequests document creation)
      const transactionId = await WalletService.addTransaction({
        userId: data.userId,
        type: 'cashout',
        amount: finalStatus === 'completed' ? -data.requestedAmount : 0,
        description: `Cashout via ${paymentMethodName} (Fee: ${data.feePercentage}%)`,
        status: finalStatus === 'completed' ? 'completed' : 'pending',
        paymentMethod: 'admin',
        paymentMethodId: data.paymentMethodId,
        metadata: { 
          adminId,
          userName,           // Add this
          userEmail,          // Add this  
          paymentMethodName,  // Add this
          feePercentage: data.feePercentage,
          feeAmount: amounts.feeAmount,
          finalAmount: amounts.finalAmount,
          requestedAmount: data.requestedAmount,  // Add this
          notes: data.notes,
          adminNotes: null,
          processedAt: finalStatus === 'completed' ? new Date() : null
        }
      }, data.externalTransactionId);

      return transactionId;
    } catch (error) {
      console.error('Error creating cashout request:', error);
      throw error;
    }
  }

  // Process cashout (deduct from wallet) - FIXED
  static async processCashout(
    transactionId: string,
    externalTransactionId: string, 
    adminId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      // Read from transactions collection instead
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Cashout transaction not found');
      }

      const transaction = transactionDoc.data();

      if (transaction.status !== 'pending') {
        throw new Error('Cashout transaction is not in pending status');
      }

      // Check if external transaction ID is already used by others (exclude current transaction)
      if (externalTransactionId && externalTransactionId !== transactionId) {
        const isUsed = await WalletService.isTransactionIdUsed(externalTransactionId);
        if (isUsed) {
          throw new Error('This transaction ID has already been used');
        }
      }

      // Update transaction status to completed and deduct points
      await WalletService.updateTransactionStatus(transactionId, 'completed');  // Use 'completed'

      // Update admin notes in metadata if provided
      if (adminNotes) {
        await updateDoc(transactionRef, {
          'metadata.adminNotes': adminNotes,
          updatedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error processing cashout:', error);
      throw error;
    }
  }

  // FASTEST - Get all cashout requests using batch queries
  static async getCashoutRequests(filters?: CashoutFilters): Promise<CashoutRequest[]> {
    try {
      let q = query(
        collection(db, 'transactions'),
        where('type', '==', 'cashout'),
        orderBy('createdAt', 'desc')
      );

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
      
      // Collect unique IDs
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
      const paymentMethodIds = [...new Set(snapshot.docs.map(doc => doc.data().paymentMethodId).filter(Boolean))];

      // Use Firestore 'in' queries for batch fetching (max 10 per query)
      const fetchUsers = async (ids: string[]) => {
        const chunks = [];
        for (let i = 0; i < ids.length; i += 10) {
          chunks.push(ids.slice(i, i + 10));
        }
        
        const userPromises = chunks.map(chunk => 
          getDocs(query(collection(db, 'users'), where('__name__', 'in', chunk)))
        );
        
        const results = await Promise.all(userPromises);
        const usersMap = new Map();
        results.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            usersMap.set(doc.id, doc.data());
          });
        });
        return usersMap;
      };

      const fetchPaymentMethods = async (ids: string[]) => {
        const chunks = [];
        for (let i = 0; i < ids.length; i += 10) {
          chunks.push(ids.slice(i, i + 10));
        }
        
        const paymentPromises = chunks.map(chunk => 
          getDocs(query(collection(db, 'paymentMethods'), where('__name__', 'in', chunk)))
        );
        
        const results = await Promise.all(paymentPromises);
        const paymentsMap = new Map();
        results.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            paymentsMap.set(doc.id, doc.data());
          });
        });
        return paymentsMap;
      };

      // Fetch all data in parallel
      const [usersMap, paymentsMap] = await Promise.all([
        userIds.length > 0 ? fetchUsers(userIds) : new Map(),
        paymentMethodIds.length > 0 ? fetchPaymentMethods(paymentMethodIds) : new Map()
      ]);

      // Build results
      let cashouts: CashoutRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const metadata = data.metadata || {};
        
        const userData = usersMap.get(data.userId);
        const paymentData = paymentsMap.get(data.paymentMethodId);
        
        cashouts.push({
          id: docSnap.id,
          userId: data.userId,
          userName: metadata.userName || userData?.fullName || 'Unknown',
          userEmail: metadata.userEmail || userData?.email || 'Unknown',
          requestedAmount: metadata.requestedAmount || Math.abs(data.amount),
          feePercentage: metadata.feePercentage || 0,
          feeAmount: metadata.feeAmount || 0,
          finalAmount: metadata.finalAmount || 0,
          paymentMethodId: data.paymentMethodId,
          paymentMethodName: metadata.paymentMethodName || paymentData?.name || 'Unknown',
          externalTransactionId: docSnap.id,
          status: data.status,
          notes: metadata.notes,
          adminId: metadata.adminId,
          adminNotes: metadata.adminNotes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          processedAt: metadata.processedAt || (data.status === 'completed' ? data.updatedAt?.toDate() : null)
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

  // Get cashout statistics (read from transactions)
  static async getCashoutStats(): Promise<CashoutStats> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'cashout')
      );
      const snapshot = await getDocs(q);
      
      let totalRequests = 0;
      let pendingRequests = 0;
      let completedRequests = 0;
      let totalCashedOut = 0;
      let adminEarnings = 0;
      let todayRequests = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const transaction = doc.data();
        const metadata = transaction.metadata || {};
        totalRequests++;

        if (transaction.status === 'pending' || transaction.status === 'processing') {
          pendingRequests++;
        } else if (transaction.status === 'completed') {
          completedRequests++;
          totalCashedOut += metadata.finalAmount || 0;
          adminEarnings += metadata.feeAmount || 0;
        }

        if (transaction.createdAt?.toDate() >= today) {
          todayRequests++;
        }
      });

      return {
        totalRequests,
        pendingRequests,
        completedRequests,
        totalCashedOut: Math.round(totalCashedOut * 100) / 100,
        adminEarnings: Math.round(adminEarnings * 100) / 100,
        todayRequests
      };
    } catch (error) {
      console.error('Error getting cashout stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        totalCashedOut: 0,
        adminEarnings: 0,
        todayRequests: 0
      };
    }
  }

  // Update cashout status (update transaction)
  static async updateCashoutStatus(
    transactionId: string, 
    newStatus: CashoutRequest['status'],
    adminId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      // Map cashout status to transaction status
      if (newStatus === 'completed') {
        await WalletService.updateTransactionStatus(transactionId, 'completed');
      } else if (newStatus === 'cancelled') {
        await WalletService.updateTransactionStatus(transactionId, 'cancelled');
      }
      
      // Update admin notes in metadata
      if (adminNotes) {
        const transactionRef = doc(db, 'transactions', transactionId);
        const transactionDoc = await getDoc(transactionRef);
        
        if (transactionDoc.exists()) {
          const currentMetadata = transactionDoc.data().metadata || {};
          await updateDoc(transactionRef, {
            'metadata.adminNotes': adminNotes,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating cashout status:', error);
      throw error;
    }
  }
}