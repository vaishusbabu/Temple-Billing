
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt

from db import db
from models import InventoryItem, InventoryTransaction, to_decimal


bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _require_admin():
    claims = get_jwt() or {}
    if claims.get("role") != "admin":
        return jsonify({"error": "admin only"}), 403
    return None


@bp.get("")
@jwt_required()
def list_inventory():
    items = InventoryItem.query.order_by(InventoryItem.name.asc()).all()
    return jsonify(
        [
            {
                "id": i.id,
                "name": i.name,
                "unit": i.unit,
                "current_stock": float(i.current_stock),
                "cost_per_unit": float(i.cost_per_unit),
                "minimum_stock_alert": float(i.minimum_stock_alert),
                "is_low": i.current_stock < i.minimum_stock_alert,
            }
            for i in items
        ]
    )


@bp.post("/add")
@jwt_required()
def add_item():
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    unit = (data.get("unit") or "").strip()
    if not name or not unit:
        return jsonify({"error": "name and unit required"}), 400

    if InventoryItem.query.filter_by(name=name).first():
        return jsonify({"error": "inventory item already exists"}), 409

    item = InventoryItem(
        name=name,
        unit=unit,
        current_stock=to_decimal(data.get("current_stock")),
        cost_per_unit=to_decimal(data.get("cost_per_unit")),
        minimum_stock_alert=to_decimal(data.get("minimum_stock_alert")),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"id": item.id}), 201


@bp.put("/<int:item_id>")
@jwt_required()
def update_item(item_id: int):
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name required"}), 400
        existing = InventoryItem.query.filter(
            InventoryItem.name == name, InventoryItem.id != item.id
        ).first()
        if existing:
            return jsonify({"error": "inventory item already exists"}), 409
        item.name = name

    if "unit" in data:
        unit = (data.get("unit") or "").strip()
        if not unit:
            return jsonify({"error": "unit required"}), 400
        item.unit = unit

    if "cost_per_unit" in data:
        item.cost_per_unit = to_decimal(data.get("cost_per_unit"))

    if "minimum_stock_alert" in data:
        item.minimum_stock_alert = to_decimal(data.get("minimum_stock_alert"))

    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/restock")
@jwt_required()
def restock():
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    data = request.get_json(silent=True) or {}
    item_id = data.get("item_id")
    qty = to_decimal(data.get("quantity_added"))
    note = (data.get("note") or "").strip() or "Restock"
    if not item_id:
        return jsonify({"error": "item_id required"}), 400
    if qty <= 0:
        return jsonify({"error": "quantity_added must be > 0"}), 400

    item = InventoryItem.query.get_or_404(item_id)

    if "cost_per_unit" in data and data.get("cost_per_unit") is not None:
        item.cost_per_unit = to_decimal(data.get("cost_per_unit"))

    item.current_stock = to_decimal(item.current_stock) + qty
    tx = InventoryTransaction(item_id=item.id, bill_id=None, quantity_change=qty, note=note)
    db.session.add(tx)
    db.session.commit()
    return jsonify({"ok": True, "current_stock": float(item.current_stock)})

