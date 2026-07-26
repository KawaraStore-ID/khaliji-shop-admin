// GANTI nilai-nilai di bawah ini dengan config Firebase yang SAMA PERSIS
// dengan yang dipakai di website admin (satu project Firebase untuk 2 website).
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_AUTH_DOMAIN",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
