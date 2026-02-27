from __future__ import annotations

import asyncio
import logging
from typing import Final
from urllib.parse import urlencode

from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command, CommandStart
from aiogram.filters.command import CommandObject
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from app.bot.user_store import TelegramUserStore
from app.core.config import settings

logger = logging.getLogger(__name__)
router = Router()
store = TelegramUserStore()
WELCOME_TEXT: Final[str] = (
    'NM Clicker bot is ready.\n'
    'Use the button below to open the Mini App and start tapping.'
)


def _parse_referrer(payload: str | None) -> int | None:
    if not payload:
        return None

    normalized = payload.strip()
    if not normalized.startswith('ref_'):
        return None

    candidate = normalized[4:]
    if not candidate.isdigit():
        return None

    return int(candidate)


def _build_invite_link(user_id: int) -> str | None:
    username = settings.telegram_bot_username.strip().lstrip('@')
    if not username:
        return None
    return f'https://t.me/{username}?start=ref_{user_id}'


def _build_share_link(user_id: int) -> str:
    invite_link = _build_invite_link(user_id)
    params = {'text': 'Join NM Clicker in Telegram Mini App.'}
    if invite_link:
        params['url'] = invite_link
    else:
        params['text'] = f'Join NM Clicker. Use /start ref_{user_id} in this bot.'

    query = urlencode(params)
    return f'https://t.me/share/url?{query}'


def _build_webapp_url(user_id: int, start_param: str | None = None) -> str:
    base_url = settings.telegram_webapp_url.strip()
    if not base_url:
        return ''
    join_char = '&' if '?' in base_url else '?'
    url = f'{base_url}{join_char}tg_id={user_id}'
    if start_param:
        url = f'{url}&start_param={start_param}'
    return url


def _build_keyboard(user_id: int, start_param: str | None = None) -> InlineKeyboardMarkup:
    buttons: list[list[InlineKeyboardButton]] = []
    webapp_url = _build_webapp_url(user_id, start_param=start_param)
    if webapp_url:
        buttons.append(
            [
                InlineKeyboardButton(
                    text='Open NM Clicker',
                    web_app=WebAppInfo(url=webapp_url),
                )
            ]
        )
    buttons.append([InlineKeyboardButton(text='Invite friend', url=_build_share_link(user_id))])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


@router.message(CommandStart())
async def start_handler(message: Message, command: CommandObject) -> None:
    if message.from_user is None:
        return

    user = message.from_user
    store.upsert_user(
        user_id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
    )

    start_payload = command.args.strip() if command and command.args else None
    referrer_id = _parse_referrer(start_payload)
    referral_applied = False
    if referrer_id is not None:
        referral_applied = store.apply_referral(user_id=user.id, referrer_id=referrer_id)

    lines = [WELCOME_TEXT]
    if referral_applied:
        lines.append('Referral accepted.')
    elif referrer_id is not None:
        lines.append('Referral already used or invalid.')

    if not settings.telegram_webapp_url.strip():
        lines.append('Set TELEGRAM_WEBAPP_URL to enable direct Mini App open button.')

    await message.answer(
        '\n'.join(lines),
        reply_markup=_build_keyboard(user.id, start_param=start_payload),
    )


@router.message(Command('ref'))
async def ref_handler(message: Message) -> None:
    if message.from_user is None:
        return

    user_id = message.from_user.id
    invite_link = _build_invite_link(user_id)
    referrals = store.get_referral_count(user_id)
    link_line = invite_link or f'/start ref_{user_id}'
    await message.answer(
        f'Your referral link:\n{link_line}\n\nReferrals: {referrals}',
        reply_markup=_build_keyboard(user_id),
    )


@router.message(Command('help'))
async def help_handler(message: Message) -> None:
    await message.answer(
        '/start - open Mini App\n'
        '/ref - get your referral link\n'
        '/help - commands list'
    )


async def on_startup(bot: Bot) -> None:
    webapp_url = settings.telegram_webapp_url.strip()
    if not webapp_url:
        logger.warning('TELEGRAM_WEBAPP_URL is empty, chat menu button was not configured')
        return

    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text=settings.telegram_webapp_title.strip() or 'NM Clicker',
                web_app=WebAppInfo(url=webapp_url),
            )
        )
    except Exception:
        logger.exception('Failed to configure Telegram menu button')


async def run() -> None:
    token = settings.telegram_bot_token.strip()
    if not token:
        raise RuntimeError('TELEGRAM_BOT_TOKEN is not set')

    bot = Bot(token=token)
    dp = Dispatcher()
    dp.include_router(router)
    dp.startup.register(on_startup)
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    )
    asyncio.run(run())


if __name__ == '__main__':
    main()
