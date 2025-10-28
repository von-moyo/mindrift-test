"""initial empty schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-10-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Initial empty migration
    pass


def downgrade() -> None:
    # Revert initial migration
    pass
