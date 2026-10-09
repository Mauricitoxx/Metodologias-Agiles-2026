"""unir login y actividades

Revision ID: 70020f699ab9
Revises: c8014ea8ac35, edf282b21c34
Create Date: 2026-10-09 12:44:32.540091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70020f699ab9'
down_revision: Union[str, Sequence[str], None] = ('c8014ea8ac35', 'edf282b21c34')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
