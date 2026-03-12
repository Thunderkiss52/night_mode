from __future__ import annotations

from app.domain.schemas import UpdateProfileIn, UserProfileOut
from app.infrastructure.repositories.night_repository import NightRepository
from app.models.entities import User


class UserService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def get_profile(self, user: User) -> UserProfileOut:
        return UserProfileOut(user=self.repository.build_user_profile(user))

    def update_profile(self, user: User, payload: UpdateProfileIn) -> UserProfileOut:
        updated = self.repository.update_user_profile(user, payload)
        self.repository.commit()
        return UserProfileOut(user=self.repository.build_user_profile(updated))
