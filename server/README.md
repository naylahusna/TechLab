# TechLab Attendance API

QR attendance runs in the local Express API. Firebase Authentication remains the identity provider and Cloud Firestore remains the database. Firebase Admin credentials stay on the laptop running this server; the Expo app receives only Firebase ID tokens and the QR image.

## Setup

1. Install Node.js 20 or later.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env`.
4. Create or select a Firebase service account with Firestore access. Store the JSON outside the repository, then set `FIREBASE_SERVICE_ACCOUNT_PATH` in `server/.env` to its local path. Alternatively set `GOOGLE_APPLICATION_CREDENTIALS` in the shell. Never copy the key into the Expo app or commit it.
5. Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the exact Expo web origins you use.
6. Start the API with `npm run dev`; for normal use, run `npm start`.

The API listens on `0.0.0.0:8788` by default. The app detects the Expo development host on native devices and the browser hostname on web when `EXPO_PUBLIC_ATTENDANCE_API_URL` is empty. You can set that variable in the repository root `.env` to override the detected address. If you set it manually on a phone, use the laptop's LAN IPv4 address, such as `http://192.168.1.20:8788`; allow port 8788 through the local firewall and keep the phone and laptop on the same network. Restart Expo after editing the public environment variable.

## Routes

All `/api/attendance/*` routes require `Authorization: Bearer <Firebase ID token>`.

| Method | Route | Use |
|---|---|---|
| POST | `/api/attendance/qr` | Assistant creates or regenerates a session QR. Returns a PNG data URL and expiry. |
| POST | `/api/attendance/verify` | Practitioner verifies a scanned token and enrollment. |
| POST | `/api/attendance/submit` | Records attendance once using a Firestore transaction. |
| POST | `/api/attendance/disable` | Assistant disables the current QR token. |
| POST | `/api/attendance/close` | Assistant closes an open session and disables its QR in the same transaction. |
| GET | `/healthz` | Local server health check. |

The token itself is random and high entropy. Only its SHA-256 hash is stored in `attendanceQrSessions/{sessionId}`. Attendance remains in the existing `attendances/{sessionId}_{uid}` documents, preserving the repository's established schema.

## Troubleshooting

- `Attendance API tidak dapat dihubungi`: start this API and verify the Expo base URL is reachable from the device.
- `Origin tidak diizinkan`: add the exact browser origin, including scheme and port, to `FRONTEND_URL` or `CORS_ALLOWED_ORIGINS`.
- `Sesi harus sedang dibuka`: open the session in TechLab first and ensure the current time is before `endAt`.
- Firebase credential errors: check the service account path and confirm it belongs to `techlab-naylahusna-2026` with Firestore access.
- On-device requests to `127.0.0.1` go to the phone itself. Use the computer's LAN IP instead.
