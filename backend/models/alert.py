from datetime import datetime
from . import db

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    incident_id = db.Column(db.String(50), db.ForeignKey('incidents.incident_id', ondelete='SET NULL'), nullable=True, index=True)
    camera_id = db.Column(db.String(50), db.ForeignKey('cameras.camera_id', ondelete='CASCADE'), nullable=False, index=True)
    
    detection_type = db.Column(db.String(100), nullable=False)  # PERSON, VEHICLE, INTRUSION, SUSPICIOUS_MOVEMENT, WEAPON, MULTI_PERSON
    message = db.Column(db.String(255), nullable=False)
    confidence = db.Column(db.Float, nullable=False, default=90.0)
    risk_score = db.Column(db.Integer, default=75)
    priority = db.Column(db.String(50), nullable=False, default='HIGH')  # CRITICAL, HIGH, MEDIUM, LOW
    movement_direction = db.Column(db.String(50), default='NORTH_EAST')
    
    status = db.Column(db.String(50), nullable=False, default='ACTIVE')  # ACTIVE, RESOLVED, DISMISSED
    snapshot_url = db.Column(db.String(255), default='')
    resolved_by = db.Column(db.String(100), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        cam = self.camera
        return {
            'id': self.id,
            'alert_id': self.alert_id,
            'incident_id': self.incident_id,
            'camera_id': self.camera_id,
            'camera_name': cam.name if cam else self.camera_id,
            'sector': cam.sector if cam else 'Sector A',
            'location_name': cam.location_name if cam else 'Border Perimeter',
            'latitude': cam.latitude if cam else 0.0,
            'longitude': cam.longitude if cam else 0.0,
            'detection_type': self.detection_type,
            'message': self.message,
            'confidence': round(self.confidence, 1),
            'risk_score': self.risk_score,
            'priority': self.priority,
            'movement_direction': self.movement_direction,
            'status': self.status,
            'snapshot_url': self.snapshot_url,
            'resolved_by': self.resolved_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time': self.created_at.strftime('%I:%M %p') if self.created_at else ''
        }
