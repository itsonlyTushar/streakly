import * as admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log("Firebase Admin initialized successfully");
      } else {
        console.warn("Firebase Admin credentials missing, skipping initialization");
      }
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
};

initializeFirebaseAdmin();

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;

export { adminDb, adminAuth };

