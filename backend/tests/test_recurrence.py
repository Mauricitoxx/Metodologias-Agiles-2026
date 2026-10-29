from datetime import datetime, timedelta

import pytest

from app.models.actividad import FrecuenciaActividad
from app.services.recurrence import next_occurrence

TWO_HOURS = timedelta(hours=2)
NOW = datetime(2026, 10, 8, 15, 0)  # Thursday


def test_unfinished_occurrence_is_kept():
    anchor = datetime(2026, 10, 8, 14, 0)  # in progress until 16:00
    assert next_occurrence(anchor, FrecuenciaActividad.semanal, TWO_HOURS, NOW) == anchor


def test_single_activity_never_moves():
    anchor = datetime(2026, 9, 1, 19, 0)
    assert next_occurrence(anchor, FrecuenciaActividad.unica, TWO_HOURS, NOW) == anchor


def test_weekly_moves_to_same_weekday_and_time():
    anchor = datetime(2026, 9, 1, 19, 0)  # Tuesday
    result = next_occurrence(anchor, FrecuenciaActividad.semanal, TWO_HOURS, NOW)
    assert result == datetime(2026, 10, 13, 19, 0)


def test_weekly_moves_one_week_right_after_it_ends():
    anchor = datetime(2026, 10, 8, 13, 0)  # ended at exactly 15:00
    result = next_occurrence(anchor, FrecuenciaActividad.semanal, TWO_HOURS, NOW)
    assert result == datetime(2026, 10, 15, 13, 0)


def test_biweekly_moves_in_two_week_steps():
    anchor = datetime(2026, 9, 10, 10, 0)
    result = next_occurrence(anchor, FrecuenciaActividad.quincenal, TWO_HOURS, NOW)
    assert result == datetime(2026, 10, 22, 10, 0)


@pytest.mark.parametrize(
    ("anchor", "expected"),
    [
        # 2nd Saturday of August -> 2nd Saturday of October
        (datetime(2026, 8, 8, 20, 0), datetime(2026, 10, 10, 20, 0)),
        # 5th Friday -> last Friday of the month
        (datetime(2026, 1, 30, 20, 0), datetime(2026, 10, 30, 20, 0)),
        # 1st Monday of October already passed -> 1st Monday of November, across a year
        (datetime(2025, 11, 3, 20, 0), datetime(2026, 11, 2, 20, 0)),
    ],
)
def test_monthly_keeps_nth_weekday(anchor, expected):
    assert next_occurrence(anchor, FrecuenciaActividad.mensual, TWO_HOURS, NOW) == expected
