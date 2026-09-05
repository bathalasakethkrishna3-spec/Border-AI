from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.incident import Incident, IncidentTimeline
from models.camera import Camera
from models.alert import Alert
from models.notification import Notification
from models.audit_log import AuditLog
from utils.auth_helper import jwt_required_custom

incidents_bp = Blueprint('incidents', __name__, url_prefix='/api/incidents')

@incidents_bp.route('', methods=['GET'])
def get_incidents():
    status = request.args.get('status')
    risk_level = request.args.get('risk_level')
    camera_id = request.args.get('camera_id')
    sector = request.args.get('sector')
    detection_type = request.args.get('detection_type')
    limit = request.args.get('limit', type=int)

    query = Incident.query

    if status and status != 'ALL':
        if status == 'UNRESOLVED':
            query = query.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION']))
        else:
            query = query.filter_by(status=status)

    if risk_level and risk_level != 'ALL':
        query = query.filter_by(risk_level=risk_level)

    if camera_id and camera_id != 'ALL':
        query = query.filter_by(camera_id=camera_id)

    if sector and sector != 'ALL':
        query = query.join(Camera, Incident.camera_id == Camera.camera_id).filter(Camera.sector == sector)

    if detection_type and detection_type != 'ALL':
        query = query.filter_by(detection_type=detection_type)

    query = query.order_by(Incident.detection_time.desc())

    if limit:
        query = query.limit(limit)

    incidents = query.all()
    return jsonify([inc.to_dict(include_timeline=True) for inc in incidents]), 200

@incidents_bp.route('/<identifier>', methods=['GET'])
def get_incident(identifier):
    if identifier.isdigit():
        incident = Incident.query.get(int(identifier))
    else:
        incident = Incident.query.filter_by(incident_id=identifier).first()

    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    return jsonify(incident.to_dict(include_timeline=True)), 200

@incidents_bp.route('/camera/<camera_id>/active', methods=['GET'])
def get_active_incident_for_camera(camera_id):
    """
    CRITICAL CAMERA OPENING ENDPOINT:
    Returns the latest unresolved incident (NEW, ACKNOWLEDGED, UNDER_INVESTIGATION)
    for this camera. If none exists, returns { "has_active_incident": false }.
    """
    camera = Camera.query.filter_by(camera_id=camera_id).first()
    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    active_inc = camera.get_latest_unresolved_incident()
    if not active_inc:
        return jsonify({
            'has_active_incident': False,
            'camera_id': camera_id,
            'status': camera.status,
            'message': 'No active unresolved incidents for this camera.'
        }), 200

    return jsonify({
        'has_active_incident': True,
        'incident': active_inc.to_dict(include_timeline=True),
        'camera': camera.to_dict(include_active_incident=False)
    }), 200

@incidents_bp.route('/<identifier>/acknowledge', methods=['POST'])
@jwt_required_custom
def acknowledge_incident(identifier):
    if identifier.isdigit():
        incident = Incident.query.get(int(identifier))
    else:
        incident = Incident.query.filter_by(incident_id=identifier).first()

    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    user = getattr(request, 'current_user', None)
    username = user.full_name or user.username if user else 'Operator'

    incident.status = 'ACKNOWLEDGED'
    incident.acknowledged_by = username
    incident.acknowledged_at = datetime.utcnow()

    # Add Timeline Event
    timeline_event = IncidentTimeline(
        incident_id=incident.incident_id,
        timestamp=datetime.utcnow(),
        event_title="Incident Acknowledged",
        event_description=f"Operator {username} acknowledged the intrusion alarm.",
        event_type="ACKNOWLEDGE",
        actor=username
    )
    db.session.add(timeline_event)

    audit = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else 'Operator',
        action='INCIDENT_ACKNOWLEDGED',
        details=f"Incident {incident.incident_id} acknowledged by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Incident {incident.incident_id} acknowledged',
        'incident': incident.to_dict(include_timeline=True)
    }), 200

@incidents_bp.route('/<identifier>/investigate', methods=['POST'])
@jwt_required_custom
def mark_under_investigation(identifier):
    if identifier.isdigit():
        incident = Incident.query.get(int(identifier))
    else:
        incident = Incident.query.filter_by(incident_id=identifier).first()

    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    user = getattr(request, 'current_user', None)
    username = user.full_name or user.username if user else 'Operator'

    incident.status = 'UNDER_INVESTIGATION'
    incident.investigated_by = username
    incident.investigated_at = datetime.utcnow()

    # Add Timeline Event
    timeline_event = IncidentTimeline(
        incident_id=incident.incident_id,
        timestamp=datetime.utcnow(),
        event_title="Marked Under Investigation",
        event_description=f"Surveillance team dispatched to inspect {incident.camera_id} sector perimeter.",
        event_type="INVESTIGATION",
        actor=username
    )
    db.session.add(timeline_event)

    audit = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else 'Operator',
        action='INCIDENT_INVESTIGATING',
        details=f"Incident {incident.incident_id} marked under investigation by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Incident {incident.incident_id} under investigation',
        'incident': incident.to_dict(include_timeline=True)
    }), 200

@incidents_bp.route('/<identifier>/resolve', methods=['POST'])
@jwt_required_custom
def resolve_incident(identifier):
    if identifier.isdigit():
        incident = Incident.query.get(int(identifier))
    else:
        incident = Incident.query.filter_by(incident_id=identifier).first()

    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    # Extract notes from payload (dict, string, or default)
    notes = 'Perimeter sweep completed. Target identified or neutralized.'
    if request.is_json:
        req_data = request.get_json(silent=True)
        if isinstance(req_data, dict):
            notes = req_data.get('notes') or notes
        elif isinstance(req_data, str) and req_data.strip():
            notes = req_data.strip()

    user = getattr(request, 'current_user', None)
    username = user.full_name or user.username if user else 'Operator'

    incident.status = 'RESOLVED'
    incident.resolved_by = username
    incident.resolved_at = datetime.utcnow()
    incident.resolution_notes = notes

    # Resolve linked Alerts
    alerts = Alert.query.filter(
        db.or_(
            Alert.incident_id == incident.incident_id,
            db.and_(Alert.camera_id == incident.camera_id, Alert.status == 'ACTIVE')
        )
    ).all()
    for al in alerts:
        al.status = 'RESOLVED'
        al.resolved_by = username
        al.resolved_at = datetime.utcnow()

    # Re-evaluate camera status dynamically
    camera = Camera.query.filter_by(camera_id=incident.camera_id).first()
    if camera:
        camera.sync_status()

    # Add Timeline Event
    timeline_event = IncidentTimeline(
        incident_id=incident.incident_id,
        timestamp=datetime.utcnow(),
        event_title="Incident Resolved",
        event_description=f"Incident resolved by {username}. Notes: {notes}",
        event_type="RESOLUTION",
        actor=username
    )
    db.session.add(timeline_event)

    # Notification & Audit
    notif = Notification(
        title="Incident Resolved",
        message=f"Threat incident {incident.incident_id} at {incident.camera_id} marked as RESOLVED by {username}.",
        type="INFO",
        camera_id=incident.camera_id
    )
    db.session.add(notif)

    audit = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else 'Operator',
        action='INCIDENT_RESOLVED',
        details=f"Incident {incident.incident_id} resolved by {username}. Resolution: {notes}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Incident {incident.incident_id} resolved successfully',
        'incident': incident.to_dict(include_timeline=True)
    }), 200
