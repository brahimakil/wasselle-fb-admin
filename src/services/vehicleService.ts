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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Vehicle, CreateVehicleData, VehicleFilters } from '../types/vehicle';
import { NotificationService } from './notificationService';

export class VehicleService {
  private static readonly COLLECTION_NAME = 'vehicles';
  private static readonly STORAGE_PATH = 'vehicles';

  // Upload vehicle image to Firebase Storage
  static async uploadVehicleImage(file: File, vehicleId: string, imageType: 'front' | 'back' | 'papers'): Promise<string> {
    const fileName = `${imageType}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `${this.STORAGE_PATH}/${vehicleId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Create a new vehicle
  static async createVehicle(vehicleData: CreateVehicleData, userId: string, adminId: string): Promise<string> {
    try {
      // Generate a unique vehicle ID
      const vehicleId = doc(collection(db, this.COLLECTION_NAME)).id;

      // Upload images
      const [frontPhotoUrl, backPhotoUrl, papersPhotoUrl] = await Promise.all([
        this.uploadVehicleImage(vehicleData.frontPhoto, vehicleId, 'front'),
        this.uploadVehicleImage(vehicleData.backPhoto, vehicleId, 'back'),
        this.uploadVehicleImage(vehicleData.papersPhoto, vehicleId, 'papers')
      ]);

      // Create vehicle document
      const vehicleDoc: Omit<Vehicle, 'id'> = {
        userId,
        model: vehicleData.model,
        color: vehicleData.color,
        numberOfSeats: vehicleData.numberOfSeats,
        licensePlate: vehicleData.licensePlate,
        frontPhotoUrl,
        backPhotoUrl,
        papersPhotoUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      await setDoc(doc(db, this.COLLECTION_NAME, vehicleId), vehicleDoc);

      return vehicleId;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Get vehicles with filters
  static async getVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      if (filters?.numberOfSeats) {
        q = query(q, where('numberOfSeats', '==', filters.numberOfSeats));
      }

      const querySnapshot = await getDocs(q);
      let vehicles: Vehicle[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vehicles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Vehicle);
      });

      // Apply search filter on client side
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        vehicles = vehicles.filter(vehicle => 
          vehicle.model.toLowerCase().includes(searchTerm) ||
          vehicle.color.toLowerCase().includes(searchTerm) ||
          vehicle.licensePlate.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by createdAt on client side
      vehicles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return vehicles;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get vehicles count for a user
  static async getUserVehicleCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, this.COLLECTION_NAME), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching vehicle count:', error);
      return 0;
    }
  }

  // Update vehicle status
  static async updateVehicleStatus(vehicleId: string, isActive: boolean, adminId: string): Promise<void> {
    try {
      const vehicleRef = doc(db, this.COLLECTION_NAME, vehicleId);
      const vehicleDoc = await getDoc(vehicleRef);
      
      if (!vehicleDoc.exists()) {
        throw new Error('Vehicle not found');
      }
      
      const vehicle = vehicleDoc.data();
      
      await updateDoc(vehicleRef, {
        isActive,
        updatedAt: new Date()
      });

      // Add notification
      if (isActive) {
        await NotificationService.createNotification({
          userId: vehicle.userId,
          type: 'vehicle',
          title: '🚗 Vehicle Approved',
          message: `Your vehicle ${vehicle.model} (${vehicle.licensePlate}) has been approved by an admin. You can now use it in your posts.`,
          data: { 
            type: 'vehicle_approved',
            vehicleModel: vehicle.model,
            licensePlate: vehicle.licensePlate,
            adminId
          }
        });
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  }

  // Update vehicle
  static async updateVehicle(vehicleId: string, updates: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const vehicleRef = doc(db, this.COLLECTION_NAME, vehicleId);
      
      const vehicleDoc = await getDoc(vehicleRef);
      if (!vehicleDoc.exists()) {
        throw new Error(`Vehicle document not found: ${vehicleId}`);
      }
      
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle
  static async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const vehicleRef = doc(db, this.COLLECTION_NAME, vehicleId);
      
      const vehicleDoc = await getDoc(vehicleRef);
      if (!vehicleDoc.exists()) {
        throw new Error(`Vehicle document not found: ${vehicleId}`);
      }

      const vehicleData = vehicleDoc.data() as Vehicle;

      // Delete images from storage
      const deletePromises = [
        deleteObject(ref(storage, vehicleData.frontPhotoUrl)),
        deleteObject(ref(storage, vehicleData.backPhotoUrl)),
        deleteObject(ref(storage, vehicleData.papersPhotoUrl))
      ];

      await Promise.all(deletePromises.map(p => p.catch(e => console.warn('Failed to delete image:', e))));

      // Delete document
      await deleteDoc(vehicleRef);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Get unique models for filtering
  static async getUniqueModels(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const models = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.model && data.model.trim()) {
          models.add(data.model.trim());
        }
      });
      
      return Array.from(models).sort();
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
      return [];
    }
  }

  // Get unique colors for filtering
  static async getUniqueColors(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const colors = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.color && data.color.trim()) {
          colors.add(data.color.trim());
        }
      });
      
      return Array.from(colors).sort();
    } catch (error) {
      console.error('Error fetching vehicle colors:', error);
      return [];
    }
  }
}