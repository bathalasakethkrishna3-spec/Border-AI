from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.alert import Alert
from models.camera import Camera
from models.notification import Notification
from models.audit_log import AuditLog
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

    alert.status = 'RESOLVED'
    alert.resolved_by = username
    alert.resolved_at = datetime.utcnow()

    # Re-evaluate camera status if no other active HIGH alerts exist
    active_high_alerts = Alert.query.filter_by(camera_id=alert.camera_id, status='ACTIVE', priority='HIGH').count()
    active_med_alerts = Alert.query.filter_by(camera_id=alert.camera_id, status='ACTIVE', priority='MEDIUM').count()
    
    camera = Camera.query.filter_by(camera_id=alert.camera_id).first()
    if camera:
        if active_high_alerts == 0 and active_med_alerts == 0:
            camera.status = 'ONLINE'
        elif active_high_alerts == 0:
            camera.status = 'SUSPICIOUS'

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

    active_alerts = Alert.query.filter_by(status='ACTIVE').all()
    count = len(active_alerts)

    for alert in active_alerts:
        alert.status = 'RESOLVED'
        alert.resolved_by = username
        alert.resolved_at = datetime.utcnow()

    # Set all cameras back to ONLINE
    cameras = Camera.query.filter(Camera.status.in_(['ALERT', 'SUSPICIOUS'])).all()
    for c in cameras:
        c.status = 'ONLINE'

    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='ALL_ALERTS_RESOLVED',
        details=f"Batch resolved {count} active alerts by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'{count} active alerts resolved'}), 200

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
