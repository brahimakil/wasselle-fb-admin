import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  setDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Post, CreatePostData, PostFilters, PostWithDetails, UserCancellationRecord } from '../types/post';
import type { User } from '../types/user';
import type { Country, City, Vehicle } from '../types/country';
import { UserService } from './userService';
import { CountryService } from './countryService';
import { VehicleService } from './vehicleService';

export class PostService {
  private static readonly POSTS_COLLECTION = 'posts';
  private static readonly CANCELLATIONS_COLLECTION = 'userCancellations';
  private static readonly MAX_CANCELLATIONS_PER_MONTH = 3;

  // Create a new post
  static async createPost(postData: CreatePostData, adminId: string): Promise<string> {
    try {
      const postId = doc(collection(db, this.POSTS_COLLECTION)).id;

      const postDoc: Omit<Post, 'id'> = {
        userId: postData.userId,
        fromCountryId: postData.fromCountryId,
        fromCityId: postData.fromCityId,
        toCountryId: postData.toCountryId,
        toCityId: postData.toCityId,
        vehicleId: postData.vehicleId,
        departureDate: postData.departureDate,
        departureTime: postData.departureTime,
        hasReturnTrip: postData.hasReturnTrip,        // Add this
        returnDate: postData.returnDate,              // Add this
        returnTime: postData.returnTime,              // Add this
        travelType: postData.travelType,
        cost: postData.cost,
        serviceType: postData.serviceType,
        description: postData.description,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      await setDoc(doc(db, this.POSTS_COLLECTION, postId), postDoc);
      return postId;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get posts with filters
  static async getPosts(filters?: PostFilters): Promise<Post[]> {
    try {
      let q = query(collection(db, this.POSTS_COLLECTION));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.fromCountryId) {
        q = query(q, where('fromCountryId', '==', filters.fromCountryId));
      }

      if (filters?.toCountryId) {
        q = query(q, where('toCountryId', '==', filters.toCountryId));
      }

      if (filters?.travelType) {
        q = query(q, where('travelType', '==', filters.travelType));
      }

      if (filters?.serviceType) {
        q = query(q, where('serviceType', '==', filters.serviceType));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.isCompleted !== undefined) {
        q = query(q, where('isCompleted', '==', filters.isCompleted));
      }

      if (filters?.userGender) {
        const usersWithGender = await UserService.getUsers();
        const userIdsWithGender = usersWithGender
          .filter(u => u.gender === filters.userGender)
          .map(u => u.id);
        q = query(q, where('userId', 'in', userIdsWithGender));
      }

      const querySnapshot = await getDocs(q);
      let posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Post);
      });

      // Apply additional filters on client side
      if (filters?.dateFrom) {
        posts = posts.filter(post => post.departureDate >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        posts = posts.filter(post => post.departureDate <= filters.dateTo!);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        posts = posts.filter(post => 
          post.description.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by departure date and time
      posts.sort((a, b) => {
        const dateA = new Date(`${a.departureDate}T${a.departureTime}`);
        const dateB = new Date(`${b.departureDate}T${b.departureTime}`);
        return dateB.getTime() - dateA.getTime();
      });

      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Get posts with full details (including related data)
  static async getPostsWithDetails(filters?: PostFilters): Promise<PostWithDetails[]> {
    try {
      const posts = await this.getPosts(filters);
      const postsWithDetails: PostWithDetails[] = [];

      for (const post of posts) {
        const [user, fromCountry, fromCity, toCountry, toCity, vehicle] = await Promise.all([
          this.getUserById(post.userId),
          CountryService.getCountries().then(countries => countries.find(c => c.id === post.fromCountryId)),
          CountryService.getCityById(post.fromCityId),
          CountryService.getCountries().then(countries => countries.find(c => c.id === post.toCountryId)),
          CountryService.getCityById(post.toCityId),
          post.vehicleId ? this.getVehicleById(post.vehicleId) : null
        ]);

        if (user && fromCountry && fromCity && toCountry && toCity) {
          postsWithDetails.push({
            ...post,
            user: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              gender: user.gender
            },
            fromCountry: {
              id: fromCountry.id,
              name: fromCountry.name,
              flag: fromCountry.flag
            },
            fromCity: {
              id: fromCity.id,
              name: fromCity.name
            },
            toCountry: {
              id: toCountry.id,
              name: toCountry.name,
              flag: toCountry.flag
            },
            toCity: {
              id: toCity.id,
              name: toCity.name
            },
            vehicle: vehicle ? {
              id: vehicle.id,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate
            } : undefined
          });
        }
      }

      return postsWithDetails;
    } catch (error) {
      console.error('Error fetching posts with details:', error);
      throw error;
    }
  }

  // Helper methods to get related data
  private static async getUserById(userId: string) {
    try {
      const users = await UserService.getUsers();
      return users.find(u => u.id === userId) || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  private static async getVehicleById(vehicleId: string) {
    try {
      const vehicles = await VehicleService.getVehicles();
      return vehicles.find(v => v.id === vehicleId) || null;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  }

  // Update post status
  static async updatePostStatus(postId: string, status: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error(`Post document not found: ${postId}`);
      }
      
      await updateDoc(postRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  }

  // Complete post
  static async completePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error(`Post document not found: ${postId}`);
      }
      
      await updateDoc(postRef, {
        status: 'completed',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error completing post:', error);
      throw error;
    }
  }

  // Cancel post (with cancellation tracking)
  static async cancelPost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error(`Post document not found: ${postId}`);
      }

      // Update post status
      await updateDoc(postRef, {
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Track cancellation
      await this.trackCancellation(userId);

    } catch (error) {
      console.error('Error cancelling post:', error);
      throw error;
    }
  }

  // Track user cancellations and auto-ban if limit exceeded
  private static async trackCancellation(userId: string): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const cancellationId = `${userId}_${currentMonth}`;
      
      const cancellationRef = doc(db, this.CANCELLATIONS_COLLECTION, cancellationId);
      const cancellationDoc = await getDoc(cancellationRef);

      let cancellationCount = 1;

      if (cancellationDoc.exists()) {
        const data = cancellationDoc.data();
        cancellationCount = (data.cancellationCount || 0) + 1;
        
        await updateDoc(cancellationRef, {
          cancellationCount,
          lastCancellation: new Date(),
          updatedAt: new Date()
        });
      } else {
        const newRecord: Omit<UserCancellationRecord, 'id'> = {
          userId,
          month: currentMonth,
          cancellationCount,
          lastCancellation: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(cancellationRef, newRecord);
      }

      // Check if user exceeded limit
      if (cancellationCount > this.MAX_CANCELLATIONS_PER_MONTH) {
        const banReason = `Exceeded cancellation limit (${cancellationCount}/${this.MAX_CANCELLATIONS_PER_MONTH}) for ${currentMonth}`;
        await this.banUserForExcessiveCancellations(userId, banReason);
      }

    } catch (error) {
      console.error('Error tracking cancellation:', error);
      throw error;
    }
  }

  // Auto-ban user for excessive cancellations
  private static async banUserForExcessiveCancellations(userId: string, reason: string): Promise<void> {
    try {
      await UserService.updateUserStatus(userId, { 
        isBanned: true,
        banReason: reason,
        banDate: new Date()
      } as any);
    } catch (error) {
      console.error('Error banning user for excessive cancellations:', error);
      throw error;
    }
  }

  // Get user cancellation stats
  static async getUserCancellationStats(userId: string, month?: string): Promise<UserCancellationRecord | null> {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const cancellationId = `${userId}_${targetMonth}`;
      
      const cancellationRef = doc(db, this.CANCELLATIONS_COLLECTION, cancellationId);
      const cancellationDoc = await getDoc(cancellationRef);

      if (!cancellationDoc.exists()) {
        return null;
      }

      const data = cancellationDoc.data();
      return {
        id: cancellationDoc.id,
        ...data,
        lastCancellation: data.lastCancellation.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserCancellationRecord;
    } catch (error) {
      console.error('Error fetching cancellation stats:', error);
      return null;
    }
  }

  // Update post
  static async updatePost(postId: string, updates: Partial<Omit<Post, 'id' | 'userId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error(`Post document not found: ${postId}`);
      }
      
      await updateDoc(postRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post
  static async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.POSTS_COLLECTION, postId);
      
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error(`Post document not found: ${postId}`);
      }

      await deleteDoc(postRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Check and unban users who were banned for cancellations in previous months
  static async checkAndUnbanUsers(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get all banned users with cancellation-related ban reasons
      const users = await UserService.getUsers({ isBanned: true });
      
      for (const user of users) {
        // Check if ban reason contains cancellation-related text
        if (user.banReason && user.banReason.includes('Exceeded cancellation limit')) {
          // Extract the month from ban reason (format: "...for YYYY-MM")
          const banReasonMatch = user.banReason.match(/for (\d{4}-\d{2})/);
          
          if (banReasonMatch) {
            const banMonth = banReasonMatch[1];
            
            // If ban was for a previous month, unban the user
            if (banMonth < currentMonth) {
              await UserService.updateUserStatus(user.id, {
                isBanned: false,
                banReason: `Auto-unbanned on ${new Date().toISOString().split('T')[0]} (new month)`,
                banDate: undefined
              });
              
              console.log(`Auto-unbanned user ${user.fullName} (${user.email}) for new month`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking and unbanning users:', error);
    }
  }

  // Call this method when the app starts or periodically
  static async initializeMonthlyCleaning(): Promise<void> {
    // Check immediately
    await this.checkAndUnbanUsers();
    
    // Set up interval to check daily (you can adjust frequency)
    setInterval(async () => {
      await this.checkAndUnbanUsers();
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }
}
