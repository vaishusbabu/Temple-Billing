
from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from db import db
from models import Bill, InventoryTransaction, Pooja, to_decimal


bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("/summary")
@jwt_required()
def summary():
    now = datetime.now()
    start_today = datetime(now.year, now.month, now.day)
    start_month = datetime(now.year, now.month, 1)

    total_poojas_all = db.session.query(func.count(Bill.id)).scalar() or 0
    total_poojas_today = (
        db.session.query(func.count(Bill.id)).filter(Bill.created_at >= start_today).scalar()
        or 0
    )
    total_poojas_month = (
        db.session.query(func.count(Bill.id)).filter(Bill.created_at >= start_month).scalar()
        or 0
    )

    revenue = (
        db.session.query(func.coalesce(func.sum(Bill.amount), 0)).scalar()
        or 0
    )

    # Cost: sum of negative inventory transactions * item cost per unit is complex historically.
    # For MVP, compute cost using current item cost_per_unit at time of query by joining InventoryItem not stored.
    # Better later: store cost in tx row.
    # Here: approximate cost using tx.quantity_change * cost_per_unit (tx is negative for deductions).
    from models import InventoryItem  # local import to avoid circular

    cost = (
        db.session.query(
            func.coalesce(
                func.sum((-InventoryTransaction.quantity_change) * InventoryItem.cost_per_unit),
                0,
            )
        )
        .select_from(InventoryTransaction)
        .join(InventoryItem, InventoryItem.id == InventoryTransaction.item_id)
        .filter(InventoryTransaction.bill_id.isnot(None))
        .scalar()
        or 0
    )

    revenue_d = to_decimal(revenue)
    cost_d = to_decimal(cost)
    profit_d = revenue_d - cost_d

    return jsonify(
        {
            "total_poojas": {
                "all_time": int(total_poojas_all),
                "today": int(total_poojas_today),
                "this_month": int(total_poojas_month),
            },
            "totals": {
                "revenue": float(revenue_d),
                "cost": float(cost_d),
                "profit": float(profit_d),
            },
        }
    )


@bp.get("/popular")
@jwt_required()
def popular():
    rows = (
        db.session.query(Pooja.name, func.count(Bill.id))
        .join(Bill, Bill.pooja_id == Pooja.id)
        .group_by(Pooja.id)
        .order_by(func.count(Bill.id).desc())
        .limit(10)
        .all()
    )
    return jsonify([{"pooja_name": r[0], "count": int(r[1])} for r in rows])


@bp.get("/chart")
@jwt_required()
def chart():
    # ?range=30 (days)
    days = int(request.args.get("range") or 30)
    if days < 7:
        days = 7
    if days > 365:
        days = 365

    end = date.today()
    start = end - timedelta(days=days - 1)

    rows = (
        db.session.query(func.date(Bill.created_at).label("d"), func.sum(Bill.amount).label("rev"), func.count(Bill.id).label("cnt"))
        .filter(Bill.created_at >= datetime(start.year, start.month, start.day))
        .group_by(func.date(Bill.created_at))
        .order_by(func.date(Bill.created_at))
        .all()
    )

    # Fill missing dates with 0
    by_day = {str(r.d): {"revenue": float(r.rev or 0), "count": int(r.cnt or 0)} for r in rows}
    labels = []
    revenue = []
    counts = []
    cur = start
    while cur <= end:
        key = str(cur)
        labels.append(key)
        revenue.append(by_day.get(key, {}).get("revenue", 0))
        counts.append(by_day.get(key, {}).get("count", 0))
        cur = cur + timedelta(days=1)

    return jsonify({"labels": labels, "revenue": revenue, "counts": counts})

