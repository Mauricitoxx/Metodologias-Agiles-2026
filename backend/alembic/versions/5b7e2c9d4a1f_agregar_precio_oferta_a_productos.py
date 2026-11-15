"""agregar precio de oferta a productos

Revision ID: 5b7e2c9d4a1f
Revises: fc03a6d2a94b
Create Date: 2026-11-15 14:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b7e2c9d4a1f'
down_revision: Union[str, Sequence[str], None] = 'fc03a6d2a94b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # HU-13: oferta opcional, positiva y menor al precio original
    with op.batch_alter_table('productos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('precio_oferta', sa.Numeric(precision=10, scale=2), nullable=True))
        batch_op.create_check_constraint(
            'ck_productos_precio_oferta_valido',
            'precio_oferta IS NULL OR (precio_oferta > 0 AND precio_oferta < precio)',
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('productos', schema=None) as batch_op:
        batch_op.drop_constraint('ck_productos_precio_oferta_valido', type_='check')
        batch_op.drop_column('precio_oferta')
