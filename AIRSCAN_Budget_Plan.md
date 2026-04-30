# AIRSCAN — Realistic Budget Plan (MYR)

**Grant available:** RM 50,000 (UMDT)
**Exchange rate assumption:** USD 1 = MYR 4.50 (mid-2026 estimate)
**Malaysia SST 8% applies to all foreign digital services (Google, Vercel, etc.)**

---

## 1. Cloud Infrastructure — Monthly Recurring

### 1.1 Frontend — Vercel

| Phase | Months | Plan | Cost/mo (USD) | Cost/mo (MYR incl. 8% SST) |
|---|---|---|---|---|
| Prototype | 1–2 | Hobby (Free) | $0 | RM 0 |
| Early Launch | 3–6 | Pro | $20 | ~RM 97 |
| Production | 7–12 | Pro | $20 | ~RM 97 |

- Hobby free plan covers custom domain and 100 GB bandwidth — sufficient for prototype and demo.
- Pro needed once real patients use the app: team access, analytics, 1 TB bandwidth, SLA.
- Vercel's nearest edge PoP to Malaysia is Singapore — acceptable latency.

---

### 1.2 Backend — Google Cloud Run

| Phase | Months | Configuration | Cost/mo (USD) | Cost/mo (MYR incl. SST) |
|---|---|---|---|---|
| Prototype | 1–2 | Scale-to-zero, <1K requests | $0 | RM 0 |
| Early Launch | 3–6 | 1 minimum instance (512 MB) | $10–18 | RM 49–87 |
| Production | 7–12 | 1 min instance (1 GB) + autoscale | $25–55 | RM 122–267 |

- Scale-to-zero causes cold starts of 2–4 seconds — fine for prototype demos, not acceptable for clinic use. Minimum 1 instance eliminates cold starts.
- The ML `.pkl` model (scikit-learn) is loaded into memory at startup. Budget 512 MB RAM minimum, 1 GB recommended.
- Google Cloud Run free tier: 2 million requests/month, 180K vCPU-seconds — prototype is comfortably free.

---

### 1.3 Firebase (Firestore + Storage + Auth)

Firebase uses the pay-as-you-go **Blaze plan** (required for Cloud Run integration and Storage uploads). Free quotas are generous.

**Free tier limits per month:**
- Firestore: 50K reads/day, 20K writes/day, 1 GB storage
- Storage: 5 GB stored, 1 GB/day downloaded
- Auth: Unlimited — no cost for Google OAuth

| Phase | Months | Expected Usage | Estimated Cost (USD) | Cost (MYR incl. SST) |
|---|---|---|---|---|
| Prototype | 1–2 | ~50 scans, 10 test users | $0 | RM 0 |
| Early Launch | 3–6 | ~500 scans/month | $3–10 | RM 15–49 |
| Production | 7–12 | ~3,000–5,000 scans/month | $15–40 | RM 73–194 |

**Storage calculation at 5,000 scans/month:**
- Each scan: 3 angles × ~1.5 MB PNG = ~4.5 MB per scan
- 5,000 scans = ~22 GB → beyond free 5 GB → ~17 GB × $0.026 = ~$0.44/month (~RM 2)
- Download cost (history page): ~$0.12/GB × 5 GB/month = ~$0.60/month (~RM 3)
- Firestore reads/writes at this scale stay within the free tier

---

### 1.4 Infrastructure Monthly Summary

| Phase | Months | Monthly Cost (MYR) |
|---|---|---|
| Prototype | 1–2 | RM 0–5 |
| Early Launch | 3–6 | RM 165–235 |
| Production | 7–12 | RM 295–560 |

---

## 2. Domain & DNS — One-Time / Annual

