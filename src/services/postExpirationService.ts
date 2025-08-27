import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SubscriptionService } from './subscriptionService';

export class PostExpirationService {
  private static readonly POSTS_COLLECTION = 'posts';
  private static readonly SYSTEM_LOGS_COLLECTION = 'systemLogs';

  // Helper function to combine date and time strings into a Date object
  private static combineDateAndTime(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Check if a post's travel time has expired
  private static isPostExpired(post: any): boolean {
    const now = new Date();
    
    // Check departure time
    const departureDateTime = this.combineDateAndTime(post.departureDate, post.departureTime);
    
    // If no return trip, check only departure time
    if (!post.hasReturnTrip || !post.returnDate || !post.returnTime) {
      return now > departureDateTime;
    }
    
    // If has return trip, check return time
    const returnDateTime = this.combineDateAndTime(post.returnDate, post.returnTime);
    return now > returnDateTime;
  }

  // Main function to check and expire posts
  static async checkAndExpirePosts(): Promise<{
    success: boolean;
    processedCount: number;
    expiredCount: number;
    expiredPosts: Array<{id: string, title: string, serviceType?: string}>; // Updated type
    error?: string;
  }> {
    try {
      console.log('🔍 Checking for expired posts...');
      
      // Query posts that are either active or subscribed
      const postsQuery = query(
        collection(db, this.POSTS_COLLECTION),
        where('status', 'in', ['active', 'subscribed'])
      );
      
      const querySnapshot = await getDocs(postsQuery);
      
      if (querySnapshot.empty) {
        console.log('✅ No active or subscribed posts found');
        return {
          success: true,
          processedCount: 0,
          expiredCount: 0,
          expiredPosts: []
        };
      }
      
      const batch = writeBatch(db);
      const expiredPosts: Array<{id: string, title: string, serviceType?: string}> = []; // Updated type
      const expiredSubscriptions: string[] = [];
      let processedCount = 0;
      
      // Check each post for expiration
      for (const docSnapshot of querySnapshot.docs) {
        const post = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Skip if post doesn't have required date/time fields
        if (!post.departureDate || !post.departureTime) {
          console.log(`⚠️ Skipping post ${post.id}: missing departure date/time`);
          continue;
        }
        
        // Check if post is expired
        if (this.isPostExpired(post)) {
          console.log(`⏰ Post ${post.id} is expired, updating status to cancelled`);
          
          // Update post status to cancelled
          const postRef = doc(db, this.POSTS_COLLECTION, post.id);
          batch.update(postRef, {
            status: 'cancelled', // ONLY this
            updatedAt: new Date(),
            expiredAt: new Date(),
            autoExpired: true,
            expiredReason: 'Travel time completed'
          });
          
          // Create a readable title for the post
          const postTitle = post.description 
            ? `${post.serviceType || 'Post'}: ${post.description.substring(0, 30)}${post.description.length > 30 ? '...' : ''}`
            : `${post.serviceType || 'Post'} from ${post.departureDate}`;
          
          expiredPosts.push({
            id: post.id,
            title: postTitle,
            serviceType: post.serviceType
          });
          
          // If post was subscribed, we need to cancel the subscription
          if (post.status === 'subscribed' && post.subscriberId) {
            expiredSubscriptions.push(post.subscriberId);
          }
        }
        
        processedCount++;
      }
      
      // Commit all post updates
      if (expiredPosts.length > 0) {
        await batch.commit();
        console.log(`✅ Successfully updated ${expiredPosts.length} expired posts:`, expiredPosts);
        
        // Handle subscription cancellations separately
        if (expiredSubscriptions.length > 0) {
          await this.cancelExpiredSubscriptions(expiredPosts.map(p => p.id), expiredSubscriptions);
        }
        
        // Log to system logs
        await addDoc(collection(db, this.SYSTEM_LOGS_COLLECTION), {
          type: 'auto_expire_posts',
          expiredPostIds: expiredPosts.map(p => p.id),
          expiredCount: expiredPosts.length,
          processedCount,
          timestamp: new Date(),
          source: 'web_app_cron'
        });
        
      } else {
        console.log(`✅ Processed ${processedCount} posts, none were expired`);
      }
      
      return {
        success: true,
        processedCount,
        expiredCount: expiredPosts.length,
        expiredPosts
      };
      
    } catch (error: any) {
      console.error('❌ Error checking expired posts:', error);
      
      // Log error
      try {
        await addDoc(collection(db, this.SYSTEM_LOGS_COLLECTION), {
          type: 'auto_expire_posts_error',
          error: error.message,
          timestamp: new Date(),
          source: 'web_app_cron'
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return {
        success: false,
        processedCount: 0,
        expiredCount: 0,
        expiredPosts: [],
        error: error.message
      };
    }
  }

  // Cancel subscriptions for expired posts
  private static async cancelExpiredSubscriptions(expiredPostIds: string[], subscriberIds: string[]): Promise<void> {
    try {
      console.log('🔄 Cancelling subscriptions for expired posts...');
      
      for (const postId of expiredPostIds) {
        // Get active subscriptions for this post
        const subscriptionsQuery = query(
          collection(db, 'postSubscriptions'),
          where('postId', '==', postId),
          where('status', '==', 'active')
        );
        
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
        
        if (!subscriptionsSnapshot.empty) {
          // Cancel each subscription
          for (const subDoc of subscriptionsSnapshot.docs) {
            await SubscriptionService.cancelSubscription(
              subDoc.id,
              'Post auto-expired due to travel time completion'
            );
          }
          
          console.log(`✅ Cancelled ${subscriptionsSnapshot.size} subscriptions for post ${postId}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error cancelling expired subscriptions:', error);
    }
  }

  // Get recent expiration logs
  static async getExpirationLogs(limit: number = 10): Promise<any[]> {
    try {
      const logsQuery = query(
        collection(db, this.SYSTEM_LOGS_COLLECTION),
        where('type', 'in', ['auto_expire_posts', 'auto_expire_posts_error'])
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logs: any[] = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by timestamp and limit
      return logs
        .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting expiration logs:', error);
      return [];
    }
  }
}
