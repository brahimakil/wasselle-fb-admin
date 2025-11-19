import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserWallet, Transaction, WalletFilters, WalletStats } from '../types/wallet';
import { NotificationService } from './notificationService';

export class WalletService {
  private static readonly WALLETS_COLLECTION = 'wallets';
  private static readonly TRANSACTIONS_COLLECTION = 'transactions';

  // Check if transaction ID already exists (for admin transactions)
  static async isTransactionIdUsed(transactionId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.TRANSACTIONS_COLLECTION),
        where('__name__', '==', transactionId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking transaction ID:', error);
      return false;
    }
  }

  // Generate fallback transaction ID for non-recharge transactions
  private static generateFallbackTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `AUTO_${timestamp}_${randomStr}`.toUpperCase();
  }

  // Initialize wallet for new user
  static async initializeWallet(userId: string): Promise<void> {
    try {
      const walletRef = doc(db, this.WALLETS_COLLECTION, userId);
      const walletDoc = await getDoc(walletRef);
      
      if (!walletDoc.exists()) {
        const wallet: UserWallet = {
          userId,
          balance: 0,
          totalEarnings: 0,
          totalSpent: 0,
          totalCashouts: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(walletRef, wallet);
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
      throw error;
    }
  }

  // Get user wallet
  static async getUserWallet(userId: string): Promise<UserWallet | null> {
    try {
      const walletRef = doc(db, this.WALLETS_COLLECTION, userId);
      const walletDoc = await getDoc(walletRef);
      
      if (walletDoc.exists()) {
        const data = walletDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as UserWallet;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      return null;
    }
  }

  // Add transaction and update wallet
  static async addTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    customTransactionId?: string
  ): Promise<string> {
    try {
      // Use custom transaction ID if provided, otherwise generate fallback
      const transactionId = customTransactionId || this.generateFallbackTransactionId();
      
      // Check if custom transaction ID is already used (only check if it's a custom ID)
      if (customTransactionId) {
        const isUsed = await this.isTransactionIdUsed(customTransactionId);
        if (isUsed) {
          throw new Error('Transaction ID already exists');
        }
      }

      const batch = writeBatch(db);

      // Ensure wallet exists first
      await this.initializeWallet(transaction.userId);

      // Add transaction
      const transactionRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
      const transactionData: Transaction = {
        ...transaction,
        id: transactionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      batch.set(transactionRef, transactionData);

      // Update wallet if transaction is completed
      if (transaction.status === 'completed' || transaction.status === 'successful') {
        const walletRef = doc(db, this.WALLETS_COLLECTION, transaction.userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          const wallet = walletDoc.data() as UserWallet;
          
          // Check for sufficient balance for negative transactions (cashouts, payments)
          if (transaction.amount < 0 && wallet.balance + transaction.amount < 0) {
            throw new Error('Insufficient balance for this transaction');
          }

          const updates: Partial<UserWallet> = {
            balance: wallet.balance + transaction.amount, // This handles both positive and negative amounts
            updatedAt: new Date()
          };

          // Update totals based on transaction type
          switch (transaction.type) {
            case 'recharge':
              // Recharge doesn't affect earnings/spent totals
              break;
            case 'post_earning':
              updates.totalEarnings = wallet.totalEarnings + Math.abs(transaction.amount);
              break;
            case 'post_payment':
              updates.totalSpent = wallet.totalSpent + Math.abs(transaction.amount);
              break;
            case 'cashout':
              updates.totalCashouts = wallet.totalCashouts + Math.abs(transaction.amount);
              break;
          }

          batch.update(walletRef, updates);
        }
      }

      await batch.commit();
      return transactionId;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Recharge wallet with custom transaction ID
  static async rechargeWallet(
    userId: string, 
    amount: number, 
    description: string, 
    adminId: string,
    paymentMethodId?: string,
    externalTransactionId?: string,
    status: 'pending' | 'successful' = 'pending' // Remove cancelled from here too
  ): Promise<string> {
    if (!externalTransactionId) {
      throw new Error('External transaction ID is required for wallet recharge');
    }

    // Ensure wallet exists first
    await this.initializeWallet(userId);
    
    return await this.addTransaction({
      userId,
      type: 'recharge',
      amount: status === 'successful' ? amount : 0, // Only add points if successful
      description,
      status,
      paymentMethod: 'admin',
      paymentMethodId,
      metadata: { adminId, originalAmount: amount } // Store original amount for reference
    }, externalTransactionId); // Pass the external transaction ID as the primary ID
  }

  // Process post purchase (keeps auto-generated IDs for internal transactions)
  static async processPostPurchase(buyerId: string, authorId: string, postId: string, amount: number): Promise<{ buyerTxn: string; authorTxn: string }> {
    try {
      // Check if buyer has sufficient balance
      const buyerWallet = await this.getUserWallet(buyerId);
      if (!buyerWallet || buyerWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transactions (these use auto-generated IDs since they're internal)
      const buyerTxnId = await this.addTransaction({
        userId: buyerId,
        type: 'post_payment',
        amount: -amount,
        description: `Purchased post content`,
        relatedPostId: postId,
        relatedUserId: authorId,
        status: 'completed'
      });

      const authorTxnId = await this.addTransaction({
        userId: authorId,
        type: 'post_earning',
        amount: amount,
        description: `Earnings from post sale`,
        relatedPostId: postId,
        relatedUserId: buyerId,
        status: 'completed'
      });

      return { buyerTxn: buyerTxnId, authorTxn: authorTxnId };
    } catch (error) {
      console.error('Error processing post purchase:', error);
      throw error;
    }
  }

  // Get all wallets (admin view)
  static async getAllWallets(): Promise<UserWallet[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.WALLETS_COLLECTION));
      const wallets: UserWallet[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        wallets.push({
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as UserWallet);
      });

      return wallets.sort((a, b) => b.balance - a.balance);
    } catch (error) {
      console.error('Error getting all wallets:', error);
      return [];
    }
  }

  // Get transactions with filters
  static async getTransactions(filters?: WalletFilters): Promise<Transaction[]> {
    try {
      let q = query(collection(db, this.TRANSACTIONS_COLLECTION));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as Transaction);
      });

      // Sort by creation date (newest first)
      let finalTransactions = transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        finalTransactions = finalTransactions.filter(txn =>
          txn.id.toLowerCase().includes(searchTerm) ||
          txn.description.toLowerCase().includes(searchTerm) ||
          txn.userId.toLowerCase().includes(searchTerm)
        );
      }

      return finalTransactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Get wallet statistics
  static async getWalletStats(): Promise<WalletStats> {
    try {
      const [walletsSnapshot, transactionsSnapshot] = await Promise.all([
        getDocs(collection(db, this.WALLETS_COLLECTION)),
        getDocs(collection(db, this.TRANSACTIONS_COLLECTION))
      ]);

      let totalBalance = 0;
      walletsSnapshot.forEach((doc) => {
        const wallet = doc.data() as UserWallet;
        totalBalance += wallet.balance;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayTransactions = 0;
      let pendingTransactions = 0;

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        
        if (createdAt >= today) {
          todayTransactions++;
        }
        
        if (data.status === 'pending') {
          pendingTransactions++;
        }
      });

      return {
        totalUsers: walletsSnapshot.size,
        totalBalance,
        totalTransactions: transactionsSnapshot.size,
        todayTransactions,
        pendingTransactions
      };
    } catch (error) {
      console.error('Error getting wallet stats:', error);
      return {
        totalUsers: 0,
        totalBalance: 0,
        totalTransactions: 0,
        todayTransactions: 0,
        pendingTransactions: 0
      };
    }
  }

  // Listen to wallet changes (for real-time updates)
  static subscribeToWalletChanges(userId: string, callback: (wallet: UserWallet | null) => void): () => void {
    const walletRef = doc(db, this.WALLETS_COLLECTION, userId);
    
    return onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as UserWallet);
      } else {
        callback(null);
      }
    });
  }

  // Listen to all transactions (for admin real-time view)
  static subscribeToTransactions(callback: (transactions: Transaction[]) => void): () => void {
    const q = query(collection(db, this.TRANSACTIONS_COLLECTION), orderBy('createdAt', 'desc'), limit(100));
    
    return onSnapshot(q, (querySnapshot) => {
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as Transaction);
      });
      callback(transactions);
    });
  }

  static async updateTransactionStatus(
    transactionId: string,
    newStatus: 'successful' | 'cancelled' | 'completed',
    customAmount?: number
  ): Promise<void> {
    try {
      const transactionRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }
      
      const transaction = transactionDoc.data() as Transaction;
      
      // Allow completed cashouts to be cancelled (for refunds), but keep restriction for recharges
      if (transaction.status !== 'pending') {
        if (!(transaction.type === 'cashout' && transaction.status === 'completed' && newStatus === 'cancelled')) {
          throw new Error('Can only update pending transactions');
        }
      }
      
      // Get original amount from different possible locations
      let originalAmount = transaction.metadata?.originalAmount || 
                          transaction.originalAmount || 
                          transaction.metadata?.requestedAmount;
      
      // For cashout transactions, use absolute value of current amount if no other amount found
      if (!originalAmount && transaction.type === 'cashout') {
        originalAmount = Math.abs(transaction.amount);
      }
      
      if (!originalAmount) {
        throw new Error('Original amount not found in transaction');
      }

      // Use custom amount if provided (for admin adjustments) and it's a recharge transaction
      if (customAmount && customAmount > 0 && transaction.type === 'recharge') {
        originalAmount = customAmount;
      }
      
      // Ensure wallet exists before updating
      await this.initializeWallet(transaction.userId);
      
      const batch = writeBatch(db);
      
      // Update transaction status
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      // Handle wallet updates based on transaction type and status change
      if (newStatus === 'successful' || newStatus === 'completed') {
        // For cashouts, amount should be negative
        const finalAmount = transaction.type === 'cashout' ? -Math.abs(originalAmount) : originalAmount;
        updateData.amount = finalAmount;
        
        // Update wallet balance
        const walletRef = doc(db, this.WALLETS_COLLECTION, transaction.userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          const wallet = walletDoc.data() as UserWallet;
          batch.update(walletRef, {
            balance: wallet.balance + finalAmount,
            updatedAt: new Date()
          });
        }
      } else if (newStatus === 'cancelled' && transaction.type === 'cashout' && transaction.status === 'completed') {
        // Refund cashout: add points back to user
        const refundAmount = Math.abs(originalAmount); // Positive amount to add back
        updateData.amount = 0; // Set transaction amount to 0
        
        // Update wallet balance
        const walletRef = doc(db, this.WALLETS_COLLECTION, transaction.userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          const wallet = walletDoc.data() as UserWallet;
          batch.update(walletRef, {
            balance: wallet.balance + refundAmount, // Add points back
            updatedAt: new Date()
          });
        }
      }
      
      batch.update(transactionRef, updateData);
      await batch.commit();
      
      // Add notification for successful/completed transactions
      if (newStatus === 'successful' || newStatus === 'completed') {
        if (transaction.type === 'recharge') {
          await NotificationService.createNotification({
            userId: transaction.userId,
            type: 'wallet',
            title: '💰 Points Added to Your Wallet',
            message: `${originalAmount} points have been successfully added to your wallet. Your new balance is ready to use!`,
            data: { 
              amount: originalAmount, 
              type: 'points_added',
              transactionId: transactionId
            }
          });
        } else if (transaction.type === 'cashout') {
          await NotificationService.createNotification({
            userId: transaction.userId,
            type: 'wallet',
            title: '✅ Cashout Approved',
            message: `Your cashout of ${Math.abs(originalAmount)} points has been approved and processed. The money will be sent to your payment method.`,
            data: { 
              amount: Math.abs(originalAmount), 
              type: 'cashout_processed',
              status: 'approved',
              transactionId: transactionId
            }
          });
        }
      } else if (newStatus === 'cancelled') {
        if (transaction.type === 'recharge') {
          await NotificationService.createNotification({
            userId: transaction.userId,
            type: 'wallet',
            title: '❌ Recharge Cancelled',
            message: `Your points purchase request has been cancelled. No points were added to your wallet.`,
            data: { 
              amount: originalAmount, 
              type: 'recharge_cancelled',
              transactionId: transactionId
            }
          });
        } else if (transaction.type === 'cashout') {
          await NotificationService.createNotification({
            userId: transaction.userId,
            type: 'wallet',
            title: '❌ Cashout Rejected',
            message: `Your cashout request has been rejected. Please contact support for details.`,
            data: { 
              amount: Math.abs(originalAmount), 
              type: 'cashout_rejected',
              transactionId: transactionId
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }
}
