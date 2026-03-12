from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '20260312_0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('password_hash', sa.String(length=512), nullable=True),
        sa.Column('referral_code', sa.String(length=32), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=True),
        sa.Column('first_name', sa.String(length=255), nullable=True),
        sa.Column('last_name', sa.String(length=255), nullable=True),
        sa.Column('photo_url', sa.Text(), nullable=True),
        sa.Column('language_code', sa.String(length=32), nullable=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
        sa.UniqueConstraint('email', name=op.f('uq_users_email')),
        sa.UniqueConstraint('referral_code', name=op.f('uq_users_referral_code')),
        sa.UniqueConstraint('telegram_id', name=op.f('uq_users_telegram_id')),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_referral_code'), 'users', ['referral_code'], unique=False)
    op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=False)

    op.create_table(
        'competitions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_competitions')),
    )
    op.create_index(op.f('ix_competitions_status'), 'competitions', ['status'], unique=False)

    op.create_table(
        'user_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(length=128), nullable=False),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('is_revoked', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_sessions_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_sessions')),
        sa.UniqueConstraint('token_hash', name=op.f('uq_user_sessions_token_hash')),
    )
    op.create_index(op.f('ix_user_sessions_token_hash'), 'user_sessions', ['token_hash'], unique=False)
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)

    op.create_table(
        'user_balances',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('balance', sa.BigInteger(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_balances_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_balances')),
        sa.UniqueConstraint('user_id', name=op.f('uq_user_balances_user_id')),
    )

    op.create_table(
        'balance_transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('type', sa.String(length=64), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('direction', sa.String(length=16), nullable=False),
        sa.Column('source', sa.String(length=64), nullable=False),
        sa.Column('meta', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_balance_transactions_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_balance_transactions')),
    )
    op.create_index(op.f('ix_balance_transactions_user_id'), 'balance_transactions', ['user_id'], unique=False)
    op.create_index('ix_balance_transactions_user_id_created_at', 'balance_transactions', ['user_id', 'created_at'], unique=False)

    op.create_table(
        'referrals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('referrer_user_id', sa.String(length=36), nullable=False),
        sa.Column('referred_user_id', sa.String(length=36), nullable=False),
        sa.Column('source', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['referred_user_id'], ['users.id'], name=op.f('fk_referrals_referred_user_id_users'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['referrer_user_id'], ['users.id'], name=op.f('fk_referrals_referrer_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_referrals')),
        sa.UniqueConstraint('referred_user_id', name='uq_referrals_referred_user_id'),
    )
    op.create_index(op.f('ix_referrals_referred_user_id'), 'referrals', ['referred_user_id'], unique=False)
    op.create_index(op.f('ix_referrals_referrer_user_id'), 'referrals', ['referrer_user_id'], unique=False)

    op.create_table(
        'daily_rewards',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('reward_date', sa.Date(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_daily_rewards_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_daily_rewards')),
        sa.UniqueConstraint('user_id', 'reward_date', name='uq_daily_rewards_user_id_reward_date'),
    )
    op.create_index('ix_daily_rewards_user_id_created_at', 'daily_rewards', ['user_id', 'created_at'], unique=False)

    op.create_table(
        'competition_scores',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('competition_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('score', sa.BigInteger(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], name=op.f('fk_competition_scores_competition_id_competitions'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_competition_scores_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_competition_scores')),
        sa.UniqueConstraint('competition_id', 'user_id', name='uq_competition_scores_competition_id_user_id'),
    )
    op.create_index(op.f('ix_competition_scores_competition_id'), 'competition_scores', ['competition_id'], unique=False)
    op.create_index(op.f('ix_competition_scores_user_id'), 'competition_scores', ['user_id'], unique=False)

    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('admin_user_id', sa.String(length=36), nullable=True),
        sa.Column('target_user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('old_data', sa.JSON(), nullable=True),
        sa.Column('new_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], name=op.f('fk_admin_audit_logs_admin_user_id_users'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], name=op.f('fk_admin_audit_logs_target_user_id_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_admin_audit_logs')),
    )
    op.create_index(op.f('ix_admin_audit_logs_admin_user_id'), 'admin_audit_logs', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_target_user_id'), 'admin_audit_logs', ['target_user_id'], unique=False)

    op.create_table(
        'user_locations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('city', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=255), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_locations_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_locations')),
    )
    op.create_index(op.f('ix_user_locations_user_id'), 'user_locations', ['user_id'], unique=False)

    op.create_table(
        'qr_bindings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('qr_id', sa.String(length=128), nullable=False),
        sa.Column('owner_user_id', sa.String(length=36), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('city', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=255), nullable=False),
        sa.Column('secure_hash', sa.String(length=128), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('bound_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], name=op.f('fk_qr_bindings_owner_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_qr_bindings')),
        sa.UniqueConstraint('qr_id', name=op.f('uq_qr_bindings_qr_id')),
    )
    op.create_index(op.f('ix_qr_bindings_owner_user_id'), 'qr_bindings', ['owner_user_id'], unique=False)
    op.create_index(op.f('ix_qr_bindings_qr_id'), 'qr_bindings', ['qr_id'], unique=False)

    op.create_table(
        'lottery_entries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_lottery_entries_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_lottery_entries')),
        sa.UniqueConstraint('user_id', name='uq_lottery_entries_user_id'),
    )
    op.create_index(op.f('ix_lottery_entries_user_id'), 'lottery_entries', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_lottery_entries_user_id'), table_name='lottery_entries')
    op.drop_table('lottery_entries')
    op.drop_index(op.f('ix_qr_bindings_qr_id'), table_name='qr_bindings')
    op.drop_index(op.f('ix_qr_bindings_owner_user_id'), table_name='qr_bindings')
    op.drop_table('qr_bindings')
    op.drop_index(op.f('ix_user_locations_user_id'), table_name='user_locations')
    op.drop_table('user_locations')
    op.drop_index(op.f('ix_admin_audit_logs_target_user_id'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_admin_user_id'), table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')
    op.drop_index(op.f('ix_competition_scores_user_id'), table_name='competition_scores')
    op.drop_index(op.f('ix_competition_scores_competition_id'), table_name='competition_scores')
    op.drop_table('competition_scores')
    op.drop_index('ix_daily_rewards_user_id_created_at', table_name='daily_rewards')
    op.drop_table('daily_rewards')
    op.drop_index(op.f('ix_referrals_referrer_user_id'), table_name='referrals')
    op.drop_index(op.f('ix_referrals_referred_user_id'), table_name='referrals')
    op.drop_table('referrals')
    op.drop_index('ix_balance_transactions_user_id_created_at', table_name='balance_transactions')
    op.drop_index(op.f('ix_balance_transactions_user_id'), table_name='balance_transactions')
    op.drop_table('balance_transactions')
    op.drop_table('user_balances')
    op.drop_index(op.f('ix_user_sessions_user_id'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_token_hash'), table_name='user_sessions')
    op.drop_table('user_sessions')
    op.drop_index(op.f('ix_competitions_status'), table_name='competitions')
    op.drop_table('competitions')
    op.drop_index(op.f('ix_users_telegram_id'), table_name='users')
    op.drop_index(op.f('ix_users_referral_code'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
