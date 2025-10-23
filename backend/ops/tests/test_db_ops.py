import os
import pathlib
from sqlalchemy import text


def test_db_connection_and_query(tmp_path):
    db_path = tmp_path / "test_ops.db"
    os.environ["OPS_DATABASE_URL"] = f"sqlite:///{db_path}"

    import importlib
    db_session = importlib.import_module("ops.app.db.session")
    importlib.reload(db_session)

    with db_session.engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)"))
        conn.execute(text("INSERT INTO test_table (name) VALUES ('bob')"))
        res = conn.execute(text("SELECT COUNT(*) FROM test_table"))
        count = res.scalar_one()
        assert count == 1


def test_alembic_upgrade_and_downgrade(tmp_path):
    db_path = tmp_path / "test_ops_migrations.db"
    os.environ["OPS_DATABASE_URL"] = f"sqlite:///{db_path}"

    from alembic import command
    from alembic.config import Config

    service_dir = pathlib.Path(__file__).resolve().parents[1]
    cfg = Config()
    cfg.set_main_option("script_location", str(service_dir / "alembic"))
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "-1")
