**AIRSCAN**

Facial Scanning Flow — Implementation Specification

_Addendum to Claude Code Dev Spec v1.0_

Version 1.0  |  April 2026  |  Mirza Azhan

 


# Overview & Approach Decision

This document defines exactly how the facial scanning feature works in AIRSCAN. Two approaches were considered — uploading static photos vs. guided head rotation — and a hybrid approach was chosen for the prototype.

 

| **Approach**                        | **Description**                                                                             | **Build Complexity** | **Decision**                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- | -------------------- | ---------------------------- |
| Option A — Static Photos            | User takes 3 separate photos: front, left, right                                            | Low                  | Use for v1 prototype         |
| Option B — Continuous Head Rotation | User holds phone still and rotates head while camera tracks live                            | High                 | Build in v2 after validation |
| CHOSEN — Guided Auto-Capture        | Guided UI shows which angle to present; MediaPipe auto-captures when correct angle detected | Medium               | This spec implements this    |

 

The chosen approach feels guided and smooth to the user (like Face ID) but is much simpler to build than true continuous 3D tracking. Under the hood it captures 3 still frames — one per angle — triggered automatically when MediaPipe detects the correct head orientation.

\


 


# 1. Complete Scanning User Flow

Implement this exact sequence inside the /scan/page.tsx route:

 

| **Step** | **Screen State**  | **What User Sees**                                                                                        | **What App Does**                                                                                               |
| -------- | ----------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1        | CONSENT           | Checkbox: 'I consent to my facial data being collected for health screening purposes'  +  Continue button | Store consent timestamp in Firestore before camera opens. Do NOT open camera until consent given.               |
| 2        | INSTRUCTIONS      | Animated guide showing 3 angle icons (front, left arrow, right arrow) with brief text                     | Pre-load MediaPipe model in background while user reads instructions                                            |
| 3        | CAMERA PERMISSION | Browser native permission dialog appears                                                                  | Call getUserMedia(). If denied, show friendly error with instructions to enable camera in browser settings.     |
| 4        | FRONT SCAN        | Live camera feed with oval face guide overlay. Status: 'Look straight at the camera'                      | Run MediaPipe every frame. Detect when face is centred and yaw angle is between -10 and +10 degrees.            |
| 5        | FRONT CAPTURED    | Green checkmark animation. Thumbnail preview of captured frame.                                           | Save front frame image + landmark array to React state. Auto-advance after 1.5 seconds.                         |
| 6        | LEFT SCAN         | Live camera feed. Arrow pointing left. Status: 'Slowly turn your head to the LEFT'                        | Detect when yaw angle is between -40 and -55 degrees and stable for 8 frames.                                   |
| 7        | LEFT CAPTURED     | Green checkmark. Thumbnail preview.                                                                       | Save left frame + landmarks. Auto-advance after 1.5 seconds.                                                    |
| 8        | RIGHT SCAN        | Live camera feed. Arrow pointing right. Status: 'Now turn your head to the RIGHT'                         | Detect when yaw angle is between +40 and +55 degrees and stable for 8 frames.                                   |
| 9        | RIGHT CAPTURED    | Green checkmark. All 3 thumbnails shown.                                                                  | Save right frame + landmarks. Show 'Analysing...' button.                                                       |
| 10       | PROCESSING        | Loading spinner. Text: 'Analysing your facial structure...'                                               | Upload images to Firebase Storage. POST landmarks + demographics to FastAPI /predict. Show estimated wait time. |
| 11       | RESULT            | Green / Yellow / Red result card                                                                          | Display result, save scan record to Firestore, offer report download.                                           |

\


 


# 2. MediaPipe Setup & Installation

## 2.1 Install packages

npm install @mediapipe/face\_mesh @mediapipe/camera\_utils @mediapipe/drawing\_utils

 


## 2.2 lib/mediapipe.ts — initialisation module

Create this file. It loads MediaPipe once and exports a singleton:

 

import { FaceMesh } from '@mediapipe/face\_mesh'

 

