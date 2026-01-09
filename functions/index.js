const { onCall, HttpsError } = require("firebase-functions/v2/https");

// v2 functions can use secrets; set via:
//   firebase functions:secrets:set RECAPTCHA_SECRET
// then deploy.

const SCORE_THRESHOLD = 0.5;

exports.verifyRecaptchaV3 = onCall({ cors: true, secrets: ["RECAPTCHA_SECRET"] }, async (request) => {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) throw new HttpsError("failed-precondition", "Missing RECAPTCHA_SECRET");

  const token = String(request.data?.token ?? "");
  const action = String(request.data?.action ?? "");
  if (!token) throw new HttpsError("invalid-argument", "Missing token");
  if (!action) throw new HttpsError("invalid-argument", "Missing action");

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  // Optional: include remote IP if present
  const ip =
    request.rawRequest?.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    request.rawRequest?.ip;
  if (ip) body.set("remoteip", ip);

  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) throw new HttpsError("unavailable", "reCAPTCHA verify request failed");
  const data = await resp.json();

  const ok = data?.success === true && data?.action === action && typeof data?.score === "number" && data.score >= SCORE_THRESHOLD;
  if (!ok) {
    throw new HttpsError("permission-denied", "reCAPTCHA verification failed", {
      success: data?.success ?? false,
      score: data?.score ?? null,
      action: data?.action ?? null,
      hostname: data?.hostname ?? null,
      errorCodes: data?.["error-codes"] ?? null,
    });
  }

  return { ok: true, score: data.score, action: data.action, hostname: data.hostname ?? null };
});


