"""Add Card model

Revision ID: cee8fb412e7c
Revises: 67b1bd7f39d5
Create Date: 2025-06-26 00:31:21.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'cee8fb412e7c'
down_revision = '67b1bd7f39d5'
branch_labels = None
depends_on = None

def upgrade():
    # Create card table
    op.create_table('card',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('cardholder', sa.String(length=100), nullable=False),
        sa.Column('card_number_last4', sa.String(length=4), nullable=False),
        sa.Column('expiry', sa.String(length=5), nullable=False),
        sa.Column('is_primary', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('card')   