**AIRSCAN**

Claude Code Development Specification

*Hand this document to Claude Code to start building the prototype*

Version 1.0 \| April 2026 \| Mirza Azhan

**Instructions for Claude Code**

**READ THIS FIRST: You are building a web-based pre-screening app called
AIRSCAN. This document contains everything you need to build the
prototype. Follow the file structure, tech stack, and feature
specifications exactly. Do not deviate from the stack unless there is a
strong technical reason. When in doubt, ask before proceeding.**

**Project Summary (One Paragraph)**

AIRSCAN is a Next.js web application that guides a user through a
multi-angle facial scan, extracts facial landmark coordinates using
MediaPipe Face Mesh, submits those coordinates (along with demographic
data) to a Python FastAPI backend, receives a risk classification result
(green/yellow/red), and displays it to the user. The Python model is
pre-built by the science team and delivered as a Pickle file. Your job
is to build the full-stack application around it.

**1. Tech Stack --- Use Exactly This**

  ------------------------------------------------------------------------
  **Layer**             **Technology**        **Version / Notes**
  --------------------- --------------------- ----------------------------
  Frontend Framework    Next.js               v14+ with App Router

  UI Library            Tailwind CSS          v3 --- utility classes only

  Component Library     shadcn/ui             Install via: npx
                                              shadcn-ui@latest init

  Facial Landmark       MediaPipe Face Mesh   Via \@mediapipe/face_mesh
  Detection                                   npm package

  Camera Access         Browser MediaDevices  getUserMedia() --- built
                        API                   into browsers

  Authentication        Firebase Auth         Google OAuth provider

  Database              Firebase Firestore    NoSQL --- store user
                                              profiles and scan history

  File Storage          Firebase Storage      Store encrypted face scan
                                              images

  Backend API           Python FastAPI        v0.100+ --- wraps the ML
                                              model

  ML Model              Python scikit-learn / .pkl file provided by Dr.
                        Pickle                Iqmal

  Backend Server        Uvicorn               ASGI server for FastAPI

  Containerisation      Docker                Dockerfile for backend
                                              deployment

  Hosting --- Frontend  Vercel                Auto-deploys from GitHub

  Hosting --- Backend   Google Cloud Run      Containerised FastAPI

  Language --- Frontend TypeScript            Strict mode enabled

  Language --- Backend  Python 3.11+          
  ------------------------------------------------------------------------

**2. Project File Structure**

Create this exact folder structure:

airscan/

frontend/ \# Next.js app

app/

page.tsx \# Landing / login page

dashboard/page.tsx \# User dashboard

scan/page.tsx \# Main scanning flow

results/page.tsx \# Green/Yellow/Red results

history/page.tsx \# Past scans

components/

DemographicForm.tsx \# Age, gender, weight, height, race

FaceScanner.tsx \# Camera + MediaPipe landmark extraction

ScanInstructions.tsx \# Guided angle instructions

ResultCard.tsx \# Green/Yellow/Red display

ReportExport.tsx \# PDF report generator

lib/

firebase.ts \# Firebase config + init

mediapipe.ts \# MediaPipe setup + landmark extraction

api.ts \# API calls to FastAPI backend

types.ts \# TypeScript type definitions

public/

scan-front.png \# Instruction image --- front angle

scan-left.png \# Instruction image --- left angle

scan-right.png \# Instruction image --- right angle

backend/ \# Python FastAPI

main.py \# FastAPI app entry point

model/

airway_model.pkl \# ML model file from Dr. Iqmal \[PLACEHOLDER\]

predictor.py \# Load and run the model

schemas/

request.py \# Pydantic request schema

response.py \# Pydantic response schema

Dockerfile

requirements.txt

.env.local \# Environment variables (never commit)

README.md

**3. Feature Specifications**

**3.1 Authentication --- Firebase Google Login**

-   Use Firebase Auth with Google OAuth provider

-   Users must be logged in before starting a scan

-   On first login, create a user profile document in Firestore

-   Store: uid, email, displayName, createdAt, scanCount

-   Redirect unauthenticated users to the landing page

**Firestore user document structure:**

users/{uid} {

email: string

displayName: string

createdAt: Timestamp

scanCount: number

}

**3.2 Demographic Form**

-   Fields: age (number), gender (select), weight in kg (number), height
    in cm (number), race/ethnicity (select)

-   All fields required before proceeding to scan

-   Validate: age 5-80, weight 10-200kg, height 50-250cm

-   Gender options: Male, Female, Prefer not to say

-   Race options: Malay, Chinese, Indian, Other

