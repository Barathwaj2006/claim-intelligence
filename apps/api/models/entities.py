import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.api.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="UNKNOWN")
    member_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    group_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounters: Mapped[List["Encounter"]] = relationship("Encounter", back_populates="patient")
    claims: Mapped[List["Claim"]] = relationship("Claim", back_populates="patient")
    eligibility_checks: Mapped[List["EligibilityCheck"]] = relationship("EligibilityCheck", back_populates="patient")


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    npi: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    taxonomy_code: Mapped[str] = mapped_column(String(20), nullable=False)
    tax_id: Mapped[str] = mapped_column(String(20), nullable=False)
    in_network: Mapped[bool] = mapped_column(Boolean, default=True)

    encounters: Mapped[List["Encounter"]] = relationship("Encounter", back_populates="provider")
    claims: Mapped[List["Claim"]] = relationship("Claim", back_populates="provider")


class Payer(Base):
    __tablename__ = "payers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    payer_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    timely_filing_days: Mapped[int] = mapped_column(Integer, default=90)
    requires_auth_for_advanced_imaging: Mapped[bool] = mapped_column(Boolean, default=True)

    plans: Mapped[List["InsurancePlan"]] = relationship("InsurancePlan", back_populates="payer")
    claims: Mapped[List["Claim"]] = relationship("Claim", back_populates="payer")
    eligibility_checks: Mapped[List["EligibilityCheck"]] = relationship("EligibilityCheck", back_populates="payer")


class InsurancePlan(Base):
    __tablename__ = "insurance_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    payer_id: Mapped[str] = mapped_column(String(36), ForeignKey("payers.id"), nullable=False, index=True)
    plan_name: Mapped[str] = mapped_column(String(150), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False, default="PPO")
    annual_deductible: Mapped[float] = mapped_column(Numeric(10, 2), default=1500.00)
    copay_specialist: Mapped[float] = mapped_column(Numeric(10, 2), default=40.00)
    coinsurance_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=20.00)

    payer: Mapped["Payer"] = relationship("Payer", back_populates="plans")


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("providers.id"), nullable=False, index=True)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    place_of_service: Mapped[str] = mapped_column(String(10), default="11")
    primary_diagnosis_code: Mapped[str] = mapped_column(String(20), nullable=False)
    secondary_diagnosis_codes: Mapped[Optional[dict]] = mapped_column(JSON, default=list)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="encounters")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="encounters")
    claim: Mapped[Optional["Claim"]] = relationship("Claim", back_populates="encounter", uselist=False)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("providers.id"), nullable=False, index=True)
    payer_id: Mapped[str] = mapped_column(String(36), ForeignKey("payers.id"), nullable=False, index=True)
    encounter_id: Mapped[str] = mapped_column(String(36), ForeignKey("encounters.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True)
    total_billed_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    filing_deadline: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="claims")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="claims")
    payer: Mapped["Payer"] = relationship("Payer", back_populates="claims")
    encounter: Mapped["Encounter"] = relationship("Encounter", back_populates="claim")
    lines: Mapped[List["ClaimLine"]] = relationship("ClaimLine", back_populates="claim", cascade="all, delete-orphan")
    authorizations: Mapped[List["PriorAuthorization"]] = relationship("PriorAuthorization", back_populates="claim", cascade="all, delete-orphan")
    risk_scores: Mapped[List["RiskScore"]] = relationship("RiskScore", back_populates="claim", cascade="all, delete-orphan")
    corrections: Mapped[List["Correction"]] = relationship("Correction", back_populates="claim", cascade="all, delete-orphan")
    adjudications: Mapped[List["Adjudication"]] = relationship("Adjudication", back_populates="claim", cascade="all, delete-orphan")
    recovery_cases: Mapped[List["RecoveryCase"]] = relationship("RecoveryCase", back_populates="claim", cascade="all, delete-orphan")


class ClaimLine(Base):
    __tablename__ = "claim_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)
    cpt_code: Mapped[str] = mapped_column(String(20), nullable=False)
    modifiers: Mapped[Optional[dict]] = mapped_column(JSON, default=list)
    diagnosis_pointers: Mapped[Optional[dict]] = mapped_column(JSON, default=list)
    units: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)

    claim: Mapped["Claim"] = relationship("Claim", back_populates="lines")
    adjudication_lines: Mapped[List["AdjudicationLine"]] = relationship("AdjudicationLine", back_populates="claim_line", cascade="all, delete-orphan")


