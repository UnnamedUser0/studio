'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';
import { initializeFirebase } from '.';

/**
 * Creates or updates the user profile in Firestore.
 * This is a centralized function to ensure the profile is handled consistently.
 */
function manageUserProfile(user: { uid: string; email: string | null }): void {
  const { firestore } = initializeFirebase();
  const userDocRef = doc(firestore, 'users', user.uid);

  const userProfile = {
    id: user.uid,
    email: user.email,
    username: user.email?.split('@')[0] || 'Usuario',
    // This is the single source of truth for assigning the admin role.
    isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx' ? true : false,
  };

  // Use a non-blocking write with merge:true.
  // This will create the doc if it doesn't exist, or update it if it does,
  // without overwriting other fields. This is safe and idempotent.
  setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up and create user profile (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    // After user is created in Auth, create their profile in Firestore.
    manageUserProfile(userCredential.user);
  } catch (error) {
    console.error("Error during sign up:", error);
    // In a real app, you'd want to show this error to the user via toast or form error.
  }
}

/** Initiate email/password sign-in and ensure user profile exists (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    // After user signs in, ensure their profile exists in Firestore.
    // This handles cases where the user was created before the profile logic was in place.
    manageUserProfile(userCredential.user);
  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}
