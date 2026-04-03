from __future__ import annotations

from django.conf import settings


def is_enabled(flag_name: str, default: bool = False) -> bool:
    flags = getattr(settings, 'ROLLOUT_FLAGS', {})
    value = flags.get(flag_name, default)
    return bool(value)


def assert_write_enabled() -> None:
    if not is_enabled('DB_V2_WRITE_ENABLED', True):
        raise RuntimeError('DB_V2_WRITE_ENABLED is disabled for this environment.')


def dual_write_enabled() -> bool:
    return is_enabled('DB_V2_DUAL_WRITE_ENABLED', False)


def pos_receipt_dual_write_enabled() -> bool:
    return dual_write_enabled() and is_enabled('DB_V2_POS_RECEIPT_DUAL_WRITE_ENABLED', False)


def pos_receipt_read_enabled() -> bool:
    return is_enabled('DB_V2_POS_RECEIPT_READ_ENABLED', False)


def reconciliation_enabled() -> bool:
    return is_enabled('DB_V2_RECONCILIATION_ENABLED', False)
