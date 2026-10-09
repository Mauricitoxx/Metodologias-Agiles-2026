"""Date math for recurring activities. Pure functions: no database access."""

import calendar
from datetime import datetime, timedelta

from app.models.actividad import FrecuenciaActividad

FIXED_STEPS = {
    FrecuenciaActividad.semanal: timedelta(weeks=1),
    FrecuenciaActividad.quincenal: timedelta(weeks=2),
}


def _week_of_month(value: datetime) -> int:
    """1 for the first <weekday> of the month, 2 for the second... up to 5."""
    return (value.day - 1) // 7 + 1


def _nth_weekday(year: int, month: int, weekday: int, week: int) -> int:
    """Day of the month of the n-th <weekday>. Week 5 means 'the last one', since not every month has five."""
    days_in_month = calendar.monthrange(year, month)[1]
    if week >= 5:
        last_weekday = calendar.weekday(year, month, days_in_month)
        return days_in_month - (last_weekday - weekday) % 7
    first_weekday = calendar.weekday(year, month, 1)
    return 1 + (weekday - first_weekday) % 7 + (week - 1) * 7


def _add_months_same_weekday(anchor: datetime, months: int) -> datetime:
    """Same n-th weekday and time, `months` months later (e.g. 2nd Saturday -> 2nd Saturday)."""
    month_index = anchor.month - 1 + months
    year, month = anchor.year + month_index // 12, month_index % 12 + 1
    day = _nth_weekday(year, month, anchor.weekday(), _week_of_month(anchor))
    return anchor.replace(year=year, month=month, day=day)


def next_occurrence(
    anchor: datetime, frecuencia: FrecuenciaActividad, duration: timedelta, now: datetime
) -> datetime:
    """First occurrence of the series, starting from `anchor`, that has not finished yet at `now`."""
    if anchor + duration > now or frecuencia == FrecuenciaActividad.unica:
        return anchor

    step = FIXED_STEPS.get(frecuencia)
    if step is not None:
        elapsed = now - (anchor + duration)
        return anchor + (elapsed // step + 1) * step

    # Monthly: walk month by month (always computed from the same anchor to avoid drifting)
    months = 1
    while (candidate := _add_months_same_weekday(anchor, months)) + duration <= now:
        months += 1
    return candidate
