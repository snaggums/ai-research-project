"""Destructively replay the V1-to-V2 migration on the isolated test database.

The script refuses non-test database names and the default development port.
It is intended for docker-compose.test.yml only.
"""

from __future__ import annotations

import importlib.util
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://qual_ai_test:qual_ai_test@localhost:5433/qual_ai_test",
)
os.environ["DATABASE_URL"] = DATABASE_URL


def _assert_isolated_test_database() -> None:
    url = make_url(DATABASE_URL)
    if not (url.database or "").endswith("_test") or url.port == 5432:
        raise RuntimeError("Refusing to reset a non-test database. Use the isolated *_test database on port 5433.")


def _alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
    return config


def _load_migration_module():
    path = BACKEND_DIR / "alembic" / "versions" / "0006_add_v2_session_workspace.py"
    spec = importlib.util.spec_from_file_location("air_v2_migration_0006", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load migration 0006")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    _assert_isolated_test_database()
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))

    config = _alembic_config()
    command.upgrade(config, "0005_create_themes")

    ids = {
        "project": "11111111-1111-4111-8111-111111111111",
        "document": "22222222-2222-4222-8222-222222222222",
        "chunk": "33333333-3333-4333-8333-333333333333",
        "theme": "44444444-4444-4444-8444-444444444444",
        "evidence": "55555555-5555-4555-8555-555555555555",
    }
    vector = "[" + ",".join("0" for _ in range(64)) + "]"
    with engine.begin() as connection:
        connection.execute(text("INSERT INTO projects (id,name,description) VALUES (CAST(:id AS uuid),'V1 Project','Preserve me')"), {"id": ids["project"]})
        connection.execute(text("INSERT INTO documents (id,project_id,filename,file_path,mime_type,content,status) VALUES (CAST(:id AS uuid),CAST(:project AS uuid),'v1.txt','v1.txt','text/plain','Original transcript','complete')"), {"id": ids["document"], "project": ids["project"]})
        connection.execute(text("INSERT INTO chunks (id,document_id,project_id,text,embedding,chunk_index) VALUES (CAST(:id AS uuid),CAST(:document AS uuid),CAST(:project AS uuid),'Original transcript',CAST(:embedding AS vector),0)"), {"id": ids["chunk"], "document": ids["document"], "project": ids["project"], "embedding": vector})
        connection.execute(text("INSERT INTO themes (id,project_id,title,description,confidence,evidence_count,created_by) VALUES (CAST(:id AS uuid),CAST(:project AS uuid),'V1 Theme','Preserve theme',0.8,1,'mock')"), {"id": ids["theme"], "project": ids["project"]})
        connection.execute(
            text(
                "INSERT INTO theme_evidence "
                "(id,theme_id,document_id,chunk_id,quote,reasoning,relevance_score,evidence_type) "
                "VALUES (CAST(:evidence AS uuid),CAST(:theme AS uuid),CAST(:document AS uuid),"
                "CAST(:chunk AS uuid),'Original transcript','Supports theme',0.9,'supporting')"
            ),
            ids,
        )

    command.upgrade(config, "head")
    migration = _load_migration_module()
    with engine.begin() as connection:
        before = connection.execute(text("SELECT (SELECT count(*) FROM projects),(SELECT count(*) FROM documents),(SELECT count(*) FROM chunks),(SELECT count(*) FROM themes),(SELECT count(*) FROM theme_evidence)" )).one()
        migration.backfill_v1_projects(connection)
        migration.backfill_v1_projects(connection)
        after = connection.execute(text("SELECT (SELECT count(*) FROM projects),(SELECT count(*) FROM documents),(SELECT count(*) FROM chunks),(SELECT count(*) FROM themes),(SELECT count(*) FROM theme_evidence)" )).one()
        assert before == after == (1, 1, 1, 1, 1)
        ownership = connection.execute(text("SELECT d.id::text,d.session_id::text,s.project_id::text,t.id::text,t.session_id::text,e.id::text,e.document_id::text,e.chunk_id::text FROM documents d JOIN sessions s ON s.id=d.session_id JOIN themes t ON t.project_id=d.project_id JOIN theme_evidence e ON e.theme_id=t.id" )).one()
        assert ownership[0] == ids["document"]
        assert ownership[2] == ids["project"]
        assert ownership[3] == ids["theme"]
        assert ownership[1] == ownership[4]
        assert ownership[5:] == (ids["evidence"], ids["document"], ids["chunk"])
        session_count = connection.execute(text("SELECT count(*) FROM sessions WHERE project_id=CAST(:project AS uuid) AND migration_source='v1-project'"), {"project": ids["project"]}).scalar_one()
        assert session_count == 1

    engine.dispose()
    print("V1-to-V2 migration replay passed: IDs, counts, ownership, and idempotency preserved.")


if __name__ == "__main__":
    main()
