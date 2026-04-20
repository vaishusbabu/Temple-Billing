
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, UniqueConstraint, func

from db import db


class Pooja(db.Model):
    __tablename__ = "poojas"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    unit = db.Column(db.String(30), nullable=False)  # kg/litre/piece/bundle
    current_stock = db.Column(db.Numeric(14, 3), nullable=False, default=0)
    cost_per_unit = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    minimum_stock_alert = db.Column(db.Numeric(14, 3), nullable=False, default=0)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PoojaItem(db.Model):
    __tablename__ = "pooja_items"
    __table_args__ = (
        UniqueConstraint("pooja_id", "item_id", name="uq_pooja_item"),
        CheckConstraint("quantity_used >= 0", name="ck_pooja_item_qty_nonneg"),
    )

    id = db.Column(db.Integer, primary_key=True)
    pooja_id = db.Column(db.Integer, db.ForeignKey("poojas.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_items.id"), nullable=False)
    quantity_used = db.Column(db.Numeric(14, 3), nullable=False, default=0)

    pooja = db.relationship("Pooja", backref=db.backref("pooja_items", lazy=True))
    item = db.relationship(
        "InventoryItem", backref=db.backref("pooja_items", lazy=True)
    )


class Bill(db.Model):
    __tablename__ = "bills"

    id = db.Column(db.Integer, primary_key=True)
    pooja_id = db.Column(db.Integer, db.ForeignKey("poojas.id"), nullable=False)
    devotee_name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    pooja = db.relationship("Pooja", backref=db.backref("bills", lazy=True))


class InventoryTransaction(db.Model):
    __tablename__ = "inventory_transactions"

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_items.id"), nullable=False)
    bill_id = db.Column(db.Integer, db.ForeignKey("bills.id"), nullable=True)
    quantity_change = db.Column(db.Numeric(14, 3), nullable=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    item = db.relationship(
        "InventoryItem", backref=db.backref("transactions", lazy=True)
    )
    bill = db.relationship("Bill", backref=db.backref("inventory_transactions", lazy=True))


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="admin")  # admin/staff
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


def to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def sum_bill_amount(query) -> Decimal:
    # helper for dashboard aggregation
    total = query.with_entities(func.coalesce(func.sum(Bill.amount), 0)).scalar()
    return to_decimal(total)

