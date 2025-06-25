"""Add tier to StokvelGroup

Revision ID: c5493ff0bd32
Revises: 91cb22f774a8
Create Date: 2025-06-23 15:13:15.026995

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c5493ff0bd32'
down_revision = '91cb22f774a8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('stokvel_group', sa.Column('tier', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('stokvel_group', 'tier')
