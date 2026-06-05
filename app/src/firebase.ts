import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB-yhy8yflFVe2_otL0q0ZSGOYrdKQ_jbI',
  authDomain: 'tovch-63d76.firebaseapp.com',
  projectId: 'tovch-63d76',
  storageBucket: 'tovch-63d76.firebasestorage.app',
  messagingSenderId: '58517923320',
  appId: '1:58517923320:web:dc1a121d04126ff1e9a20d',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Metro resolves firebase/auth → React Native build at runtime, which exports
// getReactNativePersistence. TypeScript sees the web types so we use require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage) as never,
  });
} catch {
  auth = getAuth(app);
}

export { auth };
