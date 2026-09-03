"""
Database seeding script for U.S. Healthcare Claim Intelligence Platform.
Populates standard U.S. Payers, Providers, Patients, Encounters, and CMS-1500 Claims
from canonical JSON seed fixtures.
"""

import json
import os
from datetime import datetime, date
from pathlib import Path
from sqlalchemy.orm import Session

from apps.api.core.database import Base, engine, SessionLocal
from apps.api.models.entities import (
    Payer,
    InsurancePlan,
    Patient,
    Provider,
    Encounter,
    Claim,
    ClaimLine,
    PriorAuthorization,
    RiskScore,
    RiskFactor,
)


def seed_database():
    print("🏥 Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Determine data root
        repo_root = Path(__file__).resolve().parent.parent.parent
        seed_dir = repo_root / "data" / "seed"

        # 1. Seed Payers
        payers_file = seed_dir / "payers.json"
        if payers_file.exists():
            with open(payers_file, "r", encoding="utf-8") as f:
                payers_data = json.load(f)

            for p_item in payers_data:
                existing = db.query(Payer).filter_by(id=p_item["id"]).first()
                if not existing:
                    payer = Payer(
                        id=p_item["id"],
                        name=p_item["name"],
                        payer_id=p_item["payer_id"],
                        timely_filing_days=p_item.get("timely_filing_days", 90),
                        requires_auth_for_advanced_imaging=p_item.get(
                            "requires_auth_for_advanced_imaging", True
                        ),
                    )
                    db.add(payer)
            db.commit()
            print(f"✓ Seeded {len(payers_data)} standard U.S. payers.")

        # 2. Seed Claims & Associated Entities
        claims_file = seed_dir / "claims.json"
        if claims_file.exists():
            with open(claims_file, "r", encoding="utf-8") as f:
                claims_data = json.load(f)

            for c_item in claims_data:
                existing_claim = db.query(Claim).filter_by(claim_number=c_item["claim_number"]).first()
                if existing_claim:
                    continue

                # Create Patient
                pat_info = c_item["patient"]
                dob_parts = [int(x) for x in pat_info["dob"].split("-")]
                patient = Patient(
                    first_name=pat_info["first_name"],
                    last_name=pat_info["last_name"],
                    date_of_birth=date(dob_parts[0], dob_parts[1], dob_parts[2]),
                    gender=pat_info["gender"],
                    member_id=pat_info["member_id"],
                )
                db.add(patient)
                db.flush()

                # Create Provider
                prv_info = c_item["provider"]
                provider = db.query(Provider).filter_by(npi=prv_info["npi"]).first()
                if not provider:
                    provider = Provider(
                        npi=prv_info["npi"],
                        name=prv_info["name"],
                        taxonomy_code=prv_info.get("taxonomy", "207Q00000X"),
                        tax_id="12-3456789",
                        in_network=prv_info.get("in_network", True),
                    )
                    db.add(provider)
                    db.flush()

                # Create Encounter
                s_date_parts = [int(x) for x in c_item["service_date"].split("-")]
                serv_date = date(s_date_parts[0], s_date_parts[1], s_date_parts[2])
                encounter = Encounter(
                    patient_id=patient.id,
                    provider_id=provider.id,
                    service_date=serv_date,
                    place_of_service="11",
                    primary_diagnosis_code=c_item["primary_diagnosis"],
                    secondary_diagnosis_codes=c_item.get("secondary_diagnoses", []),
                    clinical_notes=c_item.get("scenario", "Clinical encounter notes."),
                )
                db.add(encounter)
                db.flush()

                # Create Claim
                f_date_parts = [int(x) for x in c_item["filing_deadline"].split("-")]
                filing_date = date(f_date_parts[0], f_date_parts[1], f_date_parts[2])
                claim = Claim(
                    id=c_item["id"],
                    claim_number=c_item["claim_number"],
                    patient_id=patient.id,
                    provider_id=provider.id,
                    payer_id=c_item["payer_id"],
                    encounter_id=encounter.id,
                    status=c_item.get("status", "DRAFT"),
                    total_billed_amount=c_item["total_billed_amount"],
                    service_date=serv_date,
                    filing_deadline=filing_date,
                )
                db.add(claim)
                db.flush()

                # Create Lines
                for l_item in c_item.get("lines", []):
                    line = ClaimLine(
                        claim_id=claim.id,
                        line_number=l_item["line_number"],
                        cpt_code=l_item["cpt_code"],
                        modifiers=l_item.get("modifiers", []),
                        diagnosis_pointers=[1],
                        units=l_item.get("units", 1),
                        unit_price=l_item["unit_price"],
                        total_amount=l_item["total_amount"],
                    )
                    db.add(line)

                # Create Risk Score if available
                if "risk_score" in c_item:
                    score = c_item["risk_score"]
                    level = c_item.get("risk_level", "LOW")
                    risk = RiskScore(
                        claim_id=claim.id,
                        overall_score=score,
                        risk_level=level,
                        eligibility_subscore=0,
                        authorization_subscore=80 if level == "HIGH" else 0,
                        coverage_subscore=20 if level == "HIGH" else 0,
                        quality_subscore=10 if level == "HIGH" else 0,
                        calculated_at=datetime.utcnow(),
                    )
                    db.add(risk)

            db.commit()
            print(f"✓ Seeded {len(claims_data)} synthetic clinical encounters and CMS-1500 claims.")

        print("🎉 Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Database seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
