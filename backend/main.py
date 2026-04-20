from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.request import PredictRequest
from schemas.response import PredictResponse
from model.predictor import predict
import os

app = FastAPI(title="AIRSCAN API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model": "mock" if os.getenv("USE_MOCK_MODEL", "true") == "true" else "real"}


@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(body: PredictRequest):
    try:
        return predict(body)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model file not found. Set USE_MOCK_MODEL=true or provide airway_model.pkl.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
