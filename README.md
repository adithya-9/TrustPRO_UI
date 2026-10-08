# TrustPRO UI

React 19 + TypeScript front end for **TrustPRO - AI Interview Protector** (Trustmate).

Journey: landing page, then sign in or register, candidate profile (name, date of birth,
mobile, city, photo), ID capture on camera (no checks at this step), device check, a 10-second
countdown that calibrates gaze in the background, the live interview with gaze and environment
monitoring, interview completed, and finally the generated report. The ID is checked against the
profile (name, date of birth, photo) during report generation.

## Run

The backend must be running on port 8000 (see `../trustpro_backend/README.md`).

```powershell
cd E:\trustumate\trustpro_ui
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api` (including the live-monitor WebSocket) to `http://127.0.0.1:8000`, so the
session cookie stays same-origin. Set `TRUSTPRO_API_URL` to proxy elsewhere.

Camera access needs `localhost` or HTTPS. Use a recent Chrome, Edge or Firefox; MediaRecorder
WebM support is required for recording.

```powershell
npm run build        # type-check + production build into dist/
npm test             # unit tests (vitest)
```

For production, serve `dist/` behind the same origin as the API (a reverse proxy routing
`/api` to the backend, with WebSocket upgrade enabled).

## Structure

```
src/
  api/           fetch wrapper (ApiError with user-facing messages) and typed endpoint functions
  types/         API types
  hooks/         useAuth, useCamera (permission and error states), useRecorder (chunked
                 upload with retry), useLiveMonitor (WebSocket frame streaming with back-pressure)
  components/ui  design system: Button, Card, Badge, Field, Alert, Modal, Toast, Progress, Logo
  components/layout  AppShell, RequireAuth, CameraStatusPanel
  features/
    landing/        marketing page
    auth/           sign in / register
    dashboard/      onboarding checklist and interview list with live report progress
    profile/        profile form (first / last name, DOB, mobile, city) and profile photo with webcam capture
    verification/   ID capture with a card guide, preview with retake, then continue to the interview
    interview/      device check, live room with the 10-second calibration countdown, completed screen, interrupted recovery
    report/         progress, overview / identity and ID check / gaze / environment / processing sections and charts
```

## Design notes

- One token set (`src/index.css`) for colour, radius, shadow and motion. Status colours always come with an icon and text.
- Gaze direction colours are a validated categorical set: lightness, chroma, colour-blind separation and 3:1 contrast all pass. "Face not visible" is a hatched neutral, not a hue.
- Wording is observational ("Mobile phone detected", "Looking Left"). The UI never states that a candidate cheated.
- Motion is limited to short fades and progress transitions and respects `prefers-reduced-motion`.
- Pages other than the landing and sign-in screens are code-split.
