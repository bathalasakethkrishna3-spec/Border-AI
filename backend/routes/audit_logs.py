from flask import Blueprint, request, jsonify
from models.audit_log import AuditLog
from utils.auth_helper import jwt_required_custom

audit_logs_bp = Blueprint('audit_logs', __name__, url_prefix='/api/audit-logs')

@audit_logs_bp.route('', methods=['GET'])
@jwt_required_custom
def get_audit_logs():
    action = request.args.get('action')
    username = request.args.get('username')
    limit = request.args.get('limit', 50, type=int)

    query = AuditLog.query
    if action and action != 'ALL':
        query = query.filter_by(action=action)
    if username:
        query = query.filter(AuditLog.username.ilike(f'%{username}%'))

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return jsonify([l.to_dict() for l in logs]), 200
