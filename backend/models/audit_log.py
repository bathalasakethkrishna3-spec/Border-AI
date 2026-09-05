from datetime import datetime
from . import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    username = db.Column(db.String(80), default='System')
    action = db.Column(db.String(100), nullable=False)  # USER_LOGIN, CAMERA_ADDED, ALERT_RESOLVED, THRESHOLD_UPDATED
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), default='127.0.0.1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }
