"""imagen de juegos como url

Revision ID: c7a2d4e8f1b6
Revises: b4c1e7d9a2f3
Create Date: 2026-11-18 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7a2d4e8f1b6'
down_revision: Union[str, Sequence[str], None] = 'b4c1e7d9a2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # La portada pasa a ser solo una URL web de hasta 500 caracteres, como en actividades y productos.
    # Las imágenes subidas como data URL no entran: se borran antes de achicar la columna.
    op.execute("UPDATE juegos SET imagen = NULL WHERE imagen IS NOT NULL AND length(imagen) > 500")
    with op.batch_alter_table('juegos', schema=None) as batch_op:
        batch_op.alter_column(
            'imagen',
            existing_type=sa.Text(),
            type_=sa.String(length=500),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('juegos', schema=None) as batch_op:
        batch_op.alter_column(
            'imagen',
            existing_type=sa.String(length=500),
            type_=sa.Text(),
            existing_nullable=True,
        )
