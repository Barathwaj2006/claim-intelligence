from .health import router as health_router
from .claims import router as claims_router
from .analytics import router as analytics_router
from .adjudication import router as adjudication_router

__all__ = ["health_router", "claims_router", "analytics_router", "adjudication_router"]
