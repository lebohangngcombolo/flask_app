"""Add group_id to group_join_request

Revision ID: d57bcedda0a4
Revises: 7a449d24b63e
Create Date: 2025-07-03 15:27:58.601765

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd57bcedda0a4'
down_revision = '7a449d24b63e'
branch_labels = None
depends_on = None


# In migrations/versions/<timestamp>_add_group_id_to_groupjoinrequest.py

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('group_join_request', sa.Column('group_id', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('group_join_request', 'group_id')