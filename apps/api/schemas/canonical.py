from typing import List, Optional, Generic, TypeVar, Any, Dict
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class StandardError(BaseModel):
    code: str
    message: str
    details: Optional[List[Any]] = Field(default_factory=list)


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[StandardError] = None


class PatientSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    member_id: str
    group_number: Optional[str] = None
    address: Optional[str] = None


class ProviderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    npi: str
    name: str
    taxonomy_code: str
    tax_id: str
    in_network: bool


class PayerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    payer_id: str
    timely_filing_days: int
    requires_auth_for_advanced_imaging: bool


class ClaimLineSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    claim_id: str
    line_number: int
    cpt_code: str
    modifiers: Optional[List[str]] = Field(default_factory=list)
    diagnosis_pointers: Optional[List[int]] = Field(default_factory=list)
    units: int
    unit_price: float
    total_amount: float


class ClaimSummarySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    claim_number: str
    patient_name: str
    member_id: str
    payer_name: str
    service_date: date
    total_billed_amount: float
    status: str
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    filing_deadline: date


class ClaimDetailSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    claim_number: str
    patient_id: str
    patient_name: str
    patient_dob: date
    member_id: str
    provider_id: str
    provider_name: str
    provider_npi: str
    payer_id: str
    payer_name: str
    status: str
    total_billed_amount: float
    service_date: date
    filing_deadline: date
    primary_diagnosis: str
    secondary_diagnoses: List[str] = Field(default_factory=list)
    clinical_notes: Optional[str] = None
    lines: List[ClaimLineSchema] = Field(default_factory=list)
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None


class EligibilityResultSchema(BaseModel):
    claim_id: str
    is_active: bool
    effective_date: date
    termination_date: Optional[date] = None
    copay_amount: float
    deductible_total: float
    deductible_met: float
    deductible_remaining: float
    payer_name: str
    status: str
    warnings: List[str] = Field(default_factory=list)


class AuthorizationResultSchema(BaseModel):
    claim_id: str
    requires_auth: bool
    auth_status: str
    authorization_number: Optional[str] = None
    authorized_cpt_codes: List[str] = Field(default_factory=list)
    valid_through: Optional[date] = None
    warnings: List[str] = Field(default_factory=list)
    likely_carc: Optional[str] = None


class RiskFactorSchema(BaseModel):
    id: str
    category: str
    impact_points: int
    title: str
    description: str
    likely_carc_code: Optional[str] = None
    recommended_fix: Optional[str] = None


class RiskSubscoresSchema(BaseModel):
    eligibility: int
    authorization: int
    coverage: int
    data_quality: int
    timely_filing: int
    provider_network: int


class RiskScoreSchema(BaseModel):
    claim_id: str
    overall_score: int
    risk_level: str
    subscores: RiskSubscoresSchema
    factors: List[RiskFactorSchema] = Field(default_factory=list)
    calculated_at: datetime


class CorrectionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    claim_id: str
    field_name: str
    original_value: str
    suggested_value: str
    reason: str
    confidence: float
    status: str


class AdjudicationLineSchema(BaseModel):
    claim_line_id: str
    cpt_code: str
    paid_amount: float
    carc_code: Optional[str] = None
    carc_description: Optional[str] = None
    rarc_code: Optional[str] = None


class AdjudicationSchema(BaseModel):
    claim_id: str
    adjudication_id: str
    status: str
    billed_amount: float
    allowed_amount: float
    contractual_adjustment: float
    payer_paid_amount: float
    patient_responsibility: float
    lines: List[AdjudicationLineSchema] = Field(default_factory=list)


class RecoveryCaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    claim_id: str
    claim_number: str
    patient_name: str
    payer_name: str
    denial_carc: str
    denial_reason: str
    revenue_at_risk: float
    expected_recovery_value: float = 0.0
    recovered_amount: float = 0.0
    remaining_amount: float = 0.0
    recoverability_score: int
    priority: str
    status: str
    recommended_action: str
    explanation_why: Optional[str] = None
    filing_deadline: date
    days_remaining: int
    evidence: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    audit_trail: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class TransitionRequestSchema(BaseModel):
    status: str
    actor: Optional[str] = "Human User"
    notes: Optional[str] = None


class OutcomeRequestSchema(BaseModel):
    recovered_amount: float
    status: Optional[str] = None
    notes: Optional[str] = None


class AppealResponseSchema(BaseModel):
    case_id: str
    document_type: str
    subject: str
    content: str
    created_at: str


class RecoveryAnalyticsSchema(BaseModel):
    total_cases: int
    total_revenue_at_risk: float
    expected_recoverable_value: float
    total_recovered_amount: float
    recovery_rate_percentage: float
    priority_breakdown: Dict[str, int]
    status_breakdown: Dict[str, int]


class TopDenialReasonSchema(BaseModel):
    carc: str
    description: str
    count: int
    amount: float


class DashboardAnalyticsSchema(BaseModel):
    total_claims: int
    clean_claim_rate: float
    total_billed_value: float
    revenue_at_risk: float
    recovered_revenue: float
    risk_distribution: dict
    top_denial_reasons: List[TopDenialReasonSchema]
