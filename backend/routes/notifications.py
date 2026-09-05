from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
def get_notifications():
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = request.args.get('limit', 20, type=int)

    query = Notification.query
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = Notification.query.filter_by(is_read=False).count()

    return jsonify({
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifications]
    }), 200

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
def mark_as_read(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read', 'notification': notif.to_dict()}), 200

@notifications_bp.route('/read-all', methods=['PUT'])
def mark_all_as_read():
    Notification.query.filter_by(is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/<int:notif_id>', methods=['DELETE'])
def delete_notification(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    db.session.delete(notif)
    db.session.commit()
    return jsonify({'message': 'Notification deleted'}), 200
