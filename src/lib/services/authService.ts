import { User as FirebaseUser } from 'firebase/auth';
import * as authModule from '../firebase/auth';
import * as firestoreModule from '../firebase/firestore';
import { User } from '../types/index';

/**
 * Register a new user and create user document in Firestore
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: 'doctor' | 'admin' | 'patient' = 'patient'
): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const firebaseUser = await authModule.registerUser(email, password);

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      email,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreModule.addDocument('users', userData);

    return userData;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Sign in a user
 */
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const firebaseUser = await authModule.loginUser(email, password);

    // Fetch user document from Firestore
    const user = await firestoreModule.getDocument<User>('users', firebaseUser.uid);

    return user || null;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await authModule.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current user from Firestore
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = authModule.getCurrentUser();

    if (!firebaseUser) {
      return null;
    }

    const user = await firestoreModule.getDocument<User>('users', firebaseUser.uid);
    return user || null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    return await firestoreModule.getDocument<User>('users', userId);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    await firestoreModule.updateDocument('users', userId, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuth = (callback: (user: User | null) => void): (() => void) => {
  return authModule.subscribeToAuthChanges(async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
};

/**
 * Get auth token for API calls
 */
export const getAuthToken = async (): Promise<string> => {
  return await authModule.getAuthToken();
};
