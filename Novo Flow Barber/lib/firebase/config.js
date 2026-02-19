import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGytekm0NYSlM3Cq2oMV0ipuF_1bP1ads",
  authDomain: "multibarbeir.firebaseapp.com",
  projectId: "multibarbeir",
  storageBucket: "multibarbeir.firebasestorage.app",
  messagingSenderId: "318079209487",
  appId: "1:318079209487:web:79fdc7aeee4a539375537a",
};

// Initialize Firebase (só uma vez)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Messaging (para notificações push)
let messaging;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export { messaging };

// Configurar persistência de sessão
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error('Erro ao configurar persistência:', error);
  });

export default app;
