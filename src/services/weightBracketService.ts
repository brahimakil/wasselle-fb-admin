import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { WeightBracket, WeightBracketFormData } from '../types/weightBracket';

const WEIGHT_BRACKETS_COLLECTION = 'weightBrackets';

/**
 * Get all weight brackets
 */
export const getWeightBrackets = async (): Promise<WeightBracket[]> => {
  try {
    const q = query(
      collection(db, WEIGHT_BRACKETS_COLLECTION),
      orderBy('minWeight', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as WeightBracket[];
  } catch (error) {
    console.error('Error getting weight brackets:', error);
    throw error;
  }
};

/**
 * Get active weight brackets only
 */
export const getActiveWeightBrackets = async (): Promise<WeightBracket[]> => {
  try {
    const brackets = await getWeightBrackets();
    return brackets.filter(bracket => bracket.isActive);
  } catch (error) {
    console.error('Error getting active weight brackets:', error);
    throw error;
  }
};

/**
 * Create a new weight bracket
 */
export const createWeightBracket = async (data: WeightBracketFormData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, WEIGHT_BRACKETS_COLLECTION), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating weight bracket:', error);
    throw error;
  }
};

/**
 * Update a weight bracket
 */
export const updateWeightBracket = async (
  id: string, 
  data: Partial<WeightBracketFormData>
): Promise<void> => {
  try {
    const docRef = doc(db, WEIGHT_BRACKETS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating weight bracket:', error);
    throw error;
  }
};

/**
 * Delete a weight bracket
 */
export const deleteWeightBracket = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, WEIGHT_BRACKETS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting weight bracket:', error);
    throw error;
  }
};

/**
 * Calculate delivery price based on weight
 * @param weight - Weight in kg
 * @returns Price in points (rounded up)
 */
export const calculateDeliveryPrice = async (weight: number): Promise<number> => {
  try {
    const brackets = await getActiveWeightBrackets();
    
    // Find the appropriate bracket
    const bracket = brackets.find(
      b => weight >= b.minWeight && weight <= b.maxWeight
    );
    
    if (!bracket) {
      throw new Error('No weight bracket found for this weight');
    }
    
    // Calculate: base_price + (weight × price_per_kg)
    const price = bracket.basePrice + (weight * bracket.pricePerKg);
    
    // Round up to nearest whole number
    return Math.ceil(price);
  } catch (error) {
    console.error('Error calculating delivery price:', error);
    throw error;
  }
};
