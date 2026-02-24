from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
from typing import TypedDict

from app.domain.schemas import CityRankingItem, UserLocation


class BoundQr(TypedDict):
    owner_uid: str
    item_name: str
    city: str
    secure_hash: str


@dataclass
class InMemoryStore:
    locations: list[UserLocation]
    city_ranking: list[CityRankingItem]
    bound_qr: dict[str, BoundQr]


now = datetime.now(timezone.utc)
store = InMemoryStore(
    locations=[
        UserLocation(
            id='loc-1',
            uid='demo-user-1',
            name='Night Rider',
            city='Yerevan',
            country='Armenia',
            lat=40.1772,
            lng=44.5035,
            created_at=now,
        ),
        UserLocation(
            id='loc-2',
            uid='demo-user-2',
            name='Moscow Clubber',
            city='Moscow',
            country='Russia',
            lat=55.7558,
            lng=37.6173,
            created_at=now,
        ),
        UserLocation(
            id='loc-3',
            uid='demo-user-3',
            name='Almaty Neon',
            city='Almaty',
            country='Kazakhstan',
            lat=43.222,
            lng=76.8512,
            created_at=now,
        ),
    ],
    city_ranking=[
        CityRankingItem(city='Yerevan', country='Armenia', count_items=132, updated_at=now),
        CityRankingItem(city='Moscow', country='Russia', count_items=117, updated_at=now),
        CityRankingItem(city='Almaty', country='Kazakhstan', count_items=94, updated_at=now),
        CityRankingItem(city='Tbilisi', country='Georgia', count_items=62, updated_at=now),
        CityRankingItem(city='Dubai', country='UAE', count_items=41, updated_at=now),
    ],
    bound_qr={},
)


def make_qr_hash(qr_id: str) -> str:
    return sha256(f'night_mode:{qr_id}'.encode('utf-8')).hexdigest()
