import os
import uuid
import math
import random
from typing import List, Dict, Optional
from schemas.request import PredictRequest, LandmarkPoint
from schemas.response import PredictResponse, CraniofacialMeasurement

USE_MOCK = os.getenv("USE_MOCK_MODEL", "true").lower() == "true"

MESSAGES = {
    "green": "Facial geometry analysis indicates low OSA risk markers. Recommend standard dental check-up.",
    "yellow": "Moderate risk indicators detected. Clinical evaluation by an ENT specialist is advised.",
    "red": "High-risk airway markers present. Urgent referral for polysomnography strongly recommended.",
}

# Measurement definitions matching the frontend (refMm, norm, significance)
MEASURE_DEFS = [
    {"name": "Total Facial Height", "from": "Tr",   "to": "Me",   "refMm": 120, "norm": "115–130", "significance": "Shorter height combined with retrognathia increases OSA severity"},
    {"name": "Lower Face Height",   "from": "Sn",   "to": "Me",   "refMm": 68,  "norm": "60–75",   "significance": "Elongated lower face (vertical pattern) is a high OSA risk marker"},
    {"name": "Bizygomatic Width",   "from": "Zy-L", "to": "Zy-R", "refMm": 140, "norm": "130–150", "significance": "Reference baseline for all craniofacial proportions"},
    {"name": "Bigonial Width",      "from": "Go-L", "to": "Go-R", "refMm": 102, "norm": "95–115",  "significance": "Narrow jaw causes tongue crowding and airway collapse during sleep"},
    {"name": "Mandibular Length",   "from": "Go-L", "to": "Me",   "refMm": 84,  "norm": "78–95",   "significance": "Short mandible is the #1 anatomical OSA structural predictor"},
    {"name": "Midface Height",      "from": "N",    "to": "Sn",   "refMm": 52,  "norm": "48–60",   "significance": "Midface deficiency is linked to nasal obstruction and OSA"},
]

# MediaPipe indices for the 16 anthropometric landmarks
LANDMARK_INDICES: Dict[str, int] = {
    "Tr": 10, "G": 9, "N": 168, "Rh": 6, "Sn": 4,
    "Ls": 13, "Li": 14, "B": 17, "Pog": 199, "Me": 152,
    "Go-L": 172, "Go-R": 397, "Zy-L": 234, "Zy-R": 454,
    "Or-L": 253, "Or-R": 23,
}


def _flag(value: float, ref: float) -> str:
    diff = abs(value - ref) / ref
    if diff > 0.14:
        return "high"
    elif diff > 0.07:
        return "elevated"
    return "normal"


def _compute_measurements_from_landmarks(
    landmarks: List[LandmarkPoint],
) -> List[CraniofacialMeasurement]:
    """Compute real measurements from MediaPipe landmark coordinates."""
    pts: Dict[str, LandmarkPoint] = {str(lm.index): lm for lm in landmarks}

    def get(name: str) -> Optional[LandmarkPoint]:
        idx = LANDMARK_INDICES.get(name)
        return pts.get(str(idx)) if idx is not None else None

    zy_l, zy_r = get("Zy-L"), get("Zy-R")
    if not zy_l or not zy_r:
        return []

    # Pixel-space bizygomatic distance → scale to mm (140mm reference)
    biz_dist = math.hypot(zy_r.x - zy_l.x, zy_r.y - zy_l.y)
    if biz_dist < 1e-6:
        return []
    scale = 140.0 / biz_dist

    results = []
    for m in MEASURE_DEFS:
        a, b = get(m["from"]), get(m["to"])
        val_mm = round(math.hypot(b.x - a.x, b.y - a.y) * scale) if a and b else m["refMm"]
        results.append(CraniofacialMeasurement(
            name=m["name"], valueMm=val_mm, refMm=m["refMm"],
            norm=m["norm"], significance=m["significance"],
            flag=_flag(val_mm, m["refMm"]),
        ))
    return results


def _mock_measurements(risk: str) -> List[CraniofacialMeasurement]:
    """Generate plausible mock measurements biased by risk level."""
    bias = {"green": 0.0, "yellow": 0.10, "red": 0.18}[risk]
    results = []
    for m in MEASURE_DEFS:
        ref = m["refMm"]
        deviation = random.uniform(-bias, bias) * ref
        val_mm = round(ref + deviation + random.uniform(-3, 3))
        results.append(CraniofacialMeasurement(
            name=m["name"], valueMm=val_mm, refMm=ref,
            norm=m["norm"], significance=m["significance"],
            flag=_flag(val_mm, ref),
        ))
    return results


def _score_risk(req: PredictRequest) -> float:
    """Returns normalised risk score 0–1."""
    d = req.demographics
    bmi = d.weight / ((d.height / 100) ** 2)

    score, max_score = 0, 8

    # BMI
    if bmi >= 30:
        score += 3
    elif bmi >= 25:
        score += 1

    # Snoring frequency (primary predictor)
    snoring = (d.snoring or "").lower()
    if "every" in snoring or "night" in snoring:
        score += 4
    elif "sometimes" in snoring:
        score += 2
    elif "rarely" in snoring:
        score += 1

    # Biological sex
    if d.gender.lower() in ("male", "m"):
        score += 1

    # Medical history modifiers
    hist = (d.medicalHistory or "").lower()
    if any(c in hist for c in ("hypertension", "heart", "obesity")):
        score += 1
        max_score += 1

    return score / max_score


def _mock_predict(req: PredictRequest) -> PredictResponse:
    pct = _score_risk(req)
    if pct >= 0.50:
        risk, conf = "red", round(0.78 + min(pct * 0.18, 0.15), 3)
    elif pct >= 0.22:
        risk, conf = "yellow", round(0.65 + pct * 0.20, 3)
    else:
        d = req.demographics
        bmi = d.weight / ((d.height / 100) ** 2)
        risk, conf = "green", round(0.82 + max(0, (25 - bmi) * 0.004), 3)

    conf = min(conf, 0.97)
    return PredictResponse(
        risk=risk, confidence=conf,
        message=MESSAGES[risk], scan_id=str(uuid.uuid4()),
        measurements=_mock_measurements(risk),
    )


def _real_predict(req: PredictRequest) -> PredictResponse:
    import pickle
    import numpy as np

    model_path = os.path.join(os.path.dirname(__file__), "airway_model.pkl")
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    d = req.demographics
    bmi = d.weight / ((d.height / 100) ** 2)

    def _flat(pts):
        return [v for p in pts for v in (p.x, p.y, p.z)]

    features = np.array([
        d.age, bmi,
        1 if d.gender.lower() in ("male", "m") else 0,
        *_flat(req.landmarks.front),
        *_flat(req.landmarks.left),
        *_flat(req.landmarks.right),
    ]).reshape(1, -1)

    probs = model.predict_proba(features)[0]
    class_map = {0: "green", 1: "yellow", 2: "red"}
    idx = int(probs.argmax())
    risk = class_map[idx]

    all_lms = req.landmarks.front + req.landmarks.left + req.landmarks.right
    measurements = _compute_measurements_from_landmarks(all_lms)

    return PredictResponse(
        risk=risk, confidence=round(float(probs[idx]), 3),
        message=MESSAGES[risk], scan_id=str(uuid.uuid4()),
        measurements=measurements,
    )


def predict(req: PredictRequest) -> PredictResponse:
    if USE_MOCK:
        return _mock_predict(req)
    return _real_predict(req)
