"""
SQLAlchemy ORM models and SQLite database setup.
Data persists across server restarts in materials.db.
"""

import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = "sqlite:///./materials.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MaterialRecord(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, index=True)
    cpse = Column(String, index=True)
    erp_system = Column(String, default="SAP S/4HANA")
    material_code = Column(String, index=True)
    raw_description = Column(Text)
    description = Column(Text)
    standardized_description = Column(Text)
    attributes_json = Column(Text, default="{}")
    category = Column(String, index=True)
    uom = Column(String, default="EA")
    stock_qty = Column(Integer, default=0)
    annual_procurement_qty = Column(Integer, default=0)
    unit_price_inr = Column(Float, default=0.0)
    location = Column(String, default="")
    suggested_cnmc = Column(String, default="")
    unspsc_code = Column(String, default="")
    hsn_code = Column(String, default="")
    status = Column(String, default="UNHARMONIZED", index=True)


class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String)
    cpse = Column(String)
    action = Column(String)
    details = Column(Text)
    cnmc_code = Column(String, default="")
    affected_codes_json = Column(Text, default="[]")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency for DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def material_to_dict(m: MaterialRecord) -> dict:
    try:
        attributes = json.loads(m.attributes_json or "{}")
    except Exception:
        attributes = {}
    return {
        "id": m.id,
        "cpse": m.cpse,
        "erp_system": m.erp_system,
        "material_code": m.material_code,
        "raw_description": m.raw_description,
        "description": m.description,
        "standardized_description": m.standardized_description,
        "attributes": attributes,
        "category": m.category,
        "uom": m.uom,
        "stock_qty": m.stock_qty,
        "annual_procurement_qty": m.annual_procurement_qty,
        "unit_price_inr": m.unit_price_inr,
        "location": m.location,
        "suggested_cnmc": m.suggested_cnmc,
        "unspsc_code": m.unspsc_code,
        "hsn_code": m.hsn_code,
        "status": m.status,
    }


def audit_to_dict(a: AuditLogRecord) -> dict:
    try:
        affected = json.loads(a.affected_codes_json or "[]")
    except Exception:
        affected = []
    return {
        "id": a.id,
        "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else "",
        "actor": a.actor,
        "cpse": a.cpse,
        "action": a.action,
        "details": a.details,
        "cnmc_code": a.cnmc_code,
        "affected_material_codes": affected,
    }


def seed_database(db: Session):
    """Seed the DB from seed_data.py if the table is empty."""
    from seed_data import load_seed_materials
    from ai_normalizer import extract_attributes

    if db.query(MaterialRecord).count() > 0:
        return

    for m in load_seed_materials():
        attrs = m.get("attributes") or extract_attributes(m.get("description", ""))
        record = MaterialRecord(
            id=m["id"],
            cpse=m.get("cpse", ""),
            erp_system=m.get("erp_system", "SAP S/4HANA"),
            material_code=m.get("material_code", ""),
            raw_description=m.get("raw_description", m.get("description", "")),
            description=m.get("description", ""),
            standardized_description=m.get("standardized_description", ""),
            attributes_json=json.dumps(attrs),
            category=m.get("category", "General"),
            uom=m.get("uom", "EA"),
            stock_qty=int(m.get("stock_qty", 0)),
            annual_procurement_qty=int(m.get("annual_procurement_qty", 0)),
            unit_price_inr=float(m.get("unit_price_inr", 0.0)),
            location=m.get("location", ""),
            suggested_cnmc=m.get("suggested_cnmc", ""),
            unspsc_code=m.get("unspsc_code", ""),
            hsn_code=m.get("hsn_code", ""),
            status=m.get("status", "UNHARMONIZED"),
        )
        db.add(record)

    for log in [
        AuditLogRecord(
            id="audit-001",
            timestamp=datetime(2026, 9, 16, 10, 15, 30),
            actor="System Automation Engine (AI)",
            cpse="National Master Consortium",
            action="CORPUS_INDEXED",
            details="Indexed legacy material master records across 6 CPSEs.",
            cnmc_code="SYSTEM-INIT",
            affected_codes_json="[]",
        ),
        AuditLogRecord(
            id="audit-002",
            timestamp=datetime(2026, 9, 16, 11, 30, 12),
            actor="Dr. R. K. Verma (Chief Materials Officer, ONGC)",
            cpse="ONGC",
            action="APPROVE_MAPPING",
            details="Validated AI recommendation for 2-inch SS-316 Ball Valve Class 150 RF.",
            cnmc_code="CNMC-ENG-PIP-VLV-BL-SS316-DN50-C150-0001",
            affected_codes_json="[]",
        ),
    ]:
        db.add(log)

    db.commit()
