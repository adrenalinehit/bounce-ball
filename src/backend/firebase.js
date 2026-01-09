import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  ReCaptchaV3Provider,
  initializeAppCheck,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKcbuBcG1MVGx-0ZSqpm5DAW0Q2XmH4Sk",
  authDomain: "bounce-ball-9f8d1.firebaseapp.com",
  projectId: "bounce-ball-9f8d1",
  storageBucket: "bounce-ball-9f8d1.firebasestorage.app",
  messagingSenderId: "830481490222",
  appId: "1:830481490222:web:56decd601559302b871abf",
};

// Firebase App Check (reCAPTCHA v3)
// NOTE: This is the App Check site key (public), configured in Firebase Console → App Check.
const APP_CHECK_SITE_KEY = "6LdRekUsAAAAAHwevN-t_Dm52Uwfm0GyMDOd_XTK";

const app = initializeApp(firebaseConfig);

// Helpful for local dev before enabling/enforcing App Check:
// - When FIREBASE_APPCHECK_DEBUG_TOKEN is true, Firebase prints a debug token in the console.
// - Add that token in Firebase Console → App Check → Manage debug tokens.
try {
  if (typeof window !== "undefined") {
    const host = window.location?.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      // eslint-disable-next-line no-undef
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
  }
} catch {
  // ignore
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

const db = getFirestore(app);
const functions = getFunctions(app);
const scoresCol = collection(db, "scores");

function sanitizeName(name) {
  const s = String(name ?? "").trim().replace(/\s+/g, " ");
  return s.slice(0, 16);
}

function sanitizeScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export async function submitScore({ name, score, version } = {}) {
  const safeName = sanitizeName(name);
  const safeScore = sanitizeScore(score);
  if (!safeName) throw new Error("Name required");

  await addDoc(scoresCol, {
    name: safeName,
    score: safeScore,
    version: typeof version === "string" ? version : "web",
    createdAt: serverTimestamp(),
  });
}

export async function fetchTopScores({ topN = 10 } = {}) {
  const q = query(scoresCol, orderBy("score", "desc"), orderBy("createdAt", "desc"), limit(topN));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: typeof data.name === "string" ? data.name : "Unknown",
      score: typeof data.score === "number" ? data.score : 0,
      createdAt: data.createdAt ?? null,
    };
  });
}

const verifyRecaptchaV3Callable = httpsCallable(functions, "verifyRecaptchaV3");

export async function verifyRecaptchaV3({ token, action } = {}) {
  const t = String(token ?? "");
  const a = String(action ?? "");
  if (!t) throw new Error("Missing reCAPTCHA token");
  if (!a) throw new Error("Missing reCAPTCHA action");
  const res = await verifyRecaptchaV3Callable({ token: t, action: a });
  return res.data;
}


