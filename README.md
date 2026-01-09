# Bounce Game (Impact-style block breaker)

Browser-based 2D block-breaking game: move the paddle left/right, bounce the ball, break blocks, clear levels.

## Run
Because browsers restrict ES module loading from `file://`, run a tiny static server:

- macOS/Linux (script):

```bash
chmod +x ./serve.sh
./serve.sh
```

- Python:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` and click the canvas to focus it.

## High scores (Firebase / Firestore)
This project uses Cloud Firestore to store a simple Top 10 leaderboard.

- **Collection**: `scores`
- **Fields**: `name` (string), `score` (number), `createdAt` (timestamp), `version` (string)

### Firestore rules (open)
This repo includes `firestore.rules` with open read/write (easy but not secure). In Firebase Console, you can paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read, write: if true;
    }
  }
}
```

## Firebase App Check (reCAPTCHA v3)
This app initializes Firebase **App Check** using the **ReCaptchaV3Provider**.

### Enable it
- Firebase Console → **App Check** → register your web app and provide the reCAPTCHA v3 site key.
- If you turn on **enforcement** for Firestore, requests without valid App Check tokens will be rejected.

### Local development (debug tokens)
When running on `localhost`, the client sets `FIREBASE_APPCHECK_DEBUG_TOKEN = true` and Firebase will print a debug token in the browser console. Add it in Firebase Console → App Check → **Manage debug tokens**.

## Controls
- Move: A/D or Left/Right arrows (mouse movement also works when focused)
- Launch: Space
- Pause: P
- Restart: R