let faceMeshInstance: FaceMesh | null = null

 

export async function initMediaPipe(

  onResults: (results: any) => void

): Promise\<FaceMesh> {

  if (faceMeshInstance) return faceMeshInstance

 

  const faceMesh = new FaceMesh({

    locateFile: (file) =>

      \`https\://cdn.jsdelivr.net/npm/@mediapipe/face\_mesh/${file}\`

  })

 

  faceMesh.setOptions({

    maxNumFaces: 1,

    refineLandmarks: true,   // enables iris + detailed lips

    minDetectionConfidence: 0.7,

    minTrackingConfidence: 0.7,

  })

 

  faceMesh.onResults(onResults)

  await faceMesh.initialize()

  faceMeshInstance = faceMesh

  return faceMesh

}

 

NOTE: refineLandmarks: true gives more accurate points around the nose and mouth — important for AIRSCAN's airway measurements. It adds \~5ms per frame but is worth it.

\


 


# 3. Head Pose Estimation — Detecting Yaw Angle

MediaPipe does not directly return yaw/pitch/roll angles. You calculate them from landmark positions. Use this function in lib/mediapipe.ts:

 

// Returns head yaw in degrees. Negative = turned left. Positive = turned right.

export function estimateYaw(landmarks: any\[]): number {

  // Use distance between nose tip and ear landmarks to estimate rotation

  // Landmark 4 = nose tip, 234 = left cheek edge, 454 = right cheek edge

  const nose  = landmarks\[4]

  const leftCheek  = landmarks\[234]

  const rightCheek = landmarks\[454]

 

  // When facing forward: distLeft ≈ distRight

  // When turned left: distLeft shrinks, distRight grows

  const distLeft  = Math.abs(nose.x - leftCheek.x)

  const distRight = Math.abs(nose.x - rightCheek.x)

  const ratio = (distRight - distLeft) / (distRight + distLeft)

 

  // Scale ratio to approximate degrees (-90 to +90)

  return ratio \* 90

}

 

Angle thresholds to use for capture triggering:

 

| **Angle / Shot** | **Yaw Range** | **Stability Required** | **Notes**                                        |
| ---------------- | ------------- | ---------------------- | ------------------------------------------------ |
| Front facing     | -10° to +10°  | 10 consecutive frames  | Most important shot — ensure face is centred     |
| Left profile     | -40° to -55°  | 8 consecutive frames   | User's left — they turn their head to the left   |
| Right profile    | +40° to +55°  | 8 consecutive frames   | User's right — they turn their head to the right |

 

NOTE: 'Stability' means the yaw value stays within a 5-degree window across N consecutive frames. This prevents blurry captures caused by the head still moving.

\


 


# 4. FaceScanner Component — Full Specification

## 4.1 Component interface

// components/FaceScanner.tsx

 

export type ScanAngle = 'front' | 'left' | 'right'

 

export interface CapturedFrame {

  angle: ScanAngle

  imageDataUrl: string       // base64 PNG for Firebase Storage upload

  landmarks: LandmarkPoint\[] // array of 468 {x,y,z} objects

  yawAtCapture: number       // degrees at moment of capture

  capturedAt: string         // ISO timestamp

}

 

interface FaceScannerProps {

  angle: ScanAngle           // which angle to capture

  onCapture: (frame: CapturedFrame) => void

  onError: (message: string) => void

}

 


## 4.2 Internal state

const \[status, setStatus] = useState<

  'loading' | 'waiting' | 'detecting' | 'stable' | 'captured' | 'error'

\>('loading')

 

const \[stableFrameCount, setStableFrameCount] = useState(0)

const \[currentYaw, setCurrentYaw]             = useState(0)

const \[faceDetected, setFaceDetected]         = useState(false)

 


## 4.3 Canvas overlay — what to draw on the video feed

Draw these elements on a canvas layered over the video element:

 

| **Element**     | **Condition**                       | **Appearance**                                                             |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| Face oval guide | Always visible                      | White dashed ellipse centred on screen — shows user where to position face |
| Face mesh dots  | Face detected                       | Small cyan dots at each of the 468 landmark positions                      |
| Oval fill       | Face NOT in target zone             | Red semi-transparent oval — tells user to adjust position                  |
| Oval fill       | Face in target zone, not stable yet | Yellow semi-transparent oval — getting close                               |
| Oval fill       | Stable — about to capture           | Green semi-transparent oval + countdown animation                          |
| Yaw indicator   | Always (dev mode only)              | Small text showing current yaw angle — remove before production            |
| Arrow indicator | Left/right scan screens             | Animated arrow pointing in the required direction                          |

 


## 4.4 Capture logic — step by step

// Called on every MediaPipe onResults callback

function handleResults(results: any) {

  if (!results.multiFaceLandmarks?.length) {

    setFaceDetected(false)

    setStableFrameCount(0)

    return

  }

 

  const landmarks = results.multiFaceLandmarks\[0]

  const yaw = estimateYaw(landmarks)

  setFaceDetected(true)

  setCurrentYaw(yaw)

  drawOverlay(landmarks, yaw)  // update canvas

 

  const inZone = isInTargetZone(yaw, props.angle)

  if (inZone) {

    setStableFrameCount(prev => {

      const next = prev + 1

      const required = props.angle === 'front' ? 10 : 8

      if (next >= required && status !== 'captured') {

        triggerCapture(landmarks, yaw)  // auto-capture!

      }

      return next

    })

  } else {

    setStableFrameCount(0)  // reset if head moves out of zone

  }

}

 


## 4.5 triggerCapture function

// Captures a still frame from the video element

function triggerCapture(landmarks: any\[], yaw: number) {

  setStatus('captured')

 

  // Draw current video frame to a hidden canvas and export as PNG

  const captureCanvas = document.createElement('canvas')

  captureCanvas.width  = videoRef.current.videoWidth

  captureCanvas.height = videoRef.current.videoHeight

  const captureCtx = captureCanvas.getContext('2d')!

  captureCtx.drawImage(videoRef.current, 0, 0)

  const imageDataUrl = captureCanvas.toDataURL('image/png')

 

  // Extract only the KEY\_LANDMARK\_INDICES (not all 468)

  const keyLandmarks = KEY\_LANDMARK\_INDICES.map(i => ({

    index: i,

    x: landmarks\[i].x,

    y: landmarks\[i].y,

    z: landmarks\[i].z

  }))

 

  props.onCapture({

    angle: props.angle,

    imageDataUrl,

    landmarks: keyLandmarks,

    yawAtCapture: yaw,

    capturedAt: new Date().toISOString()

  })

}

\


 


# 5. Scan Page — Orchestrating All 3 Angles

The /scan/page.tsx manages the full multi-step flow using a simple state machine:

 

// Scan page state

type ScanStep =

  | 'consent'

  | 'instructions'

  | 'scan-front'

  | 'scan-left'

  | 'scan-right'

  | 'processing'

  | 'complete'

 

const \[step, setStep]                     = useState\<ScanStep>('consent')

const \[captures, setCaptures]             = useState\<CapturedFrame\[]>(\[])

const \[demographics, setDemographics]     = useState\<Demographics | null>(null)

const \[result, setResult]                 = useState\<PredictResponse | null>(null)

 


## 5.1 Handling a capture and advancing to next angle

// Called by FaceScanner when a frame is successfully captured

function handleCapture(frame: CapturedFrame) {

  const updated = \[...captures, frame]

  setCaptures(updated)

 

  setTimeout(() => {

    if (frame.angle === 'front') setStep('scan-left')

    else if (frame.angle === 'left') setStep('scan-right')

    else if (frame.angle === 'right') submitScan(updated)

  }, 1500)  // 1.5s delay to show success state

}

 


## 5.2 submitScan — sending data to the API

// Called after all 3 angles are captured

async function submitScan(frames: CapturedFrame\[]) {

  setStep('processing')

 

  // 1. Upload images to Firebase Storage

  const imageRefs: Record\<string, string> = {}

  for (const frame of frames) {

    const path = \`scans/${user.uid}/${scanId}/${frame.angle}.png\`

    const ref  = storageRef(storage, path)

    await uploadString(ref, frame.imageDataUrl, 'data\_url')

    imageRefs\[frame.angle] = path

  }

 

  // 2. POST to FastAPI predict endpoint

  const response = await fetch(\`${process.env.NEXT\_PUBLIC\_API\_URL}/predict\`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({

      demographics,

      landmarks: {

        front: frames.find(f => f.angle==='front')?.landmarks,

        left:  frames.find(f => f.angle==='left')?.landmarks,

        right: frames.find(f => f.angle==='right')?.landmarks,

      }

    })

  })

  const result: PredictResponse = await response.json()

 

  // 3. Save scan record to Firestore

  await setDoc(doc(db, 'users', user.uid, 'scans', scanId), {

    scanId, createdAt: serverTimestamp(),

    demographics, imageRefs, result

  })

 

  setResult(result)

  setStep('complete')

}

\


 


# 6. Key Landmark Indices — What to Extract

Define this constant in lib/mediapipe.ts. These are the placeholder indices until Dr. Iqmal confirms the final list:

 

// PLACEHOLDER — confirm final list with Dr. Iqmal before production

export const KEY\_LANDMARK\_INDICES = \[

  4,    // Nose tip           — midface reference

  6,    // Nose bridge        — upper face axis

  33,   // Left eye corner    — orbital width

  263,  // Right eye corner   — orbital width

  234,  // Left cheekbone     — facial width

  454,  // Right cheekbone    — facial width

  152,  // Chin               — lower jaw length

  0,    // Upper lip          — midface height

  172,  // Left jaw           — jaw width

  397,  // Right jaw          — jaw width

  10,   // Forehead centre    — face height top

  168,  // Mid nose           — nose bridge depth

]

 

**IMPORTANT: Do not send all 468 landmarks to the API. Extract only KEY\_LANDMARK\_INDICES. Sending all 468 would increase payload size and the model only uses a subset anyway.**

\


 


# 7. UI States & User Feedback

Every state the user can be in needs clear visual feedback. Implement these exactly:

 

| **Status**                        | **Oval Color**          | **Status Text**                                                         | **Sound / Haptic**                              |
| --------------------------------- | ----------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Loading MediaPipe                 | White dashed            | 'Preparing camera...'                                                   | None                                            |
| No face detected                  | Red semi-transparent    | 'Position your face inside the oval'                                    | None                                            |
| Face detected, wrong angle        | Yellow semi-transparent | Angle-specific instruction (e.g. 'Turn more to the left')               | None                                            |
| Face in target zone — stabilising | Yellow → Green pulse    | 'Hold still...' + progress bar filling                                  | None                                            |
| About to capture                  | Solid green             | 3... 2... 1... countdown                                                | None (no sound — medical context)               |
| Captured                          | Green with checkmark    | 'Got it!' + thumbnail shown                                             | Subtle haptic on mobile (navigator.vibrate(50)) |
| Camera permission denied          | N/A — error screen      | 'Camera access is required. Please enable it in your browser settings.' | None                                            |

 


## 7.1 Progress indicator — show which step user is on

At the top of the scan screen, always show:

 

Step 1 of 3 — Front View        ● ○ ○

Step 2 of 3 — Left Profile      ● ● ○

Step 3 of 3 — Right Profile     ● ● ●

 

Use the 3 thumbnail previews as the progress indicators — they start greyed out and fill in with the captured image as each angle is completed.

\


 


# 8. Error Handling — All Cases

| **Error**                       | **Cause**                                      | **What to Show User**                                                                             | **Recovery**                                             |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Camera permission denied        | User clicked 'Block' on browser dialog         | Friendly screen explaining how to re-enable camera in browser settings. Include screenshot guide. | Button: 'Try Again' re-requests permission               |
| No face detected for 10 seconds | Bad lighting, face out of frame, glasses issue | 'Having trouble detecting your face? Try better lighting or remove glasses temporarily.'          | Auto-retry — no action needed                            |
| MediaPipe fails to load         | Slow internet, CDN issue                       | 'Preparing scanner... this may take a moment on slow connections.'                                | Retry loading MediaPipe up to 3 times                    |
| API /predict returns error      | Backend down, model error                      | 'Analysis failed. Please try again. If the problem persists, contact support.'                    | Button: 'Retry Analysis' — resubmits without re-scanning |
| Firebase upload fails           | No internet during upload                      | 'Please check your internet connection and try again.'                                            | Button: 'Retry Upload'                                   |
| User exits mid-scan             | Browser back button                            | Show confirmation dialog: 'Your scan is not complete. Leave anyway?'                              | If confirmed, discard partial scan data                  |

\


 


# 9. Version 2 Upgrade — Continuous Head Rotation

Once the v1 prototype is validated, this is how to upgrade to the smoother continuous head rotation flow (like Face ID):

 

<!--[if !supportLists]-->•       <!--[endif]-->Replace the 3-step angle flow with a single continuous scan session

<!--[if !supportLists]-->•       <!--[endif]-->Track yaw continuously and sample landmark data at regular intervals (e.g. every 5 degrees of rotation)

<!--[if !supportLists]-->•       <!--[endif]-->Collect \~18 frames covering -45° to +45° rotation arc

<!--[if !supportLists]-->•       <!--[endif]-->Average the landmark positions across frames for more stable measurements

<!--[if !supportLists]-->•       <!--[endif]-->Show a circular progress indicator that fills as the user rotates their head

<!--[if !supportLists]-->•       <!--[endif]-->Require the full -45° to +45° sweep to be completed within 10 seconds

 

NOTE: This upgrade does NOT require changes to the FastAPI model API — Dr. Iqmal's model just receives more averaged landmark data. The API contract stays the same.

\


 


# 10. Testing Checklist Before Handing to Science Team

Before showing the prototype to Dr. Iqmal's team, verify all of these:

 

| **Test**                                   | **Expected Result**                                       | **Pass?** |
| ------------------------------------------ | --------------------------------------------------------- | --------- |
| Open app on Chrome desktop — camera works  | Live video feed appears, MediaPipe loads                  | \[ ]      |
| Open app on Android Chrome — camera works  | Live video feed appears, MediaPipe loads                  | \[ ]      |
| Open app on iOS Safari — camera works      | Live video feed appears, MediaPipe loads                  | \[ ]      |
| Front angle — face centred — auto-captures | Green oval, capture triggers within 1 second of stability | \[ ]      |
| Left angle — turned -45° — auto-captures   | Green oval, capture triggers                              | \[ ]      |
| Right angle — turned +45° — auto-captures  | Green oval, capture triggers                              | \[ ]      |
| All 3 angles captured — API called         | POST /predict is called with correct JSON structure       | \[ ]      |
| Mock model returns green result            | Green result card displayed correctly                     | \[ ]      |
| Mock model returns red result              | Red result card with correct message displayed            | \[ ]      |
| Scan saved to Firestore                    | Scan appears in /history page                             | \[ ]      |
| Firebase Storage — image uploaded          | PNG visible in Firebase console under scans/{uid}/        | \[ ]      |
| User exits mid-scan — confirmation dialog  | Dialog appears asking to confirm exit                     | \[ ]      |
| Camera blocked — helpful error shown       | Error screen with instructions shown, no crash            | \[ ]      |
| Disclaimer visible on results screen       | Medical disclaimer text present                           | \[ ]      |
| Consent checkbox required before scan      | Cannot proceed without ticking consent                    | \[ ]      |

 

 

**Build Section 4 (FaceScanner component) first. Everything else in this doc depends on it working.**

AIRSCAN Scanning Spec v1.0  |  Mirza Azhan  |  April 2026
