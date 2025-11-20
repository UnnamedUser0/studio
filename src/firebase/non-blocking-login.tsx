'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'va21070541@bachilleresdesonora.edu.mx';

/**
 * Creates or updates a user's profile in Firestore.
 * This is a critical, blocking step in the authentication flow.
 * @param user The Firebase user object from authentication.
 */
async function manageUserProfile(user: FirebaseUser): Promise<void> {
  const auth = getAuth();
  const firestore = getFirestore(auth.app);
  const userDocRef = doc(firestore, 'users', user.uid);
  
  const userProfile = {
    id: user.uid,
    email: user.email,
    username: user.email?.split('@')[0] || 'Usuario',
    isAdmin: user.email === ADMIN_EMAIL,
  };

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      // Document exists, update it if necessary (e.g. isAdmin status could change if rules are manual)
      // For now, we only care about setting it on creation. We can just merge.
      await setDoc(userDocRef, { email: user.email }, { merge: true });
    } else {
      // Document doesn't exist, create it with all info
      await setDoc(userDocRef, userProfile);
    }
  } catch (error) {
    console.error("CRITICAL: Error managing user profile:", error);
    throw error;
  }
}

/** Initiate email/password sign-up and create user profile (blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    // This step is now blocking and critical for role assignment.
    await manageUserProfile(userCredential.user);
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
    await manageUserProfile(userCredential.user);
  } catch(error) {
     console.error("Error during sign in:", error);
     // In a real app, you'd want to show this error to the user via toast or form error.
  }
}
