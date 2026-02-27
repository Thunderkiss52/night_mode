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


class ClickerState(BaseModel):
    uid: str
    telegram_user_id: int | None = None
    username: str | None = None
    display_name: str = 'Player'
    points: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    multiplier: int = Field(default=1, ge=1)
    referrals: int = Field(default=0, ge=0)
    referred_by: int | None = None
    daily_bonus_available: bool = True
    daily_bonus_claimed_at: datetime | None = None
    next_daily_bonus_at: datetime | None = None
    lottery_joined: bool = False
    lottery_entered_at: datetime | None = None
    night_mode_unlocked: bool = False
    taps_in_current_second: int = Field(default=0, ge=0)
    level_start_points: int = Field(default=0, ge=0)
    next_level_points: int | None = None
    updated_at: datetime


class ClickerStateOut(BaseModel):
    ok: bool = True
    state: ClickerState


class ClickerAuthTelegramIn(BaseModel):
    init_data: str | None = Field(default=None, min_length=10)
    dev_telegram_user_id: int | None = Field(default=None, gt=0)
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class ClickerAuthOut(BaseModel):
    ok: bool = True
    access_token: str
    token_type: str = 'bearer'
    expires_in: int
    uid: str
    start_param: str | None = None
    state: ClickerState


class ClickerTapIn(BaseModel):
    taps: int = Field(default=1, ge=1, le=50)


class ClickerTapOut(BaseModel):
    ok: bool
    accepted_taps: int = Field(default=0, ge=0)
    rejected_taps: int = Field(default=0, ge=0)
    added_points: int = Field(default=0, ge=0)
    throttled: bool = False
    message: str
    state: ClickerState


class ClickerDailyBonusOut(BaseModel):
    ok: bool
    added_points: int = Field(default=0, ge=0)
    message: str
    state: ClickerState


class ClickerReferralApplyIn(BaseModel):
    referrer_telegram_id: int = Field(gt=0)


class ClickerReferralOut(BaseModel):
    ok: bool
    message: str
    state: ClickerState


class ClickerLotteryOut(BaseModel):
    ok: bool
    message: str
    entered_at: datetime | None = None
    state: ClickerState


class ClickerLeaderboardItem(BaseModel):
    rank: int = Field(ge=1)
    uid: str
    telegram_user_id: int | None = None
    display_name: str
    points: int = Field(ge=0)
    level: int = Field(ge=1)
    referrals: int = Field(ge=0)
    updated_at: datetime


class ClickerLeaderboardOut(BaseModel):
    ok: bool = True
    items: list[ClickerLeaderboardItem]
    updated_at: datetime


class ClickerLotteryEntry(BaseModel):
    uid: str
    telegram_user_id: int | None = None
    display_name: str
    points: int = Field(ge=0)
    level: int = Field(ge=1)
    entered_at: datetime


class ClickerLotteryAdminOut(BaseModel):
    ok: bool = True
    entries: list[ClickerLotteryEntry]
