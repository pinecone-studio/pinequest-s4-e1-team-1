import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      console.warn('Firebase Admin: failed to initialize —', (err as Error).message);
      console.warn('Set DEV_BYPASS_AUTH=true in .env to skip auth in development.');
    }
  } else {
    console.warn('Firebase Admin: credentials missing — auth will return 503');
  }
}

export default admin;
