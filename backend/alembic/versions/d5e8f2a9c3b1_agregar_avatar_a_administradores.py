"""agregar avatar a administradores

Revision ID: d5e8f2a9c3b1
Revises: 8d3f6a1b2c7e
Create Date: 2026-11-18 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e8f2a9c3b1'
down_revision: Union[str, Sequence[str], None] = '8d3f6a1b2c7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Emoji del staff en el panel. Los administradores existentes quedan con el escudo
    with op.batch_alter_table('administradores', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('avatar', sa.String(length=16), server_default='🛡️', nullable=False)
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('administradores', schema=None) as batch_op:
        batch_op.drop_column('avatar')
