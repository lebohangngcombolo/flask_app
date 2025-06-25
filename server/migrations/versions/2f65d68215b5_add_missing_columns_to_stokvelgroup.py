"""Add missing columns to StokvelGroup

Revision ID: 2f65d68215b5
Revises: 135f9a7c9f7a
Create Date: 2025-06-23 22:51:13.339155

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2f65d68215b5'
down_revision = '135f9a7c9f7a'
branch_labels = None
depends_on = None


def upgrade():
  #  op.add_column('stokvel_group', sa.Column('rules', sa.String(length=255), nullable=True))
    op.add_column('stokvel_group', sa.Column('benefits', sa.ARRAY(sa.String()), nullable=True))
 #   op.add_column('stokvel_group', sa.Column('description', sa.Text(), nullable=True))
  #  op.add_column('stokvel_group', sa.Column('frequency', sa.String(length=50), nullable=True))


