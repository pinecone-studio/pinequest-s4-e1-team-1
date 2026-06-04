import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB-yhy8yflFVe2_otL0q0ZSGOYrdKQ_jbI',
  authDomain: 'tovch-63d76.firebaseapp.com',
  projectId: 'tovch-63d76',
  storageBucket: 'tovch-63d76.firebasestorage.app',
  messagingSenderId: '58517923320',
  appId: '1:58517923320:web:dc1a121d04126ff1e9a20d',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
