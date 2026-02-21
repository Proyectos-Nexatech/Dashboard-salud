import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyARO0YZ1OhePvsJumLSjgcIWiLFjiq6i4c",
    authDomain: "dashboard-salud-b44c1.firebaseapp.com",
    projectId: "dashboard-salud-b44c1",
    storageBucket: "dashboard-salud-b44c1.firebasestorage.app",
    messagingSenderId: "772143467382",
    appId: "1:772143467382:web:c14df773df87a1eb5f4857"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
