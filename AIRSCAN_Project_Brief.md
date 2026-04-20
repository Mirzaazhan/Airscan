**AIRSCAN**

Radiation-Free Airway Pre-Screening App

Project Brief & Technical Specification \| April 2026

Prepared by: Mirza Azhan (Software Engineer)

In collaboration with: Dr. Iqmal (Statistician / ML Lead), Dr. Nazwa,
Prof. Firdaus

Funded by: UMDT Grant (up to RM50,000)

**1. Project Overview**

AIRSCAN is a radiation-free, web-based pre-screening application
designed to detect structural airway problems --- particularly
Obstructive Sleep Apnea (OSA) and related breathing difficulties ---
without the need for CT scans or clinical sleep studies. The app uses
facial scanning technology to capture 2D images from multiple angles,
reconstruct a 3D facial model, and feed facial landmark measurements
into a statistical machine learning model that predicts the underlying
skull structure and airway volume.

The output is a simple traffic-light result: Green (normal), Yellow
(potential concern), or Red (significant concern), prompting users to
seek professional consultation where needed.

**1.1 The Problem Being Solved**

-   Obstructive Sleep Apnea (OSA) affects millions yet up to 80% of
    cases remain undiagnosed

-   Current detection requires CT scans (radiation exposure) or
    overnight sleep clinic studies costing RM300--RM1,000

-   CT scans are especially problematic for children due to radiation
    risk

-   No accessible, radiation-free early detection tool currently exists
    for airway structural problems

-   AIRSCAN fills this gap with a RM30--RM100 mobile-accessible
    alternative

**1.2 How AIRSCAN Works**

The app collects demographic data (age, gender, weight, height, race)
and performs a guided multi-angle facial scan. From the 2D images, it
extracts facial landmark measurements --- cheekbones, nose bridge, jaw
structure --- which are fed into a pre-built statistical model. This
model, developed by the science team using data from the existing
CranioMax project, predicts the user\'s skull structure and airway
volume, and returns a risk classification.

**2. Team & Roles**

  -----------------------------------------------------------------------
  **Name**           **Role**         **Responsibility**
  ------------------ ---------------- -----------------------------------
  Mirza Azhan        Software         Frontend web app, facial scanning
                     Engineer         interface, API integration,
                                      deployment

  Dr. Iqmal          Statistician /   Statistical model training, Python
                     ML Lead          pickle model, input/output
                                      specification

  Dr. Nazwa          Science Advisor  Clinical validation, data
                                      labelling, research oversight

  Prof. Firdaus      Craniofacial     Domain expertise, syndromic patient
                     Surgeon          data, landmark point definitions

  Danish             CEO / Business   Business model, investor pitching,
                                      market validation
  -----------------------------------------------------------------------

**3. Scope of Work --- Mirza\'s Responsibilities**

Based on the project meeting, Mirza\'s role is focused exclusively on
the application layer. The science team handles all statistical
modelling and ML training.

**3.1 What Mirza Builds**

-   Web application frontend (React / Next.js) --- works on desktop and
    mobile browser

-   Demographic data collection form (age, gender, weight, height, race)

-   Multi-angle guided facial scanning interface (front, left, right
    profiles)

-   Facial landmark extraction from captured images

-   API call to the Python statistical model provided by Dr. Iqmal\'s
    team

-   Green / Yellow / Red result display screen

-   User authentication and data storage (Google login)

-   Basic report generation for users and clinicians

-   Deployment to Google Cloud / web hosting

**3.2 What the Science Team Provides**

-   Pre-trained Python statistical model (saved as a Pickle file)

-   Exact specification of facial landmark input points (from Prof.
    Alfah)

-   Expected input data format for the model

-   Expected output format (risk classification: green / yellow / red)

-   Labelled training dataset (normal vs. abnormal airway)

-   CranioMax existing model as a reference for skull prediction logic

**4. Prototype Specification (2-Month Target)**

**4.1 Target Population**

Initial prototype narrowed to children approximately 11 years of age.
Classification into normal and abnormal airway based on clinical data
provided by Prof. Firdaus. Data will be augmented/simulated where sample
size is insufficient.

**4.2 User Flow**

  ----------------------------------------------------------------------------
  **Step**   **Screen**       **Description**
  ---------- ---------------- ------------------------------------------------
  1          Landing / Login  User opens web app, logs in with Google account

  2          Demographic Form User enters age, gender, weight, height,
                              race/ethnicity

  3          Scan             Guided tutorial showing how to position face for
             Instructions     each angle

  4          Facial Scan ---  Camera captures front-facing image, extracts
             Front            landmarks

  5          Facial Scan ---  Camera captures left profile image
             Left             

  6          Facial Scan ---  Camera captures right profile image
             Right            

  7          Processing       Data sent to prediction model, loading state
             Screen           displayed

  8          Results Screen   Green / Yellow / Red result with brief
                              explanation

  9          Report / Export  Optional: PDF report generated for sharing with
                              doctor
  ----------------------------------------------------------------------------

**4.3 Output Signal Definition**

  ---------------------------------------------------------------------------
  **Signal**   **Meaning**                **Recommended Action**
  ------------ -------------------------- -----------------------------------
  Green        Airway structure appears   No immediate action needed. Re-scan
               normal                     annually.

  Yellow       Potential concern detected Consult a GP or ENT specialist for
                                          further assessment.

  Red          Significant concern        Seek medical consultation promptly.
               detected                   Do not delay.
  ---------------------------------------------------------------------------

**5. Technical Architecture**

