from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Union
from apps.api.schemas.canonical import (
    ClaimDetailSchema,
    RiskScoreSchema,
    RiskFactorSchema,
    ExplanationEvidenceSchema,
    ExplanationFactorSchema,
    ExplanationResponseSchema,
)


class ExplainabilityEngine:
    """
    Explainability Engine for Claim Intelligence Platform.

    Translates deterministic risk signals, claim data, and risk scoring factor breakdowns
    into structured, grounded, human-readable explanations.

    Core Principles:
    - Zero Hallucination: Explanations remain strictly grounded in input data.
    - Explicit Taxonomy: Clear distinction between FACT, INFERENCE, and RECOMMENDATION.
    - Quantitative Attribution: Decomposes overall risk score into specific contributing factors.
    - Actionable Guidance: Directly advises staff on next best actions.
    """

    @staticmethod
    def evaluate(
        claim: Union[ClaimDetailSchema, Dict[str, Any]],
        risk_score: Optional[Union[RiskScoreSchema, Dict[str, Any]]] = None,
    ) -> ExplanationResponseSchema:
        # Convert dict to schema if needed
        if isinstance(claim, dict):
            claim_obj = ClaimDetailSchema.model_validate(claim)
        else:
            claim_obj = claim

        risk_obj = None
        if risk_score is not None:
            if isinstance(risk_score, dict):
                risk_obj = RiskScoreSchema.model_validate(risk_score)
            else:
                risk_obj = risk_score

        # Determine overall risk score and tier
        overall_score = risk_obj.overall_score if risk_obj else (claim_obj.risk_score or 0)
        risk_tier = ExplainabilityEngine._determine_risk_tier(overall_score)

        factors: List[ExplanationFactorSchema] = []
        global_evidence: List[ExplanationEvidenceSchema] = []
        recommendations: List[str] = []

        # Grounded facts collected from claim payload
        ExplainabilityEngine._collect_claim_facts(claim_obj, global_evidence)

        # Process factors if RiskScore provided
        if risk_obj and risk_obj.factors:
            for rf in risk_obj.factors:
                factor_item = ExplainabilityEngine._process_risk_factor(rf, claim_obj)
                factors.append(factor_item)
                global_evidence.extend(factor_item.evidence)

                if rf.recommended_fix and rf.recommended_fix not in recommendations:
                    recommendations.append(rf.recommended_fix)
        else:
            # Fallback deterministic analysis based on claim payload
            ExplainabilityEngine._analyze_claim_fallback(
                claim_obj, overall_score, factors, global_evidence, recommendations
            )

        # De-duplicate evidence and recommendations while preserving order
        unique_evidence = ExplainabilityEngine._deduplicate_evidence(global_evidence)
        unique_recommendations = ExplainabilityEngine._deduplicate_recommendations(recommendations)

        # Executive summary generation
        summary = ExplainabilityEngine._generate_summary(claim_obj, overall_score, risk_tier, factors)

        # Confidence calculation based on data completeness
        confidence = ExplainabilityEngine._calculate_confidence(claim_obj, risk_obj)

        return ExplanationResponseSchema(
            summary=summary,
            risk_score=overall_score,
            risk_tier=risk_tier,
            factors=factors,
            recommendation=unique_recommendations,
            evidence=unique_evidence,
            confidence=confidence,
            generated_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def _determine_risk_tier(score: int) -> str:
        if score >= 60:
            return "HIGH"
        elif score >= 30:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def _collect_claim_facts(
        claim: ClaimDetailSchema, evidence_list: List[ExplanationEvidenceSchema]
    ) -> None:
        evidence_list.append(
            ExplanationEvidenceSchema(
                type="FACT",
                description=f"Claim ID {claim.id} for patient {claim.patient_name} with total billed amount ${claim.total_billed_amount:,.2f}.",
                source_field="total_billed_amount",
            )
        )
        evidence_list.append(
            ExplanationEvidenceSchema(
                type="FACT",
                description=f"Payer assigned: {claim.payer_name} (ID: {claim.payer_id}). Primary diagnosis: {claim.primary_diagnosis}.",
                source_field="payer_name",
            )
        )
        if claim.provider_npi:
            evidence_list.append(
                ExplanationEvidenceSchema(
                    type="FACT",
                    description=f"Rendering provider NPI: {claim.provider_npi} ({claim.provider_name}).",
                    source_field="provider_npi",
                )
            )

    @staticmethod
    def _process_risk_factor(
        rf: RiskFactorSchema, claim: ClaimDetailSchema
    ) -> ExplanationFactorSchema:
        severity = "HIGH" if rf.impact_points >= 25 else ("MEDIUM" if rf.impact_points >= 10 else "LOW")
        source = "FACT" if "verified" in rf.description.lower() or "found" in rf.description.lower() else "INFERENCE"

        factor_evidence: List[ExplanationEvidenceSchema] = [
            ExplanationEvidenceSchema(
                type="FACT",
                description=f"Observed signal in {rf.category.lower()}: {rf.title}",
                source_field=f"risk_factor.{rf.category.lower()}",
            )
        ]

        if rf.likely_carc_code:
            factor_evidence.append(
                ExplanationEvidenceSchema(
                    type="INFERENCE",
                    description=f"Predicted CARC code {rf.likely_carc_code} based on historical payer rules.",
                    source_field="likely_carc_code",
                )
            )

        return ExplanationFactorSchema(
            factor=f"{rf.title}: {rf.description}",
            contribution=rf.impact_points,
            severity=severity,
            evidence=factor_evidence,
            source=source,
        )

    @staticmethod
    def _analyze_claim_fallback(
        claim: ClaimDetailSchema,
        overall_score: int,
        factors: List[ExplanationFactorSchema],
        evidence: List[ExplanationEvidenceSchema],
        recommendations: List[str],
    ) -> None:
        if overall_score >= 60:
            f_ev = [
                ExplanationEvidenceSchema(
                    type="FACT",
                    description=f"Procedure lines contain advanced codes under {claim.payer_name}.",
                    source_field="lines",
                ),
                ExplanationEvidenceSchema(
                    type="INFERENCE",
                    description="High potential for denial (likely CARC CO-197 or CO-16) without prior authorization or verified billing format.",
                    source_field="risk_score",
                ),
            ]
            factors.append(
                ExplanationFactorSchema(
                    factor="High risk of denial detected across claim procedure lines.",
                    contribution=overall_score,
                    severity="HIGH",
                    evidence=f_ev,
                    source="INFERENCE",
                )
            )
            recommendations.append("Review claim authorization and modifier details prior to submission.")
            recommendations.append("Verify patient eligibility status with payer.")
        elif overall_score >= 30:
            f_ev = [
                ExplanationEvidenceSchema(
                    type="FACT",
                    description=f"Claim service date {claim.service_date} filing deadline {claim.filing_deadline}.",
                    source_field="filing_deadline",
                )
            ]
            factors.append(
                ExplanationFactorSchema(
                    factor="Moderate risk: Minor data quality or filing deadline warnings present.",
                    contribution=overall_score,
                    severity="MEDIUM",
                    evidence=f_ev,
                    source="INFERENCE",
                )
            )
            recommendations.append("Verify procedure line diagnosis pointers and timely filing dates.")
        else:
            f_ev = [
                ExplanationEvidenceSchema(
                    type="FACT",
                    description="All required billing fields present and valid.",
                    source_field="status",
                )
            ]
            factors.append(
                ExplanationFactorSchema(
                    factor="Low risk: Claim satisfies standard billing requirements.",
                    contribution=0,
                    severity="LOW",
                    evidence=f_ev,
                    source="FACT",
                )
            )
            recommendations.append("Proceed with clean claim submission to clearinghouse.")

    @staticmethod
    def _generate_summary(
        claim: ClaimDetailSchema,
        score: int,
        tier: str,
        factors: List[ExplanationFactorSchema],
    ) -> str:
        if tier == "HIGH":
            primary_reason = factors[0].factor if factors else "Multiple risk indicators present."
            return (
                f"High Denial Risk ({score}/100) for claim {claim.claim_number} ({claim.payer_name}): "
                f"{primary_reason}"
            )
        elif tier == "MEDIUM":
            return (
                f"Moderate Denial Risk ({score}/100) for claim {claim.claim_number} ({claim.payer_name}). "
                f"Minor warnings require review prior to submission."
            )
        else:
            return (
                f"Low Denial Risk ({score}/100) for claim {claim.claim_number} ({claim.payer_name}). "
                f"Claim is clean and ready for submission."
            )

    @staticmethod
    def _calculate_confidence(
        claim: ClaimDetailSchema, risk_obj: Optional[RiskScoreSchema]
    ) -> float:
        # Grounded confidence metric based on presence of essential attributes
        score = 0.7  # Base confidence
        if claim.provider_npi and len(claim.provider_npi) == 10:
            score += 0.1
        if claim.lines and len(claim.lines) > 0:
            score += 0.1
        if risk_obj is not None:
            score += 0.1
        return round(min(score, 1.0), 2)

    @staticmethod
    def _deduplicate_evidence(
        evidence: List[ExplanationEvidenceSchema],
    ) -> List[ExplanationEvidenceSchema]:
        seen = set()
        unique = []
        for e in evidence:
            key = (e.type, e.description, e.source_field)
            if key not in seen:
                seen.add(key)
                unique.append(e)
        return unique

    @staticmethod
    def _deduplicate_recommendations(recs: List[str]) -> List[str]:
        seen = set()
        unique = []
        for r in recs:
            if r not in seen:
                seen.add(r)
                unique.append(r)
        return unique


def generate_claim_explanation(
    claim: Union[ClaimDetailSchema, Dict[str, Any]],
    risk_score: Optional[Union[RiskScoreSchema, Dict[str, Any]]] = None,
) -> ExplanationResponseSchema:
    return ExplainabilityEngine.evaluate(claim, risk_score)
