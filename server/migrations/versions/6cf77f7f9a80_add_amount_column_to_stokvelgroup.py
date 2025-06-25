"""Add amount column to StokvelGroup

Revision ID: 6cf77f7f9a80
Revises: 9ef91d8d0f82
Create Date: 2025-06-23 22:35:57.849856

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '6cf77f7f9a80'
down_revision = '9ef91d8d0f82'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('stokvel_group', sa.Column('amount', sa.Float(), nullable=True))
    # Remove any op.drop_table(...) lines here!


