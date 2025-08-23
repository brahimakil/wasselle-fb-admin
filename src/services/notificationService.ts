import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Notification, CreateNotificationData } from '../types/notification';

export class NotificationService {
  private static readonly NOTIFICATIONS_COLLECTION = 'notifications';

  // Create a new notification
  static async createNotification(notificationData: CreateNotificationData): Promise<string> {
    try {
      const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), notification);
      console.log(`📧 Notification created for user ${notificationData.userId}: ${notificationData.title}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create transaction notifications for both parties
  static async createTransactionNotifications(
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    amount: number,
    transactionId: string,
    postTitle: string,
    subscriptionId: string
  ): Promise<void> {
    try {
      // Notification for buyer (subscriber)
      await this.createNotification({
        userId: buyerId,
        type: 'transaction',
        title: 'Subscription Payment Processed',
        message: `You successfully subscribed to "${postTitle}" for ${amount} points. Your subscription is now active.`,
        data: {
          transactionId,
          subscriptionId,
          amount: -amount, // Negative for deduction
          type: 'subscription_payment',
          partnerName: sellerName || 'Unknown'
        }
      });

      // Notification for seller (post owner)
      await this.createNotification({
        userId: sellerId,
        type: 'transaction',
        title: 'Subscription Payment Received',
        message: `${buyerName} subscribed to your post "${postTitle}". You earned ${amount} points!`,
        data: {
          transactionId,
          subscriptionId,
          amount: amount, // Positive for earning
          type: 'subscription_earning',
          partnerName: buyerName || 'Unknown'
        }
      });

      console.log(`📧 Transaction notifications sent for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error creating transaction notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Notification);
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all user notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = db.batch ? db.batch() : null;

      if (!batch) {
        // Fallback if batch is not available
        for (const docSnapshot of querySnapshot.docs) {
          await updateDoc(docSnapshot.ref, {
            isRead: true,
            updatedAt: new Date()
          });
        }
      } else {
        querySnapshot.docs.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            isRead: true,
            updatedAt: new Date()
          });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}