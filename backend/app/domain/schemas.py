from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    ok: bool = True
    service: str
    timestamp: datetime


class UserLocation(BaseModel):
    id: str
    uid: str
    name: str
    city: str
    country: str
    lat: float
    lng: float
    created_at: datetime


class UserLocationCreate(BaseModel):
    uid: str = Field(min_length=2)
    name: str = Field(default='User', min_length=1)
    city: str = Field(default='Unknown', min_length=1)
    country: str = Field(default='Unknown', min_length=1)
    lat: float
    lng: float


class LocationsOut(BaseModel):
    ok: bool = True
    locations: list[UserLocation]


class LocationCreateOut(BaseModel):
    ok: bool = True
    location: UserLocation


class CityRankingItem(BaseModel):
    city: str
    country: str
    count_items: int = Field(ge=0)
    updated_at: datetime


class CityRankingOut(BaseModel):
    ok: bool = True
    ranking: list[CityRankingItem]
    updated_at: datetime


class QrBindIn(BaseModel):
    uid: str = Field(min_length=2)
    qr_id: str = Field(min_length=4)
    item_name: str = Field(min_length=2)
    city: str = Field(min_length=2)


class QrBindOut(BaseModel):
    ok: bool
    message: str
    qr_id: str | None = None
    secure_hash: str | None = None


class FirebaseLoginIn(BaseModel):
    firebase_id_token: str = Field(min_length=20)


class DevLoginIn(BaseModel):
    uid: str = Field(min_length=2)
    email: str | None = None


class AuthTokenOut(BaseModel):
    ok: bool = True
    access_token: str
    token_type: str = 'bearer'
    expires_in: int
    uid: str
    email: str | None = None


class CurrentUserOut(BaseModel):
    ok: bool = True
    uid: str
    email: str | None = None
