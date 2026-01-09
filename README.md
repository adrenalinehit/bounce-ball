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

## reCAPTCHA v3 (verified via Cloud Functions)
The name “Play” button uses reCAPTCHA v3 and verifies the token via a Firebase Callable Cloud Function.

### Setup steps
- Create a **reCAPTCHA v3 secret key** in Google reCAPTCHA admin and add your domains (include `localhost` for dev).
- Install Firebase CLI (`firebase-tools`) and login.
- Set the secret used by the function:

```bash
firebase functions:secrets:set RECAPTCHA_SECRET
```

- Deploy the function:

```bash
firebase deploy --only functions:verifyRecaptchaV3
```

## Controls
- Move: A/D or Left/Right arrows (mouse movement also works when focused)
- Launch: Space
- Pause: P
- Restart: R


