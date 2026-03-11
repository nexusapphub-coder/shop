import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Try to get a non-existent doc just to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline') || error.message?.includes('failed-precondition')) {
      console.error("Firestore connection failed: The client is offline or configuration is incorrect.");
    }
    // Other errors (like permission denied) are fine, they still mean we connected
  }
}
testConnection();
