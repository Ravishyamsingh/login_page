



// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAqIdHfwbia5lkXtElnbQFlYYUl5kfR64",
  authDomain: "login-a906f.firebaseapp.com",
  projectId: "login-a906f",
  storageBucket: "login-a906f.appspot.com",   
  messagingSenderId: "21858022853",
  appId: "1:21858022853:web:9fb083f12229b660eec7ac",
  measurementId: "G-K98GLJ10C6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
