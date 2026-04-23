from pydantic import BaseModel
from typing import Literal, List, Optional


class CraniofacialMeasurement(BaseModel):
    name: str
    valueMm: float
    refMm: float
    norm: str
    significance: str
    flag: Literal["normal", "elevated", "high"]


class PredictResponse(BaseModel):
    risk: Literal["green", "yellow", "red"]
    confidence: float
    message: str
    scan_id: str
    measurements: Optional[List[CraniofacialMeasurement]] = None
