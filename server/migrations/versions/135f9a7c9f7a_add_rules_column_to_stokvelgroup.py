"""Add rules column to StokvelGroup

Revision ID: 135f9a7c9f7a
Revises: 6cf77f7f9a80
Create Date: 2025-06-23 22:41:50.458948

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '135f9a7c9f7a'
down_revision = '6cf77f7f9a80'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('stokvel_group', sa.Column('rules', sa.String(length=255), nullable=True))

def downgrade():
    op.drop_column('stokvel_group', 'rules')


