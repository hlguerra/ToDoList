import { auth } from './firebase-config.js';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const actionCodeSettings = {
  url: window.location.href.split('?')[0],
  handleCodeInApp: true,
};

async function sendMagicLink(email) {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

function isMagicLinkUrl() {
  return isSignInWithEmailLink(auth, window.location.href);
}

async function completeMagicLinkSignIn() {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Confirm your email to finish signing in:');
  }
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem('emailForSignIn');
  window.history.replaceState({}, document.title, window.location.pathname);
  return result.user;
}

function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

async function logOut() {
  await signOut(auth);
}

window.APP = window.APP || {};
window.APP.firebase = window.APP.firebase || {};
Object.assign(window.APP.firebase, {
  sendMagicLink,
  isMagicLinkUrl,
  completeMagicLinkSignIn,
  watchAuthState,
  logOut,
});