from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.audit_log import AuditLog
from utils.auth_helper import generate_token, jwt_required_custom

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Support login with either username or email
    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Contact administrator.'}), 403

    user.last_login = datetime.utcnow()
    token = generate_token(user)

    # Log audit
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action='USER_LOGIN',
        details=f"User {user.username} ({user.role}) logged in successfully.",
        ip_address=request.remote_addr or '127.0.0.1'
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required_custom
def logout():
    user = request.current_user
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action='USER_LOGOUT',
        details=f"User {user.username} logged out.",
        ip_address=request.remote_addr or '127.0.0.1'
    )
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required_custom
def me():
    return jsonify({'user': request.current_user.to_dict()}), 200
