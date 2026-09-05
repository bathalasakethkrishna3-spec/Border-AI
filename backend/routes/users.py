from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.audit_log import AuditLog
from utils.auth_helper import jwt_required_custom, admin_required_custom

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@jwt_required_custom
def get_users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@users_bp.route('', methods=['POST'])
@admin_required_custom
def create_user():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'Operator').strip()
    full_name = data.get('full_name', '').strip()
    badge_number = data.get('badge_number', '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    new_user = User(
        username=username,
        email=email,
        role=role,
        full_name=full_name,
        badge_number=badge_number
    )
    new_user.set_password(password)
    db.session.add(new_user)

    audit = AuditLog(
        user_id=request.current_user.id,
        username=request.current_user.username,
        action='USER_CREATED',
        details=f"New user account '{username}' created with role '{role}'."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required_custom
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'role' in data:
        user.role = data['role'].strip()
    if 'badge_number' in data:
        user.badge_number = data['badge_number'].strip()
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    audit = AuditLog(
        user_id=request.current_user.id,
        username=request.current_user.username,
        action='USER_UPDATED',
        details=f"User '{user.username}' account details updated."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'User updated successfully', 'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required_custom
def delete_user(user_id):
    if user_id == request.current_user.id:
        return jsonify({'error': 'Cannot delete your own active account'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    uname = user.username
    db.session.delete(user)

    audit = AuditLog(
        user_id=request.current_user.id,
        username=request.current_user.username,
        action='USER_DELETED',
        details=f"User account '{uname}' deleted."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'User {uname} deleted'}), 200
