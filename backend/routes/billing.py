
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from db import db
from models import Bill, Pooja, PoojaItem, InventoryItem, InventoryTransaction, to_decimal


bp = Blueprint("billing", __name__, url_prefix="/api/bills")


@bp.post("/create")
@jwt_required()
def create_bill():
    data = request.get_json(silent=True) or {}
    pooja_id = data.get("pooja_id")
    devotee_name = (data.get("devotee_name") or "").strip()
    notes = (data.get("notes") or "").strip() or None

    if not pooja_id:
        return jsonify({"error": "pooja_id required"}), 400
    if not devotee_name:
        return jsonify({"error": "devotee_name required"}), 400

    pooja = Pooja.query.get_or_404(pooja_id)
    if not pooja.is_active:
        return jsonify({"error": "pooja is inactive"}), 400

    # Load assigned items
    pooja_items = (
        PoojaItem.query.filter_by(pooja_id=pooja.id)
        .join(InventoryItem, InventoryItem.id == PoojaItem.item_id)
        .with_entities(
            PoojaItem.item_id,
            PoojaItem.quantity_used,
            InventoryItem.current_stock,
            InventoryItem.cost_per_unit,
            InventoryItem.name,
            InventoryItem.unit,
        )
        .all()
    )

    # Validate stock availability
    for pi in pooja_items:
        qty_used = to_decimal(pi.quantity_used)
        if qty_used <= 0:
            continue
        if to_decimal(pi.current_stock) < qty_used:
            return (
                jsonify(
                    {
                        "error": "insufficient stock",
                        "item_id": pi.item_id,
                        "item_name": pi.name,
                        "required": float(qty_used),
                        "available": float(pi.current_stock),
                        "unit": pi.unit,
                    }
                ),
                409,
            )

    # Transaction: create bill + deduct inventory + write audit trail
    try:
        amount = to_decimal(pooja.price)
        bill = Bill(pooja_id=pooja.id, devotee_name=devotee_name, amount=amount, notes=notes)
        db.session.add(bill)
        db.session.flush()  # get bill.id without committing

        total_cost = to_decimal(0)
        used_items_payload = []

        for pi in pooja_items:
            qty_used = to_decimal(pi.quantity_used)
            if qty_used <= 0:
                continue

            item = InventoryItem.query.get(pi.item_id)
            item.current_stock = to_decimal(item.current_stock) - qty_used

            cost = qty_used * to_decimal(item.cost_per_unit)
            total_cost += cost

            db.session.add(
                InventoryTransaction(
                    item_id=item.id,
                    bill_id=bill.id,
                    quantity_change=-qty_used,
                    note=f"Deduct for bill #{bill.id} ({pooja.name})",
                )
            )

            used_items_payload.append(
                {
                    "item_id": item.id,
                    "item_name": item.name,
                    "unit": item.unit,
                    "quantity_used": float(qty_used),
                    "cost": float(cost),
                }
            )

        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return (
        jsonify(
            {
                "bill": {
                    "id": bill.id,
                    "pooja_id": pooja.id,
                    "pooja_name": pooja.name,
                    "devotee_name": bill.devotee_name,
                    "amount": float(bill.amount),
                    "notes": bill.notes,
                    "created_at": bill.created_at.isoformat(),
                },
                "items_used": used_items_payload,
                "total_cost": float(total_cost),
                "profit": float(to_decimal(bill.amount) - total_cost),
            }
        ),
        201,
    )


@bp.get("/history")
@jwt_required()
def history():
    # Optional date filter: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    from_s = (request.args.get("from") or "").strip()
    to_s = (request.args.get("to") or "").strip()

    q = Bill.query.join(Pooja, Pooja.id == Bill.pooja_id)

    def _parse_date(s: str):
        return datetime.strptime(s, "%Y-%m-%d")

    if from_s:
        dt_from = _parse_date(from_s)
        q = q.filter(Bill.created_at >= dt_from)
    if to_s:
        dt_to = _parse_date(to_s)
        # include whole day by advancing to next day midnight
        q = q.filter(Bill.created_at < (dt_to + timedelta(days=1)))

    bills = q.order_by(Bill.created_at.desc()).limit(500).all()
    return jsonify(
        [
            {
                "id": b.id,
                "pooja_id": b.pooja_id,
                "pooja_name": b.pooja.name,
                "devotee_name": b.devotee_name,
                "amount": float(b.amount),
                "notes": b.notes,
                "created_at": b.created_at.isoformat(),
            }
            for b in bills
        ]
    )

