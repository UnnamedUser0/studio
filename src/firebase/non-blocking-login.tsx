'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'va21070541@bachilleresdesonora.edu.mx';

/**
 * Creates or updates a user's profile in Firestore.
 * This is a critical, blocking step in the authentication flow.
 * @param authInstance The Firebase Auth instance.
 * @param user The Firebase user object from authentication.
 */
async function manageUserProfile(authInstance: Auth, user: FirebaseUser): Promise<void> {
  const firestore = getFirestore(authInstance.app);
  const userDocRef = doc(firestore, 'users', user.uid);
  
  const userProfile = {
    id: user.uid,
    email: user.email,
    username: user.email?.split('@')[0] || 'Usuario',
    isAdmin: user.email === ADMIN_EMAIL,
  };

  // Use setDoc with merge:true to create or update the profile without overwriting other fields.
  // CRITICAL: We await this operation to ensure the profile exists before the app proceeds.
  await setDoc(userDocRef, userProfile, { merge: true }).catch(error => {
    // In a real app, you might want a more robust global error handler.
    // For now, we log it, but this shouldn't fail unless security rules are wrong.
    console.error("CRITICAL: Error managing user profile:", error);
    throw error; // Re-throw to indicate a failed login/signup step
  });
}

/** Initiate email/password sign-up and create user profile (blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    // This step is now blocking and critical for role assignment.
    await manageUserProfile(authInstance, userCredential.user);
  } catch (error) {
    console.error("Error during sign up:", error);
    // In a real app, you'd want to show this error to the user via toast or form error.
  }
}

/** Initiate email/password sign-in and ensure user profile exists (blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    // This step is now blocking and critical for role assignment.
    await manageUserProfile(authInstance, userCredential.user);
  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}
