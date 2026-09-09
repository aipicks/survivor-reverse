// Fill these in from your Firebase project settings (Project settings > General > Your apps > SDK setup and config).
// These values are safe to commit publicly — access is controlled by Firestore security rules, not by hiding this config.
// See README.md for setup steps.
const firebaseConfig = {
  apiKey: "AIzaSyD_kuP1vw22syRYAZpHW2spO80RE2HYkv4",
  authDomain: "laurelhood-survivor.firebaseapp.com",
  projectId: "laurelhood-survivor",
  storageBucket: "laurelhood-survivor.firebasestorage.app",
  messagingSenderId: "84669482117",
  appId: "1:84669482117:web:3fc8d274b3214b61e1d5ec"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
