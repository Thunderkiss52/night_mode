from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    ok: bool = True
    service: str
    timestamp: datetime


class UserProfile(BaseModel):
    id: str
    telegram_id: int | None = None
    email: str | None = None
    referral_code: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    language_code: str | None = None
    role: str
    is_active: bool
    is_admin: bool
    balance: int = 0
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AuthTelegramIn(BaseModel):
    init_data: str | None = Field(default=None, min_length=10)
    referral_code: str | None = Field(default=None, min_length=4, max_length=32)
    dev_telegram_user_id: int | None = Field(default=None, gt=0)
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    language_code: str | None = None


class AuthRefreshIn(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=20)


class AuthLogoutIn(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=20)
    session_id: str | None = None


class AuthTokenOut(BaseModel):
    ok: bool = True
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int
    refresh_expires_in: int
    user: UserProfile


class AccessTokenOut(BaseModel):
    ok: bool = True
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int
    refresh_expires_in: int


class CurrentUserOut(BaseModel):
    ok: bool = True
    user: UserProfile


class UpdateProfileIn(BaseModel):
    username: str | None = Field(default=None, max_length=255)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    photo_url: str | None = Field(default=None, max_length=2048)
    language_code: str | None = Field(default=None, max_length=32)


class UserProfileOut(BaseModel):
    ok: bool = True
    user: UserProfile


class BalanceOut(BaseModel):
    ok: bool = True
    balance: int
    updated_at: datetime


class BalanceTransactionItem(BaseModel):
    id: str
    type: str
    direction: str
    amount: int
    source: str
    meta: dict[str, Any] | None = None
    created_at: datetime


class WalletTransactionsOut(BaseModel):
    ok: bool = True
    items: list[BalanceTransactionItem]


class DailyBonusOut(BaseModel):
    ok: bool
    added_amount: int = 0
    balance: int
    reward_date: date | None = None
    message: str


class ReferralApplyIn(BaseModel):
    referral_code: str | None = Field(default=None, min_length=4, max_length=32)
    referrer_telegram_id: int | None = Field(default=None, gt=0)


class ReferralItem(BaseModel):
    user_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    created_at: datetime


class ReferralsOut(BaseModel):
    ok: bool = True
    my_referral_code: str
    referred_by_user_id: str | None = None
    referrals_count: int
    items: list[ReferralItem]


class ReferralApplyOut(BaseModel):
    ok: bool
    message: str
    balance: int


class CompetitionItem(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CompetitionsOut(BaseModel):
    ok: bool = True
    items: list[CompetitionItem]


class CompetitionOut(BaseModel):
    ok: bool = True
    item: CompetitionItem


class CompetitionLeaderboardItem(BaseModel):
    rank: int
    user_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    score: int
    updated_at: datetime


class CompetitionLeaderboardOut(BaseModel):
    ok: bool = True
    items: list[CompetitionLeaderboardItem]


class AdminUserItem(BaseModel):
    id: str
    telegram_id: int | None = None
    email: str | None = None
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: str
    is_active: bool
    is_admin: bool
    balance: int
    created_at: datetime
    updated_at: datetime


class AdminUsersOut(BaseModel):
    ok: bool = True
    items: list[AdminUserItem]


class AdminUserOut(BaseModel):
    ok: bool = True
    item: AdminUserItem


class AdminAdjustBalanceIn(BaseModel):
    amount: int = Field(ne=0)
    reason: str = Field(min_length=3, max_length=500)


class AdminAdjustBalanceOut(BaseModel):
    ok: bool = True
    balance: int
    transaction_id: str


class AdminAuditLogItem(BaseModel):
    id: str
    admin_user_id: str | None = None
    target_user_id: str | None = None
    action: str
    old_data: dict[str, Any] | None = None
    new_data: dict[str, Any] | None = None
    created_at: datetime


class AdminAuditLogsOut(BaseModel):
    ok: bool = True
    items: list[AdminAuditLogItem]


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
