from flask import Blueprint, request, jsonify
from models import db
from models.system_setting import SystemSetting
from models.audit_log import AuditLog
from utils.auth_helper import jwt_required_custom

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    settings = SystemSetting.query.all()
    # Return both as list and mapped dictionary for easy frontend access
    data_dict = {s.key: s.value for s in settings}
    return jsonify({
        'settings': [s.to_dict() for s in settings],
        'config': data_dict
    }), 200

@settings_bp.route('', methods=['PUT'])
@jwt_required_custom
def update_settings():
    data = request.get_json() or {}
    updated_keys = []

    for key, value in data.items():
        setting = SystemSetting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
            updated_keys.append(key)
        else:
            new_setting = SystemSetting(key=key, value=str(value), category='custom')
            db.session.add(new_setting)
            updated_keys.append(key)

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='SETTINGS_UPDATED',
        details=f"System settings updated: {', '.join(updated_keys)} by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    all_settings = SystemSetting.query.all()
    return jsonify({
        'message': 'Settings updated successfully',
        'config': {s.key: s.value for s in all_settings}
    }), 200
