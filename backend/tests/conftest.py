from __future__ import annotations

import os
import time
from collections.abc import Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://qual_ai_test:qual_ai_test@localhost:5433/qual_ai_test",
)

# Application modules create their engine at import time. Point them at the isolated
# test database before importing the app or its database dependencies.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["UPLOAD_DIR"] = str(BACKEND_DIR / "storage" / "test-uploads")

from app.db.metadata import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402


test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def _wait_for_database() -> None:
    deadline = time.monotonic() + 30
    last_error: OperationalError | None = None

    while time.monotonic() < deadline:
        try:
            with test_engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except OperationalError as error:
            last_error = error
            time.sleep(1)

    pytest.fail(
        "The integration test database is unavailable. Start Docker Desktop, then run "
        "'docker compose -f docker-compose.test.yml up -d postgres-test' from the project root. "
        f"Last database error: {last_error}"
    )


def _run_migrations() -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(config, "head")


def _clear_database() -> None:
    # TRUNCATE ... CASCADE does not require dependency ordering and avoids the
    # intentional Session <-> primary transcript foreign-key cycle.
    table_names = ", ".join(f'"{table.name}"' for table in Base.metadata.tables.values())
    if not table_names:
        return
    with test_engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session", autouse=True)
def prepared_database() -> Generator[None, None, None]:
    _wait_for_database()
    _run_migrations()
    _clear_database()
    yield
    _clear_database()
    test_engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(prepared_database: None) -> Generator[None, None, None]:
    _clear_database()
    yield
    _clear_database()


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    with TestingSessionLocal() as session:
        yield session


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
