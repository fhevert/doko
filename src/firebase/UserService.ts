import { User } from 'firebase/auth';
import { getDatabase, ref, set, update, get, child } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseDB, firebaseApp } from './firebase-config';

const storage = getStorage(firebaseApp);

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  createdAt?: number;
}

export const createUserProfile = async (user: User, additionalData: { firstName?: string; lastName?: string } = {}): Promise<void> => {
  try {
    const userRef = ref(firebaseDB, `users/${user.uid}`);
    const displayName = user.displayName || 
      (additionalData.firstName && additionalData.lastName 
        ? `${additionalData.firstName} ${additionalData.lastName}`
        : user.email?.split('@')[0] || 'User');

    await set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      firstName: additionalData.firstName || '',
      lastName: additionalData.lastName || '',
      photoURL: user.photoURL || '',
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Delete old profile image if exists
    const oldImageRef = storageRef(storage, `profile-images/${userId}`);
    try {
      await deleteObject(oldImageRef);
    } catch (error) {
      // Check if it's a Firebase Storage error
      if (error instanceof Error && 'code' in error && error.code === 'storage/object-not-found') {
        // Ignore if file doesn't exist
      } else {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Upload new image
    const imageRef = storageRef(storage, `profile-images/${userId}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const dbRef = ref(getDatabase());
    const usersSnapshot = await get(child(dbRef, 'users'));
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val() as { [key: string]: UserProfile };
      const user = Object.entries(users).find(
        ([_, userData]: [string, UserProfile]) => userData.email === email
      );
      
      if (user) {
        return { ...user[1], uid: user[0] };
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile by email:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = ref(firebaseDB, `users/${userId}`);
    await update(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const dbRef = ref(getDatabase());
    const snapshot = await get(child(dbRef, 'users'));
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      return Object.keys(usersData).map(key => ({
        uid: key,
        ...usersData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const dbRef = ref(getDatabase());
    const snapshot = await get(child(dbRef, `users/${userId}`));
    
    if (snapshot.exists()) {
      return {
        uid: userId,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
