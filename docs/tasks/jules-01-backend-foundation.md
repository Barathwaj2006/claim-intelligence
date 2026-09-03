# Jules Task 01: Backend Foundation

## Wave & PR Target
- **Wave**: 1 (Foundation)
- **Target PR**: PR 1 (Foundation)

## Mission
Initialize and configure the production-grade FastAPI backend application skeleton in `apps/api/`.

## Exclusive File Ownership
- `apps/api/core/`
- `apps/api/main.py`
- `apps/api/requirements.txt`
- `apps/api/tests/conftest.py`
- `apps/api/tests/test_health.py`

**Forbidden Paths**: Do NOT edit `apps/web/`, `packages/`, or any files outside `apps/api/core/` and the entrypoints.

## Prerequisites & Dependencies
- Read `AGENTS.md` and `docs/ARCHITECTURE.md`.
- Conforms to Python 3.11+ and FastAPI best practices.

## Detailed Requirements
1. **Dependencies (`apps/api/requirements.txt`)**:
   - `fastapi>=0.110.0`
   - `uvicorn[standard]>=0.28.0`
   - `pydantic>=2.6.0`
   - `pydantic-settings>=2.2.0`
   - `sqlalchemy>=2.0.28`
   - `pytest>=8.0.0`
   - `httpx>=0.27.0`
   - `python-dotenv>=1.0.1`

2. **Core Settings (`apps/api/core/config.py`)**:
   - Pydantic Settings class loading `DATABASE_URL` (defaulting to SQLite `sqlite:///./claim_intelligence.db` if not provided), `ENVIRONMENT`, `CORS_ORIGINS` (including `http://localhost:5173`).

3. **Database Engine (`apps/api/core/database.py`)**:
   - SQLAlchemy engine, `sessionmaker`, and declarative `Base`.
   - SQLite auto-configuration with `check_same_thread=False` when using SQLite.

4. **FastAPI Application (`apps/api/main.py`)**:
   - Include CORS middleware with configured origins.
   - Global exception handler returning the standard error envelope:
     `{"success": false, "error": {"code": "...", "message": "...", "details": []}}`
   - Mount router at `/api/v1`.
   - Health endpoint at `/api/v1/health` returning system status, timestamp, and DB connectivity.

5. **Pytest Suite (`apps/api/tests/test_health.py`)**:
   - Async or HTTPX TestClient testing `/api/v1/health` returns status 200 and expected JSON keys.

## Verification Command
```bash
cd apps/api
pytest tests/test_health.py
```
