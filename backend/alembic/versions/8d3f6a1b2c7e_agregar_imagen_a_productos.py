"""agregar imagen a productos

Revision ID: 8d3f6a1b2c7e
Revises: 5b7e2c9d4a1f
Create Date: 2026-11-15 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d3f6a1b2c7e'
down_revision: Union[str, Sequence[str], None] = '5b7e2c9d4a1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # URL web de la foto del producto, opcional como en la carta
    with op.batch_alter_table('productos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('imagen', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('productos', schema=None) as batch_op:
        batch_op.drop_column('imagen')
