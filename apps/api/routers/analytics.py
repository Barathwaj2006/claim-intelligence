from fastapi import APIRouter
from apps.api.schemas.canonical import DashboardAnalyticsSchema, TopDenialReasonSchema

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsSchema)
def get_dashboard_metrics():
    """Retrieve aggregate executive RCM dashboard KPIs."""
    return DashboardAnalyticsSchema(
        total_claims=142,
        clean_claim_rate=84.5,
        total_billed_value=428900.00,
        revenue_at_risk=58300.00,
        recovered_revenue=34200.00,
        risk_distribution={
            "low": 98,
            "medium": 28,
            "high": 16,
        },
        top_denial_reasons=[
            TopDenialReasonSchema(
                carc="CO-197",
                description="Precertification/auth absent or unapproved",
                count=9,
                amount=28400.00,
            ),
            TopDenialReasonSchema(
                carc="CO-16",
                description="Claim lacks info or has demographic error",
                count=5,
                amount=14200.00,
            ),
            TopDenialReasonSchema(
                carc="CO-29",
                description="Timely filing limit expired",
                count=2,
                amount=15700.00,
            ),
        ],
    )
