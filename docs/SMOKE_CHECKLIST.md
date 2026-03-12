# Smoke Checklist

## Auth
- `POST /auth/telegram` succeeds with valid Telegram `initData`.
- Повторный `POST /auth/telegram` для того же Telegram user не создаёт дубликат пользователя.
- `GET /auth/me` работает с валидным access token.
- `POST /auth/refresh` выдаёт новый access token и ротацию refresh session.
- `POST /auth/logout` отзывает текущую refresh session.

## Data
- Первый вход создаёт `users` row.
- Первый вход создаёт `user_balances` row c `balance = 0`.
- `GET /wallet/balance` возвращает текущий баланс.
- `GET /wallet/transactions` возвращает журнал операций.
- `POST /wallet/daily-bonus` начисляет бонус только один раз в UTC-сутки.
- Каждое начисление создаёт `balance_transactions` row.

## Referral
- Валидный referral code создаёт одну связь в `referrals`.
- Self-referral отклоняется.
- Повторное применение referral отклоняется.
- Реферальный бонус пишет transaction log.

## Admin
- `POST /admin/users/{id}/adjust-balance` меняет баланс пользователя.
- Admin adjustment создаёт `balance_transactions` row.
- Admin adjustment создаёт `admin_audit_logs` row.

## Compatibility
- `GET /api/locations` читает из PostgreSQL.
- `POST /api/locations` создаёт `user_locations` row.
- `POST /api/qr/bind` создаёт `qr_bindings` row.
- `GET /api/clicker/leaderboard` читает leaderboard из PostgreSQL-backed balances.
