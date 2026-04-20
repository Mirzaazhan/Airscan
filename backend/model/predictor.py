import os
import uuid
from schemas.request import PredictRequest
from schemas.response import PredictResponse

USE_MOCK = os.getenv("USE_MOCK_MODEL", "true").lower() == "true"

MESSAGES = {
    "green": "Facial geometry analysis indicates low OSA risk markers. Recommend standard dental check-up.",
    "yellow": "Moderate risk indicators detected. Clinical evaluation by an ENT specialist is advised.",
    "red": "High-risk airway markers present. Urgent referral for polysomnography strongly recommended.",
}


def _mock_predict(req: PredictRequest) -> PredictResponse:
    d = req.demographics
    bmi = d.weight / ((d.height / 100) ** 2)

    if bmi < 25:
        risk, conf = "green", round(0.82 + (25 - bmi) * 0.004, 3)
    elif bmi < 30:
        risk, conf = "yellow", round(0.65 + (bmi - 25) * 0.01, 3)
    else:
        risk, conf = "red", round(0.78 + min((bmi - 30) * 0.008, 0.15), 3)

    conf = min(conf, 0.97)
    return PredictResponse(risk=risk, confidence=conf, message=MESSAGES[risk], scan_id=str(uuid.uuid4()))


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
    return PredictResponse(risk=risk, confidence=round(float(probs[idx]), 3), message=MESSAGES[risk], scan_id=str(uuid.uuid4()))


def predict(req: PredictRequest) -> PredictResponse:
    if USE_MOCK:
        return _mock_predict(req)
    return _real_predict(req)
