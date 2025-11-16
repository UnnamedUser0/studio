'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Initiate email/password sign-up and create user profile (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;
    
    // Directly create the user profile here
    const firestore = getFirestore(authInstance.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx' ? true : false,
    };

    setDoc(userDocRef, userProfile, { merge: true }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: userProfile,
        })
      )
    });

  } catch (error) {
    console.error("Error during sign up:", error);
    // In a real app, you'd want to show this error to the user via toast or form error.
  }
}

/** Initiate email/password sign-in and ensure user profile exists (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // Also ensure profile exists on sign-in
    const firestore = getFirestore(authInstance.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx' ? true : false,
    };

    // Using merge: true will create the doc if it doesn't exist, or update it without overwriting existing fields.
    setDoc(userDocRef, userProfile, { merge: true }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: userProfile,
        })
      )
    });

  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}
