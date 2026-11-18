"""unir avatar de staff e imagen de juegos

Revision ID: ce8462fafe2e
Revises: c7a2d4e8f1b6, d5e8f2a9c3b1
Create Date: 2026-11-18 10:39:21.440200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce8462fafe2e'
down_revision: Union[str, Sequence[str], None] = ('c7a2d4e8f1b6', 'd5e8f2a9c3b1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
