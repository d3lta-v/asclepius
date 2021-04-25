// src/services/firebase.ts
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

import config from "../firebase_config";

firebase.initializeApp(config);

// Auth
export const auth = firebase.auth();
// export const emailAuth = new firebase.auth.EmailAuthProvider();
export const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();

// CAPTCHA
auth.languageCode = 'en';

// Firestore
export const firestore = firebase.firestore();
