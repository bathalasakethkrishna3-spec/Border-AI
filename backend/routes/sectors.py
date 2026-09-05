from flask import Blueprint, request, jsonify
from models import db
from models.sector import Sector
from models.camera import Camera
from models.incident import Incident
from utils.auth_helper import jwt_required_custom

sectors_bp = Blueprint('sectors', __name__, url_prefix='/api/sectors')

@sectors_bp.route('', methods=['GET'])
def get_sectors():
    sectors = Sector.query.order_by(Sector.sector_id.asc()).all()
    return jsonify([s.to_dict(include_cameras=True, include_incidents=True) for s in sectors]), 200

@sectors_bp.route('/<identifier>', methods=['GET'])
def get_sector(identifier):
    # Support lookup by DB ID or sector_id (e.g. "Sector B" or "Sector-B" or "SEC-B")
    if identifier.isdigit():
        sector = Sector.query.get(int(identifier))
    else:
        # Normalize string: e.g. "Sector-B" -> "Sector B"
        normalized = identifier.replace('-', ' ')
        sector = Sector.query.filter(
            (Sector.sector_id.ilike(identifier)) | (Sector.sector_id.ilike(normalized))
        ).first()

    if not sector:
        return jsonify({'error': f'Sector "{identifier}" not found'}), 404

    return jsonify(sector.to_dict(include_cameras=True, include_incidents=True)), 200

@sectors_bp.route('/<identifier>/cameras', methods=['GET'])
def get_sector_cameras(identifier):
    normalized = identifier.replace('-', ' ')
    sector = Sector.query.filter(
        (Sector.sector_id.ilike(identifier)) | (Sector.sector_id.ilike(normalized))
    ).first()

    if not sector:
        return jsonify({'error': 'Sector not found'}), 404

    cameras = Camera.query.filter_by(sector=sector.sector_id).all()
    return jsonify([c.to_dict(include_active_incident=True) for c in cameras]), 200

@sectors_bp.route('/<identifier>/incidents', methods=['GET'])
def get_sector_incidents(identifier):
    normalized = identifier.replace('-', ' ')
    sector = Sector.query.filter(
        (Sector.sector_id.ilike(identifier)) | (Sector.sector_id.ilike(normalized))
    ).first()

    if not sector:
        return jsonify({'error': 'Sector not found'}), 404

    incidents = Incident.query.filter_by(sector=sector.sector_id)\
        .order_by(Incident.detection_time.desc()).all()
    return jsonify([inc.to_dict(include_timeline=True) for inc in incidents]), 200
