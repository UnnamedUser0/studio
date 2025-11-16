'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, SetOptions } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/**
 * Initiates a setDoc operation for a document reference, designed to create or merge data.
 * Does NOT await the write operation internally.
 * This function can create a document or merge data into an existing one.
 */
function setDocumentNonBlocking(docRef: any, data: any, options?: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // Simplified to 'write' as it covers create/update
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/** Initiate email/password sign-up and create user profile (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;
    
    // After user is created in Auth, create their profile in Firestore.
    const firestore = getFirestore(authInstance.app);
    const userDocRef = doc(firestore, 'users', user.uid);

    const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx' ? true : false,
    };

    setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

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

    // After user signs in, ensure their profile exists in Firestore.
    const firestore = getFirestore(authInstance.app);
    const userDocRef = doc(firestore, 'users', user.uid);

     const userProfile = {
      id: user.uid,
      email: user.email,
      username: user.email?.split('@')[0] || 'Usuario',
      isAdmin: user.email === 'va21070541@bachilleresdesonora.edu.mx' ? true : false,
    };
    
    setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}