-   Store form data temporarily in React state --- submit together with
    scan data

**3.3 Facial Scanning --- The Core Feature**

This is the most important component. Build it carefully.

**How it works:**

-   Use MediaPipe Face Mesh to detect 468 facial landmarks in real time

-   Guide user through 3 angles: Front, Left Profile, Right Profile

-   For each angle: show instruction, activate camera, detect face,
    capture landmarks when face is stable

-   Face is considered stable when landmark positions change less than
    2px across 10 consecutive frames

-   Capture a still image AND the landmark coordinates for each angle

-   Show a green overlay when the face is detected and stable

**Key landmarks to extract (indices from MediaPipe 468-point model):**

-   Nose tip: landmark 4

-   Nose bridge: landmark 6

-   Left eye outer corner: landmark 33

-   Right eye outer corner: landmark 263

-   Left cheekbone: landmark 234

-   Right cheekbone: landmark 454

-   Chin: landmark 152

-   Upper lip: landmark 0

-   Jaw left: landmark 172

-   Jaw right: landmark 397

NOTE: Dr. Iqmal will provide the final confirmed list of landmarks. Use
these as placeholders until confirmed.

**FaceScanner component props:**

interface FaceScannerProps {

angle: \'front\' \| \'left\' \| \'right\'

onCapture: (landmarks: LandmarkPoint\[\], image: string) =\> void

onError: (error: string) =\> void

}

**3.4 Backend API --- FastAPI**

**Single endpoint to build:**

POST /predict

Request body:

{

demographics: {

age: int,

gender: str,

weight_kg: float,

height_cm: float,

race: str

},

landmarks: {

front: \[{ x: float, y: float, z: float }, \...\],

left: \[{ x: float, y: float, z: float }, \...\],

right: \[{ x: float, y: float, z: float }, \...\]

}

}

Response:

{

risk: \'green\' \| \'yellow\' \| \'red\',

confidence: float, // 0.0 to 1.0

message: str, // Human readable explanation

scan_id: str // UUID for this prediction

}

IMPORTANT: Until Dr. Iqmal delivers the .pkl model file, create a MOCK
predictor that returns random results for testing. Use a feature flag to
switch between mock and real model.

**3.5 Results Screen**

-   Display the risk level prominently (large coloured circle or card)

-   Green: \'#22C55E\' --- \'Your airway structure appears normal.\'

-   Yellow: \'#EAB308\' --- \'A potential concern has been detected.
    Please consult a doctor.\'

-   Red: \'#EF4444\' --- \'A significant concern was detected. Please
    seek medical advice promptly.\'

-   Show confidence percentage below the result

-   Show the message returned by the model

-   Include a mandatory disclaimer: \'This is a pre-screening tool only
    and does not constitute a medical diagnosis.\'

-   Offer: Save to history \| Export PDF report \| Book a consultation
    (placeholder link)

**3.6 Scan History**

-   List all past scans for the logged-in user from Firestore

-   Show: date, result colour, confidence score

-   Tap/click any scan to see its full result details

-   Allow deletion of individual scan records

**4. Data Storage --- Firestore Schema**

users/{uid}/scans/{scanId} {

scanId: string (UUID)

createdAt: Timestamp

demographics: { age, gender, weight_kg, height_cm, race }

landmarkCount: { front: number, left: number, right: number }

imageRefs: { front: string, left: string, right: string } // Firebase
Storage paths

result: {

risk: \'green\' \| \'yellow\' \| \'red\'

confidence: number

message: string

}

}

**5. Environment Variables**

Create .env.local with these variables (never commit this file):

\# Firebase

NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=

\# Backend

NEXT_PUBLIC_API_URL=http://localhost:8000 \# Change for production

\# Feature flags

NEXT_PUBLIC_USE_MOCK_MODEL=true \# Set to false when real model is ready

**6. Backend Setup --- Python FastAPI**

**requirements.txt**

fastapi==0.110.0

uvicorn==0.27.0

pydantic==2.6.0

scikit-learn==1.4.0

numpy==1.26.0

python-multipart==0.0.9

python-jose==3.3.0

httpx==0.26.0

**main.py structure:**

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from schemas.request import PredictRequest

from schemas.response import PredictResponse

from model.predictor import predict

