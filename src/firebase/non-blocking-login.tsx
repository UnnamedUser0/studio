'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_EMAIL = 'va21070541@bachilleresdesonora.edu.mx';

/**
 * Creates or updates a user's profile in Firestore.
 * This function is designed to be non-blocking.
 * @param authInstance The Firebase Auth instance.
 * @param user The Firebase user object.
 */
function manageUserProfile(authInstance: Auth, user: FirebaseUser): void {
  const firestore = getFirestore(authInstance.app);
  const userDocRef = doc(firestore, 'users', user.uid);
  
  const userProfile = {
    id: user.uid,
    email: user.email,
    username: user.email?.split('@')[0] || 'Usuario',
    isAdmin: user.email === ADMIN_EMAIL, // Explicitly set to true or false
  };

  // Use setDoc with merge:true to create or update the profile without overwriting other fields.
  // The operation is non-blocking; we handle potential errors in the catch block.
  setDoc(userDocRef, userProfile, { merge: true }).catch(error => {
    const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: userProfile,
      });
    errorEmitter.emit('permission-error', permissionError);
    // Also log for debugging, but the primary error surfacing is via the emitter
    console.error("Error managing user profile:", error); 
  });
}

/** Initiate email/password sign-up and create user profile (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    manageUserProfile(authInstance, userCredential.user);
  } catch (error) {
    console.error("Error during sign up:", error);
    // In a real app, you'd want to show this error to the user via toast or form error.
  }
}

/** Initiate email/password sign-in and ensure user profile exists (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    manageUserProfile(authInstance, userCredential.user);
  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}
