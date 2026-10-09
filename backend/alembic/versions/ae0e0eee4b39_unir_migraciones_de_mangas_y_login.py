"""unir migraciones de mangas y login

Revision ID: ae0e0eee4b39
Revises: 70020f699ab9, b2da87f9bfe5
Create Date: 2026-10-09 18:44:45.285851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae0e0eee4b39'
down_revision: Union[str, Sequence[str], None] = ('70020f699ab9', 'b2da87f9bfe5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
