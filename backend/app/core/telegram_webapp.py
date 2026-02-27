from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl


class TelegramInitDataError(ValueError):
    pass


@dataclass(frozen=True)
class TelegramInitDataUser:
    telegram_user_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    start_param: str | None


def verify_telegram_init_data(
    init_data: str,
    bot_token: str,
    max_age_seconds: int = 86400,
) -> TelegramInitDataUser:
    if not init_data.strip():
        raise TelegramInitDataError('initData is empty')
    if not bot_token.strip():
        raise TelegramInitDataError('TELEGRAM_BOT_TOKEN is not configured')

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    provided_hash = parsed.pop('hash', '')
    if not provided_hash:
        raise TelegramInitDataError('initData hash is missing')

    data_check_string = '\n'.join(f'{key}={parsed[key]}' for key in sorted(parsed))
    secret_key = hmac.new(b'WebAppData', bot_token.encode('utf-8'), hashlib.sha256).digest()
    expected_hash = hmac.new(
        secret_key,
        data_check_string.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, provided_hash):
        raise TelegramInitDataError('initData signature is invalid')

    auth_date_raw = parsed.get('auth_date', '0')
    try:
        auth_date = int(auth_date_raw)
    except ValueError as exc:
        raise TelegramInitDataError('initData auth_date is invalid') from exc

    if auth_date <= 0:
        raise TelegramInitDataError('initData auth_date is missing')

    now = int(time.time())
    if max_age_seconds > 0 and now - auth_date > max_age_seconds:
        raise TelegramInitDataError('initData is expired')

    raw_user = parsed.get('user')
    if not raw_user:
        raise TelegramInitDataError('initData user payload is missing')

    try:
        user_payload = json.loads(raw_user)
    except json.JSONDecodeError as exc:
        raise TelegramInitDataError('initData user payload is invalid') from exc

    raw_telegram_id = user_payload.get('id')
    if not isinstance(raw_telegram_id, int):
        raise TelegramInitDataError('Telegram user id is missing')

    username = user_payload.get('username')
    if username is not None and not isinstance(username, str):
        username = None

    first_name = user_payload.get('first_name')
    if first_name is not None and not isinstance(first_name, str):
        first_name = None

    last_name = user_payload.get('last_name')
    if last_name is not None and not isinstance(last_name, str):
        last_name = None

    start_param = parsed.get('start_param')
    if start_param is not None and not start_param.strip():
        start_param = None

    return TelegramInitDataUser(
        telegram_user_id=raw_telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        start_param=start_param,
    )