class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    payer_id: Mapped[str] = mapped_column(String(36), ForeignKey("payers.id"), nullable=False, index=True)
    check_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    termination_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    deductible_total: Mapped[float] = mapped_column(Numeric(10, 2), default=1500.00)
    deductible_met: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    copay_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=35.00)
    raw_response: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="eligibility_checks")
    payer: Mapped["Payer"] = relationship("Payer", back_populates="eligibility_checks")


class PriorAuthorization(Base):
    __tablename__ = "prior_authorizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    cpt_code: Mapped[str] = mapped_column(String(20), nullable=False)
    authorization_number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="APPROVED")
    approved_units: Mapped[int] = mapped_column(Integer, default=1)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[date] = mapped_column(Date, nullable=False)

    claim: Mapped["Claim"] = relationship("Claim", back_populates="authorizations")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    eligibility_subscore: Mapped[int] = mapped_column(Integer, default=0)
    authorization_subscore: Mapped[int] = mapped_column(Integer, default=0)
    coverage_subscore: Mapped[int] = mapped_column(Integer, default=0)
    quality_subscore: Mapped[int] = mapped_column(Integer, default=0)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    claim: Mapped["Claim"] = relationship("Claim", back_populates="risk_scores")
    factors: Mapped[List["RiskFactor"]] = relationship("RiskFactor", back_populates="risk_score", cascade="all, delete-orphan")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    risk_score_id: Mapped[str] = mapped_column(String(36), ForeignKey("risk_scores.id"), nullable=False, index=True)
    impact_points: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    likely_carc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    risk_score: Mapped["RiskScore"] = relationship("RiskScore", back_populates="factors")


class Correction(Base):
    __tablename__ = "corrections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(50), nullable=False)
    original_value: Mapped[str] = mapped_column(String(255), nullable=False)
    suggested_value: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(4, 2), default=0.95)
    status: Mapped[str] = mapped_column(String(30), default="PENDING")

    claim: Mapped["Claim"] = relationship("Claim", back_populates="corrections")


class Adjudication(Base):
    __tablename__ = "adjudications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    adjudication_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    billed_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    allowed_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    contractual_adjustment: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    payer_paid_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    patient_responsibility: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)

    claim: Mapped["Claim"] = relationship("Claim", back_populates="adjudications")
    lines: Mapped[List["AdjudicationLine"]] = relationship("AdjudicationLine", back_populates="adjudication", cascade="all, delete-orphan")
    recovery_cases: Mapped[List["RecoveryCase"]] = relationship("RecoveryCase", back_populates="adjudication")


class AdjudicationLine(Base):
    __tablename__ = "adjudication_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    adjudication_id: Mapped[str] = mapped_column(String(36), ForeignKey("adjudications.id"), nullable=False, index=True)
    claim_line_id: Mapped[str] = mapped_column(String(36), ForeignKey("claim_lines.id"), nullable=False, index=True)
    paid_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    carc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    carc_description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rarc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    adjudication: Mapped["Adjudication"] = relationship("Adjudication", back_populates="lines")
    claim_line: Mapped["ClaimLine"] = relationship("ClaimLine", back_populates="adjudication_lines")


class RecoveryCase(Base):
    __tablename__ = "recovery_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    adjudication_id: Mapped[str] = mapped_column(String(36), ForeignKey("adjudications.id"), nullable=False, index=True)
    revenue_at_risk: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    recoverability_score: Mapped[int] = mapped_column(Integer, default=50)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(30), default="NEW")
    recommended_action: Mapped[str] = mapped_column(String(50), default="FIRST_LEVEL_APPEAL")
    filing_deadline: Mapped[date] = mapped_column(Date, nullable=False)

    claim: Mapped["Claim"] = relationship("Claim", back_populates="recovery_cases")
    adjudication: Mapped["Adjudication"] = relationship("Adjudication", back_populates="recovery_cases")
    appeal_documents: Mapped[List["AppealDocument"]] = relationship("AppealDocument", back_populates="recovery_case", cascade="all, delete-orphan")


class AppealDocument(Base):
    __tablename__ = "appeal_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    recovery_case_id: Mapped[str] = mapped_column(String(36), ForeignKey("recovery_cases.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), default="APPEAL_LETTER")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recovery_case: Mapped["RecoveryCase"] = relationship("RecoveryCase", back_populates="appeal_documents")