| Item | Provider | Cost |
|---|---|---|
| `airscan.com.my` domain (1 year) | Exabytes or MyNIC accredited registrar | RM 70–100/year |
| OR `airscan.app` / `airscan.io` (1 year) | Namecheap / Cloudflare Registrar | RM 55–90/year |
| DNS management | Cloudflare | RM 0 (free) |
| SSL/TLS certificate | Vercel (automatic Let's Encrypt) | RM 0 (free) |

**Recommendation:** Register `airscan.com.my` — a local domain builds trust with Malaysian clinics and strengthens PDPA credibility. One-time cost: ~RM 70–100.

---

## 3. Development Tools & Licenses

| Tool | Purpose | Cost |
|---|---|---|
| VS Code | IDE | RM 0 |
| GitHub Free (private repos) | Source control, 2,000 Actions CI minutes/month | RM 0 |
| Docker Desktop (personal use) | Container builds | RM 0 |
| Figma Free | UI mockups (3 projects) | RM 0 |
| Postman Free | API testing | RM 0 |
| MediaPipe `@mediapipe/face_mesh` | Facial landmark library (open source, CDN) | RM 0 |
| shadcn/ui, Tailwind CSS | UI framework | RM 0 |
| jsPDF or `@react-pdf/renderer` | PDF report generation | RM 0 |
| scikit-learn, FastAPI, Uvicorn | Backend stack | RM 0 |
| Firebase SDK | Auth, Firestore, Storage | RM 0 |

**Total development tools: RM 0.** The entire tech stack is open source or has a free tier sufficient for this project.

---

## 4. Compliance & Legal — One-Time (Critical for Medical App)

AIRSCAN collects **biometric + health data** — the highest sensitivity category under Malaysian law. This is the most under-estimated cost in medical tech projects.

| Item | Details | Estimated Cost |
|---|---|---|
| Privacy Policy drafting (lawyer) | Must comply with PDPA 2010, specifically Part IV sensitive personal data provisions | RM 800–2,000 |
| Terms of Use drafting | Liability limits, disclaimer, no-diagnosis clause | RM 500–1,000 |
| PDPA compliance consultation | Personal Data Protection Commissioner compliance audit, consent mechanism review | RM 500–1,500 |
| Medical Device Authority (MDA) advice | Under Medical Device Act 2012, screening software may require MDA registration — get legal clarity before public launch | RM 1,000–3,500 |
| Consent form for clinical validation participants | Reviewed by hospital ethics committee | RM 0 (academic, team handles) |
| Data retention policy documentation | How long scan images are kept, PDPA Schedule requirement | Included above |

**Total compliance & legal: RM 2,800–8,000**

> **Why this matters:** If AIRSCAN launches publicly without PDPA-compliant consent flows and a proper privacy policy, the team is personally liable under Section 4 PDPA 2010. The MDA question is especially important — if regulators classify this as medical device software, you will need Class B or C registration before commercialisation.

---

## 5. Testing & QA

| Item | Cost |
|---|---|
| Physical test devices (Android, iOS) | RM 0 — use team's existing phones |
| BrowserStack (cross-device testing) | RM 0 — free 30-day trial, then ~RM 180/month if continued |
| User testing participants (10–15 volunteers, small token gift) | RM 300–750 |
| Printed instruction materials for clinic/user testing sessions | RM 80–150 |
| **Total** | **RM 380–900** |

---

## 6. Professional Services (Optional but Recommended)

| Service | Purpose | Estimated Cost |
|---|---|---|
| UX/UI review by medical UX consultant (1–2 sessions) | Validate that the scanning flow is usable by non-technical users, especially parents of children | RM 500–1,500 |
| Basic OWASP security audit (pre-launch) | Review Firebase rules, API authentication, input validation before clinic deployment | RM 2,000–5,000 |
| Hospital IT integration consultation | If EMR integration or white-label for clinics is planned post-prototype | RM 2,000–6,000 |
| **Total** | **RM 2,500–12,500** |

---

## 7. Business Operations

| Item | Cost |
|---|---|
| Google Workspace (team email e.g. mirza@airscan.com.my) | RM 65/user/month → RM 780/year per user |
| Pitch deck design (Canva Pro or freelance designer) | RM 0 (Canva free) to RM 800 |
| Demo environment hosting (separate Vercel project) | RM 0 (Hobby plan) |
| **Total** | **RM 780–1,580/year** |

---

## 8. PDPA-Specific: Data Residency

PDPA 2010 restricts transfer of personal data outside Malaysia unless adequate protection exists. Firebase/GCP has no Malaysian region. Options:

| Option | Region | Notes | Additional Cost |
|---|---|---|---|
| Firebase `asia-southeast1` | Singapore | Standard practice for Malaysian startups, generally accepted under PDPA | RM 0 |
| Firebase `asia-southeast2` | Jakarta | No advantage — further away, no PDPA benefit | RM 0 |
| Legal whitelist via PDPA Section 129 | Singapore has adequate data protection laws | RM 0 if legal advice confirms | Included in legal fees above |

**Recommendation:** Use `asia-southeast1` (Singapore) and document this in your privacy policy with legal sign-off. This is the standard Malaysian startup approach and is defensible under PDPA.

---

## 9. Contingency — 15%

Medical apps carry unexpected costs: compute spikes during demos, security patches, urgent legal changes, model performance issues requiring larger instances. A 15% buffer is standard.

---

## Full 12-Month Budget Summary

| Category | Min (RM) | Max (RM) | Notes |
|---|---|---|---|
| Cloud Infrastructure (12 months) | 1,900 | 7,500 | Vercel + Cloud Run + Firebase |
| Domain & DNS | 70 | 100 | One-time |
| Development Tools & Licenses | 0 | 0 | Entirely free / open source |
| Compliance & Legal | 2,800 | 8,000 | PDPA + MDA advice |
| Testing & QA | 380 | 900 | Participants + materials |
| Professional Services | 2,500 | 12,500 | Security audit + UX review |
| Business Operations | 780 | 1,580 | Email + pitch materials |
| **Subtotal** | **8,430** | **30,580** | |
| **15% Contingency** | **1,265** | **4,587** | |
| **TOTAL** | **~RM 9,700** | **~RM 35,200** | |

---

## Grant Allocation Recommendation (RM 50,000)

| Allocation | Budget |
|---|---|
| Technical & Operational (above) | RM 10,000–35,000 |
| Mirza's development stipend (2 months) | RM 8,000–12,000 (RM 4K–6K/month, Malaysia market rate) |
| Dr. Iqmal's ML work / research expenses | RM 5,000–10,000 |
| Clinical validation & data collection | RM 2,000–5,000 |
| **Total** | **RM 25,000–62,000** |

The upper end exceeds the RM 50K grant. **Realistic target:** keep professional services lean (use academic networks for UX testing, defer the security audit to post-grant funding), and the project comfortably fits within RM 40,000–45,000, leaving RM 5,000–10,000 in reserve.

---

## Monthly Burn Rate at a Glance

| Stage | Monthly Cloud Cost | Key Milestone |
|---|---|---|
| Month 1–2 (Prototype) | RM 0–5 | Internal demo to Dr. Iqmal's team |
| Month 3–4 (Soft launch) | RM 165–235 | 50–200 test users |
| Month 5–6 (Early access) | RM 235–350 | Clinic pilot, real patient scans |
| Month 7–12 (Production) | RM 295–560 | Public screening, revenue begins |

At the RM 30/scan Standard Report tier, **just 10–20 paying scans per month** covers the entire cloud bill.

---

## Key Budget Risks

1. **MDA registration** — If KKM classifies AIRSCAN as a Class B medical device, formal registration costs RM 3,000–15,000 and takes 3–6 months. Get legal clarity early before any public launch.

2. **Compute spike during demos** — A conference or media demo with 50+ simultaneous users can spike Cloud Run costs. Set a **budget alert at RM 200** in Google Cloud Console from day one.

3. **Firebase Storage growth** — If full 468-landmark arrays are stored instead of only the 12 key landmarks, storage costs multiply ~40x. The spec correctly limits the payload to `KEY_LANDMARK_INDICES` — do not change this.

4. **Exchange rate exposure** — All cloud services are billed in USD. USD/MYR moved from 4.20 to 4.80 across 2025. Budget a 10–15% buffer on all USD-denominated line items.

---

*AIRSCAN Budget Plan v1.0 | Mirza Azhan | April 2026*
