"""crear administradores y sesiones

Revision ID: edf282b21c34
Revises:
Create Date: 2026-10-08 19:39:17.498230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edf282b21c34'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('administradores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=256), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('sesiones_administradores',
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('administrador_id', sa.Integer(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['administrador_id'], ['administradores.id'], ),
    sa.PrimaryKeyConstraint('token_hash')
    )
    with op.batch_alter_table('sesiones_administradores', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sesiones_administradores_administrador_id'), ['administrador_id'], unique=False)



def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('sesiones_administradores', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_sesiones_administradores_administrador_id'))

    op.drop_table('sesiones_administradores')
    op.drop_table('administradores')
