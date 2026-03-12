from __future__ import annotations

from fastapi import HTTPException

from app.db import SessionLocal
from app.infrastructure.repositories.night_repository import NightRepository


class TelegramUserStore:
    def _repository(self) -> tuple:
        db = SessionLocal()
        return db, NightRepository(db=db)

    def upsert_user(
        self,
        user_id: int,
        username: str | None,
        first_name: str | None,
        last_name: str | None,
    ) -> None:
        db, repository = self._repository()
        try:
            repository.upsert_telegram_user(
                telegram_user_id=user_id,
                username=username,
                first_name=first_name,
                last_name=last_name,
            )
            repository.commit()
        finally:
            db.close()

    def apply_referral(self, user_id: int, referrer_id: int) -> bool:
        if user_id == referrer_id:
            return False

        db, repository = self._repository()
        try:
            user, _ = repository.upsert_telegram_user(telegram_user_id=user_id)
            repository.upsert_telegram_user(telegram_user_id=referrer_id)
            result = repository.apply_referral(
                user_id=user.id,
                referrer_telegram_id=referrer_id,
                source='telegram_bot',
            )
            repository.commit()
            return result.ok
        except HTTPException:
            repository.rollback()
            return False
        finally:
            db.close()

    def get_referral_count(self, user_id: int) -> int:
        db, repository = self._repository()
        try:
            user = repository.get_user_by_telegram_id(user_id)
            if user is None:
                return 0
            stats = repository.get_referral_stats(user.id)
            return stats.referrals_count
        finally:
            db.close()
