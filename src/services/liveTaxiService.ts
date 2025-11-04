import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { 
  LiveTaxiPost, 
  LiveTaxiApplication, 
  LiveTaxiPostWithApplications,
  LiveTaxiFilters,
  LiveTaxiStats 
} from '../types/liveTaxi';

export class LiveTaxiService {
  private static readonly LIVE_TAXI_POSTS_COLLECTION = 'liveTaxiPosts';
  private static readonly LIVE_TAXI_APPLICATIONS_COLLECTION = 'liveTaxiApplications';
  private static readonly TRANSACTIONS_COLLECTION = 'transactions';

  // Convert Firestore timestamp to Date
  private static convertTimestamp(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return new Date(timestamp);
  }

  // Get all live taxi posts with filters
  static async getLiveTaxiPosts(filters?: LiveTaxiFilters): Promise<LiveTaxiPost[]> {
    try {
      let q = query(
        collection(db, this.LIVE_TAXI_POSTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(
          collection(db, this.LIVE_TAXI_POSTS_COLLECTION),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.countryId) {
        q = query(
          collection(db, this.LIVE_TAXI_POSTS_COLLECTION),
          where('fromCountryId', '==', filters.countryId),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.userId) {
        q = query(
          collection(db, this.LIVE_TAXI_POSTS_COLLECTION),
          where('userId', '==', filters.userId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      let posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.convertTimestamp(data.createdAt),
          expiresAt: this.convertTimestamp(data.expiresAt),
          updatedAt: this.convertTimestamp(data.updatedAt),
          acceptedAt: data.acceptedAt ? this.convertTimestamp(data.acceptedAt) : undefined,
          completedAt: data.completedAt ? this.convertTimestamp(data.completedAt) : undefined,
        } as LiveTaxiPost;
      });

      // Apply additional filters that can't be done in Firestore query
      if (filters?.cityId) {
        posts = posts.filter(
          post => post.fromCityId === filters.cityId || post.toCityId === filters.cityId
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        posts = posts.filter(
          post =>
            post.userName.toLowerCase().includes(searchLower) ||
            post.fromCityName.toLowerCase().includes(searchLower) ||
            post.toCityName.toLowerCase().includes(searchLower) ||
            post.acceptedDriverName?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        posts = posts.filter(post => post.createdAt >= startDate);
      }

      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        posts = posts.filter(post => post.createdAt <= endDate);
      }

      return posts;
    } catch (error) {
      console.error('Error fetching live taxi posts:', error);
      throw error;
    }
  }

  // Get live taxi posts with application counts
  static async getLiveTaxiPostsWithApplications(filters?: LiveTaxiFilters): Promise<LiveTaxiPostWithApplications[]> {
    try {
      const posts = await this.getLiveTaxiPosts(filters);
      const applicationsSnapshot = await getDocs(
        collection(db, this.LIVE_TAXI_APPLICATIONS_COLLECTION)
      );

      const applicationCounts = new Map<string, number>();
      applicationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const count = applicationCounts.get(data.livePostId) || 0;
        applicationCounts.set(data.livePostId, count + 1);
      });

      return posts.map(post => ({
        ...post,
        applicationsCount: applicationCounts.get(post.id) || 0,
      }));
    } catch (error) {
      console.error('Error fetching live taxi posts with applications:', error);
      throw error;
    }
  }

  // Get single live taxi post
  static async getLiveTaxiPost(postId: string): Promise<LiveTaxiPost | null> {
    try {
      const docRef = doc(db, this.LIVE_TAXI_POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: this.convertTimestamp(data.createdAt),
        expiresAt: this.convertTimestamp(data.expiresAt),
        updatedAt: this.convertTimestamp(data.updatedAt),
        acceptedAt: data.acceptedAt ? this.convertTimestamp(data.acceptedAt) : undefined,
        completedAt: data.completedAt ? this.convertTimestamp(data.completedAt) : undefined,
      } as LiveTaxiPost;
    } catch (error) {
      console.error('Error fetching live taxi post:', error);
      throw error;
    }
  }

  // Get applications for a specific post
  static async getApplicationsForPost(livePostId: string): Promise<LiveTaxiApplication[]> {
    try {
      const q = query(
        collection(db, this.LIVE_TAXI_APPLICATIONS_COLLECTION),
        where('livePostId', '==', livePostId),
        orderBy('appliedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appliedAt: this.convertTimestamp(data.appliedAt),
        } as LiveTaxiApplication;
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }

  // Cancel a live taxi post (admin action)
  static async cancelLiveTaxiPost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, this.LIVE_TAXI_POSTS_COLLECTION, postId);
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error cancelling live taxi post:', error);
      throw error;
    }
  }

  // Get live taxi statistics
  static async getLiveTaxiStats(): Promise<LiveTaxiStats> {
    try {
      const posts = await this.getLiveTaxiPosts();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activePosts = posts.filter(p => p.status === 'waiting').length;
      const completedTotal = posts.filter(p => p.status === 'completed').length;
      const completedToday = posts.filter(
        p => p.status === 'completed' && p.completedAt && p.completedAt >= today
      ).length;
      const cancelledTotal = posts.filter(p => p.status === 'cancelled').length;

      // Get total revenue from transactions
      const transactionsQuery = query(
        collection(db, this.TRANSACTIONS_COLLECTION),
        where('type', '==', 'live_taxi_payment')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      let totalRevenue = 0;
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.amount > 0) {
          totalRevenue += data.amount;
        }
      });

      // Get total applications
      const applicationsSnapshot = await getDocs(
        collection(db, this.LIVE_TAXI_APPLICATIONS_COLLECTION)
      );

      const completedPosts = posts.filter(p => p.status === 'completed');
      const averagePrice = completedPosts.length > 0
        ? completedPosts.reduce((sum, p) => sum + p.offerPrice, 0) / completedPosts.length
        : 0;

      return {
        totalPosts: posts.length,
        activePosts,
        completedToday,
        completedTotal,
        cancelledTotal,
        totalRevenue,
        averagePrice,
        totalApplications: applicationsSnapshot.size,
      };
    } catch (error) {
      console.error('Error fetching live taxi stats:', error);
      throw error;
    }
  }

  // Get top drivers by completed rides
  static async getTopDrivers(limit: number = 10): Promise<{ driverId: string; driverName: string; completedRides: number }[]> {
    try {
      const posts = await this.getLiveTaxiPosts({ status: 'completed' });
      
      const driverStats = new Map<string, { name: string; count: number }>();
      
      posts.forEach(post => {
        if (post.acceptedDriverId && post.acceptedDriverName) {
          const current = driverStats.get(post.acceptedDriverId);
          if (current) {
            current.count++;
          } else {
            driverStats.set(post.acceptedDriverId, {
              name: post.acceptedDriverName,
              count: 1,
            });
          }
        }
      });

      return Array.from(driverStats.entries())
        .map(([driverId, stats]) => ({
          driverId,
          driverName: stats.name,
          completedRides: stats.count,
        }))
        .sort((a, b) => b.completedRides - a.completedRides)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top drivers:', error);
      throw error;
    }
  }

  // Get most active cities
  static async getMostActiveCities(limit: number = 10): Promise<{ cityName: string; postCount: number }[]> {
    try {
      const posts = await this.getLiveTaxiPosts();
      
      const cityStats = new Map<string, number>();
      
      posts.forEach(post => {
        const fromCount = cityStats.get(post.fromCityName) || 0;
        cityStats.set(post.fromCityName, fromCount + 1);
        
        const toCount = cityStats.get(post.toCityName) || 0;
        cityStats.set(post.toCityName, toCount + 1);
      });

      return Array.from(cityStats.entries())
        .map(([cityName, postCount]) => ({ cityName, postCount }))
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching most active cities:', error);
      throw error;
    }
  }
}
