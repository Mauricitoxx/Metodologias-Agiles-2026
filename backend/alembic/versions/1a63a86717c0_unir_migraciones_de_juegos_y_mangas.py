"""unir migraciones de juegos y mangas

Revision ID: 1a63a86717c0
Revises: ae0e0eee4b39, f3812e8e60c9
Create Date: 2026-10-09 21:48:52.535256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a63a86717c0'
down_revision: Union[str, Sequence[str], None] = ('ae0e0eee4b39', 'f3812e8e60c9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
