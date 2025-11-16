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

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up and create user profile (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', user.uid);

    const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx',
    };

    // Use a non-blocking write to create the user profile
    setDocumentNonBlocking(userDocRef, userProfile, { merge: false });

  } catch (error) {
    console.error("Error during sign up:", error);
    // In a real app, you'd want to show this error to the user
  }
}

/** Initiate email/password sign-in and ensure user profile exists (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // After sign-in, ensure the user profile exists, creating it if it doesn't.
    // This handles cases where the user was created before the profile creation logic was in place.
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', user.uid);

     const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx',
    };

    // Use merge:true to create the doc if it doesn't exist, or update it without overwriting.
    // This is safe and idempotent.
    setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user
  }
}
