from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.alert import Alert
from models.camera import Camera
from models.incident import Incident, IncidentTimeline
from models.notification import Notification
from models.audit_log import AuditLog
from services.detection_service import DetectionService
from utils.auth_helper import jwt_required_custom

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
def get_alerts():
    priority = request.args.get('priority')
    status = request.args.get('status')
    camera_id = request.args.get('camera_id')
    sector = request.args.get('sector')
    limit = request.args.get('limit', type=int)

    query = Alert.query

    if priority and priority != 'ALL':
        query = query.filter_by(priority=priority)
    if status and status != 'ALL':
        query = query.filter_by(status=status)
    if camera_id and camera_id != 'ALL':
        query = query.filter_by(camera_id=camera_id)
    if sector and sector != 'ALL':
        query = query.join(Camera, Alert.camera_id == Camera.camera_id).filter(Camera.sector == sector)

    query = query.order_by(Alert.created_at.desc())
    
    if limit:
        query = query.limit(limit)

    alerts = query.all()
    return jsonify([a.to_dict() for a in alerts]), 200

@alerts_bp.route('/<identifier>', methods=['GET'])
def get_alert(identifier):
    if identifier.isdigit():
        alert = Alert.query.get(int(identifier))
    else:
        alert = Alert.query.filter_by(alert_id=identifier).first()

    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    return jsonify(alert.to_dict()), 200

@alerts_bp.route('/<identifier>/resolve', methods=['POST'])
@jwt_required_custom
def resolve_alert(identifier):
    if identifier.isdigit():
        alert = Alert.query.get(int(identifier))
    else:
        alert = Alert.query.filter_by(alert_id=identifier).first()

    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    now = datetime.utcnow()

    alert.status = 'RESOLVED'
    alert.resolved_by = username
    alert.resolved_at = now

    # Synchronize linked Incident
    if alert.incident_id:
        incident = Incident.query.filter_by(incident_id=alert.incident_id).first()
        if incident and incident.status != 'RESOLVED':
            incident.status = 'RESOLVED'
            incident.resolved_by = username
            incident.resolved_at = now
            incident.resolution_notes = f"Threat resolved via Smart Alerts by {username}."

            timeline_event = IncidentTimeline(
                incident_id=incident.incident_id,
                timestamp=now,
                event_title="Threat Alert Resolved",
                event_description=f"Alert {alert.alert_id} marked resolved by {username}. Incident cleared.",
                event_type="RESOLUTION",
                actor=username
            )
            db.session.add(timeline_event)

        # Also resolve any other active alerts sharing this incident
        Alert.query.filter(
            Alert.incident_id == alert.incident_id,
            Alert.id != alert.id,
            Alert.status == 'ACTIVE'
        ).update({'status': 'RESOLVED', 'resolved_by': username, 'resolved_at': now})

    # Re-evaluate camera status dynamically
    camera = Camera.query.filter_by(camera_id=alert.camera_id).first()
    if camera:
        camera.sync_status()

    # Notification & Audit
    notif = Notification(
        title="Alert Resolved",
        message=f"Threat {alert.alert_id} at {alert.camera_id} was resolved by {username}.",
        type="INFO",
        camera_id=alert.camera_id
    )
    db.session.add(notif)

    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='ALERT_RESOLVED',
        details=f"Alert {alert.alert_id} ({alert.detection_type}) resolved by {username}."
    )
    db.session.add(audit)

    db.session.commit()
    return jsonify({'message': f'Alert {alert.alert_id} resolved successfully', 'alert': alert.to_dict()}), 200

@alerts_bp.route('/resolve-all', methods=['POST'])
@jwt_required_custom
def resolve_all_alerts():
    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    now = datetime.utcnow()

    active_alerts = Alert.query.filter_by(status='ACTIVE').all()
    count = len(active_alerts)

    for alert in active_alerts:
        alert.status = 'RESOLVED'
        alert.resolved_by = username
        alert.resolved_at = now
        if alert.incident_id:
            incident = Incident.query.filter_by(incident_id=alert.incident_id).first()
            if incident and incident.status != 'RESOLVED':
                incident.status = 'RESOLVED'
                incident.resolved_by = username
                incident.resolved_at = now
                incident.resolution_notes = f"Batch resolved via Smart Alerts by {username}."
                db.session.add(IncidentTimeline(
                    incident_id=incident.incident_id,
                    timestamp=now,
                    event_title="Batch Alert Resolution",
                    event_description=f"Batch resolved by {username}.",
                    event_type="RESOLUTION",
                    actor=username
                ))

    # Also resolve any remaining active incidents
    remaining_incs = Incident.query.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).all()
    for inc in remaining_incs:
        inc.status = 'RESOLVED'
        inc.resolved_by = username
        inc.resolved_at = now
        inc.resolution_notes = f"Batch resolved via Smart Alerts by {username}."

    # Sync all camera statuses
    all_cameras = Camera.query.all()
    for c in all_cameras:
        c.sync_status()

    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='ALL_ALERTS_RESOLVED',
        details=f"Batch resolved {count} active alerts by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'{count} active alerts resolved'}), 200

@alerts_bp.route('/simulate', methods=['POST'])
@jwt_required_custom
def simulate_alert():
    """Trigger an intrusion simulation that generates connected Detection, Incident, Alert, and Camera state."""
    data = request.get_json() or {}
    camera_id = data.get('camera_id', 'CAM-01')
    object_type = data.get('object_type', 'PERSON')
    confidence = float(data.get('confidence', 95.0))
    person_count = int(data.get('person_count', 1))

    camera = Camera.query.filter_by(camera_id=camera_id).first()
    rz = camera.get_restricted_zone() if camera else {'x': 0.65, 'y': 0.25, 'w': 0.30, 'h': 0.50}
    sim_data = {
        'camera_id': camera_id,
        'object_type': object_type,
        'confidence': confidence,
        'person_count': person_count,
        'bbox': {
            'x': float(rz.get('x', 0.65)) + 0.05,
            'y': float(rz.get('y', 0.25)) + 0.05,
            'w': 0.15,
            'h': 0.30
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    try:
        result = DetectionService.process_detection(sim_data)
        return jsonify({
            'message': f'Simulated {object_type} threat alert on {camera_id}',
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@alerts_bp.route('/<identifier>', methods=['DELETE'])
@jwt_required_custom
def delete_alert(identifier):
    if identifier.isdigit():
        alert = Alert.query.get(int(identifier))
    else:
        alert = Alert.query.filter_by(alert_id=identifier).first()

    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    alt_id = alert.alert_id
    db.session.delete(alert)

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='ALERT_DELETED',
        details=f"Alert {alt_id} deleted by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'Alert {alt_id} deleted successfully'}), 200
