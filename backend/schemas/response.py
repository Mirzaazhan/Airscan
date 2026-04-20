from pydantic import BaseModel
from typing import Literal
import uuid


class PredictResponse(BaseModel):
    risk: Literal["green", "yellow", "red"]
    confidence: float
    message: str
    scan_id: str
