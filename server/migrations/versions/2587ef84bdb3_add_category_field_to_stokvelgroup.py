"""Add category field to StokvelGroup

Revision ID: 2587ef84bdb3
Revises: 45700dc0ee39
Create Date: 2025-06-24 01:13:23.099252

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2587ef84bdb3'
down_revision = '45700dc0ee39'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('stokvel_group', sa.Column('category', sa.String(length=50), nullable=True))
    # Remove any unrelated drop_table or other operations



