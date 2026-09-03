from .health import router as health_router
from .claims import router as claims_router
from .analytics import router as analytics_router
from .eligibility import router as eligibility_router
from .authorization import router as authorization_router
from .coverage import router as coverage_router
from .quality import router as quality_router
from .risk import router as risk_router
from .adjudication import router as adjudication_router
from .recovery import router as recovery_router

__all__ = [
    "health_router",
    "claims_router",
    "analytics_router",
    "eligibility_router",
    "authorization_router",
    "coverage_router",
    "quality_router",
    "risk_router",
    "adjudication_router",
    "recovery_router",
]
