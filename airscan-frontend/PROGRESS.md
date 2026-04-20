# AIRSCAN — Build Progress

> Read this at the start of every new Claude session to resume where we left off.
> Update this file whenever a step is completed or a decision is made.

---

## Project Summary
AIRSCAN is a radiation-free airway pre-screening web app (Next.js 16 + FastAPI).
It uses MediaPipe Face Mesh (3-angle facial scan) + demographic data to predict
OSA airway risk as Green / Yellow / Red.

**Repo:** (update with GitHub URL after push)
**Stack:** Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Firebase, Python FastAPI
**Dev server:** `cd airscan-frontend && npm run dev` → http://localhost:3000

---

## Build Order (from AIRSCAN_Claude_Code_Spec.md §8)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project scaffold (Next.js) | ✅ Done | Next.js 16.2.4, Tailwind v4, TypeScript strict |
| 2 | Firebase setup (auth, Firestore, Storage config) | ⏳ Pending | Config file exists (`src/lib/firebase.ts`) — needs real project credentials in `.env.local` |
| 3 | Login page with Google auth | ⏳ Pending | Landing page built; Google OAuth button present but not wired to Firebase Auth yet |
| 4 | Demographic form component | ✅ Done | `src/components/scan/DemographicsScreen.tsx` — validation, BMI calc, pill selectors |
| 5 | FastAPI backend scaffold + mock predictor | ✅ Done | `backend/main.py` + `schemas/` + `model/predictor.py`; run `uvicorn main:app --reload` |
| 6 | FaceScanner with MediaPipe (no capture yet) | ✅ Done | Real `getUserMedia()` + MediaPipe FaceMesh in `ScanScreen.tsx`; live video feed |
| 7 | Stability detection + image capture | ✅ Done | Yaw-based stability (N-frame window), canvas snapshot, real `CapturedFrame` output |
| 8 | 3-angle scan flow with progress indicator | ✅ Done | Full flow: Consent → Demographics → Instructions → Scan × 3 → Analyzing → Results |
| 9 | Connect frontend to FastAPI /predict | ✅ Done (mock) | `src/lib/api.ts` — switches on `NEXT_PUBLIC_USE_MOCK_MODEL=true`; real model pending |
| 10 | Results screen (Green/Yellow/Red) | ✅ Done | `src/app/results/page.tsx` — result card, confidence, feature breakdown |
| 11 | Firestore save scan history | ⏳ Pending | Using in-memory React context for now (`src/contexts/ScanContext.tsx`) |
| 12 | Scan history page | ✅ Done | `src/app/history/page.tsx` — filter tabs, list, detail view, delete |
| 13 | PDF report export | ⏳ Pending | Button present, no implementation yet |
| 14 | Deployment (Vercel + Cloud Run) | ⏳ Pending | Not started |

---

## What's Built (Session 1 — 19 Apr 2026)

### Frontend — all routes working
| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing page with hero, animated face mesh specimen card |
| `/dashboard` | `src/app/dashboard/page.tsx` | Stats, recent scans, scan CTA |
| `/scan` | `src/app/scan/page.tsx` | Full scan state machine (6 steps) |
| `/results` | `src/app/results/page.tsx` | Risk result card + feature breakdown |
| `/history` | `src/app/history/page.tsx` | Filter, list, detail, delete |
| `/settings` | `src/app/settings/page.tsx` | Profile, data/privacy settings |

### Components
| File | Description |
|------|-------------|
| `src/components/FaceMesh.tsx` | FaceMeshOverlay, FaceSilhouette, CameraFeed — simulated 140-point mesh |
| `src/components/scan/ConsentScreen.tsx` | PDPA consent with 3 checkboxes |
| `src/components/scan/DemographicsScreen.tsx` | Age/sex/weight/height/race form |
| `src/components/scan/ScanInstructionsScreen.tsx` | 3-angle instruction cards |
| `src/components/scan/ScanScreen.tsx` | Simulated camera + stability detection |
| `src/components/scan/AngleSuccessScreen.tsx` | Inter-angle success state |
| `src/components/scan/AnalyzingScreen.tsx` | Step-by-step analysis progress |
| `src/components/ui/Icons.tsx` | All SVG icons + AirscanMark brand |
| `src/components/ui/TopBar.tsx` | Desktop nav header |
| `src/components/ui/Disclaimer.tsx` | Medical disclaimer component |