**5.1 Tech Stack**

  -------------------------------------------------------------------------
  **Layer**        **Technology**        **Purpose**
  ---------------- --------------------- ----------------------------------
  Frontend         React / Next.js       Web app UI, camera access, form
                                         handling

  Facial Scanning  MediaPipe Face Mesh   Landmark extraction from 2D face
                   (JS)                  images

  3D               Three.js or similar   Convert 2D multi-angle images to
  Reconstruction                         3D model

  Backend API      Python FastAPI        Serve the pre-built statistical
                                         model

  ML Model         Python Pickle (.pkl)  Predict skull structure and airway
                                         volume

  Authentication   Google OAuth2 /       User login and session management
                   Firebase              

  Database         Firebase Firestore /  Store scan data and user history
                   PostgreSQL            

  File Storage     Google Cloud Storage  Store facial scan images encrypted

  Hosting          Google Cloud Run /    Deploy frontend and backend
                   Vercel                

  Privacy          TLS 1.3 + AES-256     Encrypt data in transit and at
                                         rest
  -------------------------------------------------------------------------

**5.2 Model Integration**

Dr. Iqmal\'s team will deliver a Python Pickle model file. Mirza\'s
responsibility is to:

-   Wrap the model in a FastAPI endpoint (POST /predict)

-   Accept facial landmark coordinates as JSON input

-   Return a JSON response with the risk classification

-   Display the result in the frontend UI

Example API contract (to be confirmed with Dr. Iqmal):

POST /predict \| Input: { age, gender, landmarks: \[\...\] } \| Output:
{ risk: \"green\" \| \"yellow\" \| \"red\", confidence: 0.87 }

**6. Business Model**

  ------------------------------------------------------------------------
  **Tier**         **Price**   **Features**
  ---------------- ----------- -------------------------------------------
  Free (Basic)     RM 0        Single scan, Green/Yellow/Red result only,
                               data contributed to research pool

  Standard Report  RM 30       Detailed report, trend history, shareable
                               PDF for doctor

  Deep Analysis    RM 100      Full morphometric analysis, clinical-grade
                               report, priority processing

  Clinic /         Custom      Bulk access, EMR integration, white-label
  Hospital         pricing     option
  ------------------------------------------------------------------------

Comparison: Sleep clinic studies currently cost RM300--RM1,000. AIRSCAN
positions itself as the affordable pre-screening step before clinical
referral.

**6.1 Data Strategy**

-   Basic tier is free to maximise data collection from the public

-   All user data (with consent) contributes to improving the model over
    time

-   Research dataset stays within the academic team under PDPA
    compliance

-   Long-term: license data insights (anonymised) to hospitals and
    research institutions

**7. Timeline --- 2 Month Prototype Plan**

  ---------------------------------------------------------------------------
  **Week**   **Milestone**                                 **Owner**
  ---------- --------------------------------------------- ------------------
  Week 1     Finalise feature list, landmark point         All team
             specification from Prof. Alfah, confirm model 
             input/output format with Dr. Iqmal            

  Week 2     Set up project repo, web app scaffold         Mirza
             (Next.js), Google auth, basic UI layout       

  Week 3     Integrate MediaPipe Face Mesh, implement      Mirza
             guided multi-angle scanning flow              

  Week 4     Implement demographic form, data validation,  Mirza
             image capture pipeline                        

  Week 5     Receive first version of Python model from    Mirza + Dr. Iqmal
             Dr. Iqmal, build FastAPI wrapper              

  Week 6     Connect frontend to model API, implement      Mirza
             Green/Yellow/Red result screen                

  Week 7     User authentication, data storage, basic      Mirza
             report generation                             

  Week 8     Testing, bug fixing, deployment to Google     Mirza
             Cloud, demo preparation                       
  ---------------------------------------------------------------------------

**8. Open Questions & Dependencies**

The following items need to be resolved before or during development:

  -------------------------------------------------------------------------
  **Item**         **Question**                   **Who to Ask**
  ---------------- ------------------------------ -------------------------
  Landmark Points  Which exact facial landmark    Prof. Alfah / Dr. Iqmal
                   points should the app capture? 

  Model Input      Exact JSON schema expected by  Dr. Iqmal
  Format           the Python model               

  Model Output     Does model return a class      Dr. Iqmal
  Format           label, probability score, or   
                   both?                          

  Sample Data      Can we get at least 5 sample   Dr. Nazwa / Prof. Firdaus
                   scans for testing the          
                   interface?                     

  3D Library Cost  Is any paid library needed for Mirza to investigate
                   3D reconstruction? Budget      
                   available.                     

  Data Retention   How long should scan images be All team + legal
                   stored? PDPA requires a        
                   defined period.                

  Authentication   Is the app open to public or   Danish / Dr. Iqmal
  Scope            invite-only for the prototype? 

  Server Location  Should hosting be in Malaysia  Dr. Iqmal / Danish
                   for PDPA compliance?           
  -------------------------------------------------------------------------

**9. Privacy & Compliance**

-   All health data encrypted in transit (TLS 1.3) and at rest (AES-256)

-   Malaysian PDPA 2010 compliance required --- explicit consent before
    data collection

-   Users must be informed what data is collected and how it is used

-   Users can request deletion of their data at any time

-   Facial scan images treated as sensitive personal data --- stored
    encrypted

-   Audit log of all data access maintained for regulatory purposes

-   No data shared with third parties without separate explicit consent

-   App to display clear disclaimer: pre-screening tool only, not a
    medical diagnosis

**10. Contact & Next Steps**

Immediate next steps agreed in the kickoff meeting:

-   Dr. Iqmal to share feature list and landmark specification document

-   Mirza to set up GitHub repository and initial project scaffold

-   Dr. Iqmal to send budget allocation details via email

-   Mirza to collect recommendation letter from office for Master\'s
    application

-   Next progress review meeting to be scheduled within 2 weeks

AIRSCAN \| Confidential \| April 2026
