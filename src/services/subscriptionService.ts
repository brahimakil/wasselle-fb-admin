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
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PostSubscription, SubscriptionFilters } from '../types/post';
import { WalletService } from './walletService';
import { NotificationService } from './notificationService';

export class SubscriptionService {
  private static readonly SUBSCRIPTIONS_COLLECTION = 'postSubscriptions';
  private static readonly POSTS_COLLECTION = 'posts';

  private static async getAuthorNameById(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data().fullName || 'Unknown' : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  // Subscribe to a post
  static async subscribeToPost(
    postId: string, 
    subscriberId: string, 
    subscriberName: string,
    subscriberEmail: string
  ): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Get post details
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const post = postDoc.data();
      
      // Check if post is still available for subscription
      if (post.status !== 'active') {
        throw new Error('This post is no longer available for subscription');
      }
      
      // Use the correct author ID field
      const authorId = post.userId || post.authorId;
      
      // Check if post is already subscribed
      if (post.status === 'subscribed') {
        throw new Error('This post is already subscribed by another user');
      }

      // Check if user has sufficient balance
      const subscriberWallet = await WalletService.getUserWallet(subscriberId);
      if (!subscriberWallet || subscriberWallet.balance < post.cost) {
        throw new Error(`Insufficient balance. Required: ${post.cost} points, Available: ${subscriberWallet?.balance || 0} points`);
      }

      // Process payment transaction
      const { buyerTxn, authorTxn } = await WalletService.processPostPurchase(
        subscriberId,
        authorId, // Use the correct author ID
        postId,
        post.cost
      );

      // Create subscription record
      const subscriptionId = doc(collection(db, this.SUBSCRIPTIONS_COLLECTION)).id;
      const subscription: PostSubscription = {
        id: subscriptionId,
        postId,
        postTitle: post.title || `${post.serviceType} Trip - ${post.departureDate}`, // Fix this line
        postCost: post.cost,
        subscriberId,
        subscriberName,
        subscriberEmail,
        authorId: post.userId || post.authorId, // Fix this line
        authorName: post.authorName || 'Unknown', // This will be fixed later
        authorEmail: post.authorEmail || '',
        transactionId: buyerTxn,
        status: 'active',
        subscribedAt: new Date()
      };

      batch.set(doc(db, this.SUBSCRIPTIONS_COLLECTION, subscriptionId), subscription);

      // Update post status
      batch.update(postRef, {
        status: 'subscribed', // ONLY this
        subscriberId,
        subscribedAt: new Date(),
        subscriptionCount: (post.subscriptionCount || 0) + 1,
        totalEarnings: (post.totalEarnings || 0) + post.cost,
        updatedAt: new Date()
        // Remove: isActive, isSubscribed - don't use these anymore
      });

      await batch.commit();

      // Send notifications after successful transaction
      const authorName = await this.getAuthorNameById(post.userId || post.createdBy);
      await NotificationService.createTransactionNotifications(
        subscriberId,
        subscriberName,
        post.userId || post.createdBy,
        authorName,
        post.cost,
        buyerTxn,
        post.title,
        subscriptionId
      );

      return subscriptionId;
    } catch (error) {
      console.error('Error subscribing to post:', error);
      throw error;
    }
  }

  // Cancel subscription (no refund)
  static async cancelSubscription(
    subscriptionId: string, 
    cancellationReason: string = 'User cancellation'
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Get subscription details
      const subscriptionRef = doc(db, this.SUBSCRIPTIONS_COLLECTION, subscriptionId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data() as PostSubscription;

      // Update subscription status
      batch.update(subscriptionRef, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason
      });

      // Update post status back to active
      const postRef = doc(db, this.POSTS_COLLECTION, subscription.postId);
      batch.update(postRef, {
        status: 'active',
        subscriberId: null,
        subscribedAt: null,
        updatedAt: new Date()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get user's subscriptions
  static async getUserSubscriptions(userId: string): Promise<PostSubscription[]> {
    try {
      const q = query(
        collection(db, this.SUBSCRIPTIONS_COLLECTION),
        where('subscriberId', '==', userId),
        orderBy('subscribedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const subscriptions: PostSubscription[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subscriptions.push({
          ...data,
          subscribedAt: data.subscribedAt.toDate(),
          cancelledAt: data.cancelledAt?.toDate()
        } as PostSubscription);
      });

      return subscriptions;
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }

  // Get post subscriptions (for post owners)
  static async getPostSubscriptions(authorId: string): Promise<PostSubscription[]> {
    try {
      const q = query(
        collection(db, this.SUBSCRIPTIONS_COLLECTION),
        where('authorId', '==', authorId),
        orderBy('subscribedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const subscriptions: PostSubscription[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subscriptions.push({
          ...data,
          subscribedAt: data.subscribedAt.toDate(),
          cancelledAt: data.cancelledAt?.toDate()
        } as PostSubscription);
      });

      return subscriptions;
    } catch (error) {
      console.error('Error getting post subscriptions:', error);
      return [];
    }
  }

  // Get all subscriptions (admin view)
  static async getAllSubscriptions(filters?: SubscriptionFilters): Promise<PostSubscription[]> {
    try {
      let q = query(collection(db, this.SUBSCRIPTIONS_COLLECTION), orderBy('subscribedAt', 'desc'));

      if (filters?.subscriberId) {
        q = query(q, where('subscriberId', '==', filters.subscriberId));
      }

      if (filters?.authorId) {
        q = query(q, where('authorId', '==', filters.authorId));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      let subscriptions: PostSubscription[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subscriptions.push({
          ...data,
          subscribedAt: data.subscribedAt.toDate(),
          cancelledAt: data.cancelledAt?.toDate()
        } as PostSubscription);
      });

      // Apply search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        subscriptions = subscriptions.filter(sub =>
          sub.postTitle.toLowerCase().includes(searchTerm) ||
          sub.subscriberName.toLowerCase().includes(searchTerm) ||
          sub.authorName.toLowerCase().includes(searchTerm) ||
          sub.subscriberEmail.toLowerCase().includes(searchTerm)
        );
      }

      return subscriptions;
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      return [];
    }
  }

  // Get subscription statistics
  static async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    totalRevenue: number;
    todaySubscriptions: number;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, this.SUBSCRIPTIONS_COLLECTION));
      
      let totalSubscriptions = 0;
      let activeSubscriptions = 0;
      let cancelledSubscriptions = 0;
      let totalRevenue = 0;
      let todaySubscriptions = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      querySnapshot.forEach((doc) => {
        const subscription = doc.data() as PostSubscription;
        totalSubscriptions++;
        totalRevenue += subscription.postCost;

        if (subscription.status === 'active') {
          activeSubscriptions++;
        } else {
          cancelledSubscriptions++;
        }

        if (subscription.subscribedAt.toDate() >= today) {
          todaySubscriptions++;
        }
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        totalRevenue,
        todaySubscriptions
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        todaySubscriptions: 0
      };
    }
  }
}