### Lib
| File | Description |
|------|-------------|
| `src/lib/types.ts` | All TypeScript types |
| `src/lib/firebase.ts` | Firebase init (needs credentials) |
| `src/lib/api.ts` | predict() — mock or real FastAPI |
| `src/lib/mediapipe.ts` | estimateYaw, KEY_LANDMARK_INDICES, initMediaPipe |
| `src/contexts/ScanContext.tsx` | Global state (user, demographics, captures, results, scans) |

### Design System
- **Aesthetic:** Clinical-warm — petrol/sage/amber/terracotta
- **Fonts:** Instrument Serif (headings), Inter (body), JetBrains Mono (data)
- **Tokens:** Defined as CSS custom properties in `src/app/globals.css`
- **Theme toggle:** Add class `theme-spec` to body for clinical-cool palette

---

## What Needs To Be Done Next (Priority Order)

### 🔥 Next session should start here:

**Step B — Wire up real MediaPipe camera in ScanScreen** ✅ DONE (Session 2)

**Step A — Wire up real Firebase Auth (Google OAuth)**
1. Create a Firebase project at console.firebase.google.com
2. Fill in `.env.local` with the 6 Firebase config values
3. In `src/app/page.tsx`, replace the mock `router.push('/dashboard')` with:
   `signInWithPopup(auth, googleProvider)` → on success → `router.push('/dashboard')`
4. Add a `useEffect` auth state listener in `ScanContext.tsx` to set real user

**Step B — Wire up real MediaPipe camera in ScanScreen**
1. Replace the simulated state machine in `src/components/scan/ScanScreen.tsx`
2. Call `getUserMedia()` to start the live camera feed into a `<video>` element
3. Call `initMediaPipe()` from `src/lib/mediapipe.ts` on each frame
4. Use `estimateYaw()` and `isInTargetZone()` to detect correct head angle
5. On stability (10 frames), call `triggerCapture()` to snapshot the video frame

**Step C — FastAPI backend scaffold**
1. Create `backend/` folder with `main.py`, `requirements.txt`, `Dockerfile`
2. Implement mock `predictor.py` (same logic as `src/lib/api.ts` mock)
3. Run: `uvicorn main:app --reload` → test with `curl localhost:8000/predict`
4. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`

**Step D — Replace mock scans with Firestore**
1. In `ScanContext.tsx`, replace `useState(makeMockScans)` with Firestore reads
2. On `addScan()`, write to `users/{uid}/scans/{scanId}` in Firestore
3. Upload captured images to Firebase Storage before writing the doc

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| State managed in React Context (`ScanContext`) | Simpler than URL params for multi-step scan flow; easy to replace with Firestore later |
| Simulated MediaPipe in ScanScreen | Unblocks UI testing before camera integration; same state machine, just replace the tick loop |
| Mock predictor in `api.ts` | Unblocks full flow testing; `NEXT_PUBLIC_USE_MOCK_MODEL=true` flag to switch |
| Tailwind v4 (not v3) | create-next-app installed v4 automatically; CSS variables approach is compatible |
| Design tokens as CSS custom properties | Allows easy theming (warm vs cool) without Tailwind config changes |

---

## Open Questions (from spec)
- [ ] Exact landmark indices from Dr. Iqmal / Prof. Alfah (currently using 12 placeholders in `src/lib/mediapipe.ts`)
- [ ] Exact JSON input schema the Python model expects
- [ ] Should images be sent to backend, or just landmark coordinates?
- [ ] Firebase project to use — create new or existing?
- [ ] Production domain for CORS whitelist
- [ ] English only or Malay + English for prototype?

---

## Environment
- **OS:** Windows 11
- **Shell:** bash (use Unix paths in commands)
- **Node:** check with `node -v`
- **Python:** needed for FastAPI backend (Step C above)
- **Working dir:** `C:/Users/Mirza/Documents/Airscan/airscan-frontend`

## Quick Commands
```bash
# Start frontend dev server
cd airscan-frontend && npm run dev

# Build check
cd airscan-frontend && npm run build

# Start backend (once built)
cd backend && uvicorn main:app --reload
```