app = FastAPI(title=\'AIRSCAN API\', version=\'1.0.0\')

app.add_middleware(CORSMiddleware,

allow_origins=\[\'http://localhost:3000\',
\'https://airscan.vercel.app\'\],

allow_methods=\[\'POST\'\], allow_headers=\[\'\*\'\])

\@app.post(\'/predict\', response_model=PredictResponse)

async def predict_endpoint(body: PredictRequest):

return predict(body)

**Dockerfile:**

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install \--no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD \[\"uvicorn\", \"main:app\", \"\--host\", \"0.0.0.0\", \"\--port\",
\"8000\"\]

**7. UI / UX Requirements**

-   Clean, medical-grade feel --- white backgrounds, muted blues and
    greens

-   Mobile-first responsive design --- must work on phone browser

-   Camera view should be full-width on mobile

-   Large, readable text --- minimum 16px body text

-   Loading states for every async operation

-   Error messages must be friendly --- no technical jargon shown to
    user

-   Progress indicator showing which scan step the user is on (1 of 3, 2
    of 3, etc.)

-   All health data screens must show the disclaimer at the bottom

**Colour Palette:**

  ------------------------------------------------------------------------
  **Token**       **Hex**       **Usage**
  --------------- ------------- ------------------------------------------
  Primary         #1B4F8C       Buttons, headings, key actions

  Secondary       #2D6A2D       Success states, Green result

  Warning         #EAB308       Yellow result, caution states

  Danger          #EF4444       Red result, errors

  Background      #F8FAFC       Page background

  Surface         #FFFFFF       Cards, modals

  Text Primary    #1A1A2E       Headings and important text

  Text Secondary  #64748B       Subtitles, captions, disclaimer text
  ------------------------------------------------------------------------

**8. Development Order --- Build in This Sequence**

Follow this order to avoid blockers:

  -----------------------------------------------------------------------------
  **Order**   **Task**                    **Why This Order**
  ----------- --------------------------- -------------------------------------
  1           Project scaffold: npx       Foundation everything else builds on
              create-next-app             
              airscan-frontend            

  2           Firebase setup: auth,       Auth needed before any protected
              Firestore, Storage config   pages

  3           Login page with Google auth Gate all other features behind login

  4           Demographic form component  Simple form --- good warm-up before
                                          camera work

  5           FastAPI backend scaffold +  Need API running before frontend can
              mock predictor              call it

  6           FaceScanner component with  Get camera + landmarks working first
              MediaPipe (no capture yet)  

  7           Add stability detection and Build on working landmark detection
              image capture to            
              FaceScanner                 

  8           3-angle scan flow (front,   Wire together the scan steps
              left, right) with progress  
              indicator                   

  9           Connect frontend scan to    Integration milestone
              FastAPI predict endpoint    

  10          Results screen with         The payoff screen
              Green/Yellow/Red display    

  11          Firestore save scan history Persistence layer

  12          Scan history page           Read from Firestore

  13          PDF report export           Nice-to-have, low risk

  14          Deployment: Vercel          Final step
              (frontend) + Cloud Run      
              (backend)                   
  -----------------------------------------------------------------------------

**9. Known Constraints & Decisions**

  -----------------------------------------------------------------------
  **Constraint**         **Decision**
  ---------------------- ------------------------------------------------
  ML model not yet       Build with mock predictor (random results). Use
  available              NEXT_PUBLIC_USE_MOCK_MODEL flag to switch.

  Exact landmark points  Use the 10 placeholder landmarks listed in
  TBC                    Section 3.3 until Dr. Iqmal confirms the final
                         list.

  No native mobile app   Web app only for prototype. Must be
  (yet)                  mobile-responsive but not a native app.

  Limited training data  Not Mirza\'s concern --- science team handles
                         this. App just calls the model.

  Budget available for   If any paid library is needed, flag it with cost
  libraries              and justification for grant allocation.

  PDPA compliance        Never log facial images to console. Encrypt
  required               before storage. Add consent checkbox before
                         scan.

  No diagnosis ---       Disclaimer must appear on results screen and in
  screening only         the app\'s terms of use.
  -----------------------------------------------------------------------

**10. Questions to Resolve Before or During Build**

Flag these to the team immediately if they block development:

-   What is the exact JSON input schema the Python model expects? (Ask
    Dr. Iqmal)

-   Which specific landmark point indices from MediaPipe\'s 468 points
    does the model use? (Ask Dr. Iqmal / Prof. Alfah)

-   Should images be sent to the backend for analysis, or just landmark
    coordinates? (Ask Dr. Iqmal)

-   What Firebase project should be used --- create a new one or use an
    existing one?

-   What is the production domain for CORS whitelist? (Ask team)

-   Should the app support Malay and English languages, or English only
    for prototype?

**Start with Step 1 in Section 8. Ask for clarification if any
specification is unclear before building.**

AIRSCAN Dev Spec v1.0 \| Mirza Azhan \| April 2026
