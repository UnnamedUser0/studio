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

    setDocumentNonBlocking(userDocRef, userProfile, { merge: false });

  } catch (error) {
    console.error("Error during sign up:", error);
    // Optionally, re-throw or handle the error in the UI
  }
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
