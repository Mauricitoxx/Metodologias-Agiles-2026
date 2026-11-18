"""agregar imagen a juegos

Revision ID: b4c1e7d9a2f3
Revises: 8d3f6a1b2c7e
Create Date: 2026-11-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c1e7d9a2f3'
down_revision: Union[str, Sequence[str], None] = '8d3f6a1b2c7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Portada opcional: data URL subida desde el formulario o URL web
    with op.batch_alter_table('juegos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('imagen', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('juegos', schema=None) as batch_op:
        batch_op.drop_column('imagen')
