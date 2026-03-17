importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

firebase.initializeApp({
            apiKey: "AIzaSyCInLdLMFOT7swPnMWtUH0z5o73RkwahCQ",
            authDomain: "bradock-c664e.firebaseapp.com",
            projectId: "bradock-c664e",
            storageBucket: "bradock-c664e.firebasestorage.app",
            messagingSenderId: "140609259960",
            appId: "1:140609259960:web:c7706bc37061c97ea8674d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon-192.png"
    }
  );
});
