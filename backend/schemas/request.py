from pydantic import BaseModel, Field
from typing import List


class LandmarkPoint(BaseModel):
    index: int
    x: float
    y: float
    z: float


class Demographics(BaseModel):
    age: int = Field(..., ge=18, le=100)
    gender: str
    weight: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    race: str


class LandmarkSet(BaseModel):
    front: List[LandmarkPoint]
    left: List[LandmarkPoint]
    right: List[LandmarkPoint]


class PredictRequest(BaseModel):
    demographics: Demographics
    landmarks: LandmarkSet
