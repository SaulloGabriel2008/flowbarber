import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

export const firebaseConfig = {
    apiKey: "AIzaSyCInLdLMFOT7swPnMWtUH0z5o73RkwahCQ",
    authDomain: "bradock-c664e.firebaseapp.com",
    projectId: "bradock-c664e",
    storageBucket: "bradock-c664e.firebasestorage.app",
    messagingSenderId: "140609259960",
    appId: "1:140609259960:web:c7706bc37061c97ea8674d",
};

export const vapidKey = "BFCyx38SAwPFbLIIErfFmaJlk1TksQ_6MAxwBfSAyyQ4-DmH5btXX5RZ0bjO_RmhcWzcYWnD7rsjBaFd1QjL1no";
export const bootstrapOwnerEmail = "saullinho2008@gmail.com";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
});
export const functions = getFunctions(app);
