import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/firebase/client";

export const signup = async (fullName: string, email: string, password: string): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName.trim()) {
    await updateProfile(credential.user, { displayName: fullName.trim() });
  }
  return credential.user;
};

export const login = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const subscribeAuth = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};