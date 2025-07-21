import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Admin account configurations
const adminAccounts = [
  {
    email: 'iesadmin@gmail.com',
    password: 'Admin@1230'
  },
  {
    email: 'smartport@apmaritime.in',
    password: 'Apmb@2025'
  }
];

// This utility function can be run once to set up the admin accounts
export const setupAdminAccount = async () => {
  const auth = getAuth();
  let createdCount = 0;

  for (const admin of adminAccounts) {
    try {
      // Try to sign in with admin credentials first
      try {
        await signInWithEmailAndPassword(auth, admin.email, admin.password);
        console.log(`Admin account ${admin.email} already exists and credentials are valid`);
        continue;
      } catch (signInError: any) {
        // If error is not "user not found", then account exists but password might be wrong
        if (signInError.code !== 'auth/user-not-found') {
          console.log(`Admin account ${admin.email} exists but could not sign in`);
          continue;
        }
        
        // If user not found, proceed to create the account
        console.log(`Admin account ${admin.email} does not exist, creating...`);
      }

      // Create admin user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, admin.email, admin.password);
      const user = userCredential.user;
      
      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: admin.email,
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log(`Admin account ${admin.email} created successfully`);
      createdCount++;
    } catch (error) {
      console.error(`Error setting up admin account ${admin.email}:`, error);
    }
  }

  return createdCount > 0;
};