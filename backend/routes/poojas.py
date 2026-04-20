
from decimal import Decimal

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt

from db import db
from models import Pooja, PoojaItem, InventoryItem, to_decimal


bp = Blueprint("poojas", __name__, url_prefix="/api/poojas")


def _require_admin():
    claims = get_jwt() or {}
    if claims.get("role") != "admin":
        return jsonify({"error": "admin only"}), 403
    return None


@bp.get("")
def list_active():
    poojas = Pooja.query.filter_by(is_active=True).order_by(Pooja.name.asc()).all()
    return jsonify(
        [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "is_active": p.is_active,
            }
            for p in poojas
        ]
    )


@bp.get("/all")
@jwt_required()
def list_all():
    admin_check = _require_admin()
    if admin_check:
        return admin_check
    poojas = Pooja.query.order_by(Pooja.name.asc()).all()
    return jsonify(
        [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "is_active": p.is_active,
                "items": [
                    {
                        "id": pi.id,
                        "item_id": pi.item_id,
                        "item_name": pi.item.name,
                        "unit": pi.item.unit,
                        "quantity_used": float(pi.quantity_used),
                    }
                    for pi in p.pooja_items
                ],
            }
            for p in poojas
        ]
    )


@bp.post("/add")
@jwt_required()
def add_pooja():
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name required"}), 400

    price = to_decimal(data.get("price"))
    description = (data.get("description") or "").strip() or None
    is_active = bool(data.get("is_active", True))

    if Pooja.query.filter_by(name=name).first():
        return jsonify({"error": "pooja name already exists"}), 409

    pooja = Pooja(name=name, price=price, description=description, is_active=is_active)
    db.session.add(pooja)
    db.session.commit()
    return jsonify({"id": pooja.id}), 201


@bp.put("/<int:pooja_id>")
@jwt_required()
def update_pooja(pooja_id: int):
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    pooja = Pooja.query.get_or_404(pooja_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name required"}), 400
        existing = Pooja.query.filter(Pooja.name == name, Pooja.id != pooja.id).first()
        if existing:
            return jsonify({"error": "pooja name already exists"}), 409
        pooja.name = name

    if "price" in data:
        pooja.price = to_decimal(data.get("price"))

    if "description" in data:
        pooja.description = (data.get("description") or "").strip() or None

    if "is_active" in data:
        pooja.is_active = bool(data.get("is_active"))

    db.session.commit()
    return jsonify({"ok": True})


@bp.delete("/<int:pooja_id>")
@jwt_required()
def delete_pooja(pooja_id: int):
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    pooja = Pooja.query.get_or_404(pooja_id)
    # soft delete via is_active false to preserve history
    pooja.is_active = False
    db.session.commit()
    return jsonify({"ok": True})


@bp.put("/<int:pooja_id>/items")
@jwt_required()
def set_pooja_items(pooja_id: int):
    admin_check = _require_admin()
    if admin_check:
        return admin_check

    pooja = Pooja.query.get_or_404(pooja_id)
    data = request.get_json(silent=True) or {}
    items = data.get("items") or []
    if not isinstance(items, list):
        return jsonify({"error": "items must be a list"}), 400

    # Replace all assigned items for simplicity.
    PoojaItem.query.filter_by(pooja_id=pooja.id).delete()

    for it in items:
        item_id = it.get("item_id")
        qty = to_decimal(it.get("quantity_used"))
        if not item_id:
            db.session.rollback()
            return jsonify({"error": "item_id required"}), 400
        inv = InventoryItem.query.get(item_id)
        if not inv:
            db.session.rollback()
            return jsonify({"error": f"inventory item {item_id} not found"}), 404
        db.session.add(PoojaItem(pooja_id=pooja.id, item_id=item_id, quantity_used=qty))

    db.session.commit()
    return jsonify({"ok": True})

