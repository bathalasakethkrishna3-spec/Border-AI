from datetime import datetime
from . import db

class Incident(db.Model):
    __tablename__ = 'incidents'

    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    camera_id = db.Column(db.String(50), db.ForeignKey('cameras.camera_id', ondelete='CASCADE'), nullable=False, index=True)
    video_upload_id = db.Column(db.String(50), db.ForeignKey('video_uploads.upload_id', ondelete='SET NULL'), nullable=True, index=True)
    
    sector = db.Column(db.String(50), nullable=False, default='Sector A', index=True)
    stage = db.Column(db.String(50), default='CONFIRMED_INTRUSION')
    zone_name = db.Column(db.String(100), default='Restricted Red Zone')
    video_timestamp = db.Column(db.String(50), default='00:00:00')
    video_timestamp_seconds = db.Column(db.Float, default=0.0)

    detection_type = db.Column(db.String(100), nullable=False)  # PERSON, VEHICLE, INTRUDER, WEAPON, MULTI_PERSON
    object_class = db.Column(db.String(50), default='Person')
    confidence = db.Column(db.Float, nullable=False, default=90.0)
    risk_score = db.Column(db.Integer, nullable=False, default=75)  # 0 to 100
    risk_level = db.Column(db.String(50), nullable=False, default='HIGH')  # LOW, MEDIUM, HIGH, CRITICAL
    
    movement_direction = db.Column(db.String(50), default='NORTH_EAST')  # NORTH, SOUTH, EAST, WEST, NORTH_EAST, etc.
    direction_description = db.Column(db.String(255), default='Moving towards restricted zone')
    restricted_zone_breached = db.Column(db.Boolean, default=True)
    person_count = db.Column(db.Integer, default=1)
    
    # 45s Buffered Video Clip Timestamps (15s before intrusion + detection moment + 30s after intrusion)
    start_time = db.Column(db.DateTime, nullable=False)   # 15s before
    detection_time = db.Column(db.DateTime, nullable=False) # Moment of breach
    end_time = db.Column(db.DateTime, nullable=False)     # 30s after
    
    video_clip_url = db.Column(db.String(255), default='')
    evidence_image_url = db.Column(db.String(255), default='')
    
    # Status workflow: NEW -> ACKNOWLEDGED -> UNDER_INVESTIGATION -> RESOLVED
    status = db.Column(db.String(50), nullable=False, default='NEW', index=True)
    
    # Workflow Audit Tracking
    acknowledged_by = db.Column(db.String(100), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    investigated_by = db.Column(db.String(100), nullable=True)
    investigated_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.String(100), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    timelines = db.relationship('IncidentTimeline', backref='incident', lazy='dynamic', cascade='all, delete-orphan', order_by='IncidentTimeline.timestamp.asc()')
    alerts = db.relationship('Alert', backref='incident_rel', lazy='dynamic')

    def to_dict(self, include_timeline=True):
        cam = self.camera
        sec_name = self.sector or (cam.sector if cam else 'Sector A')
        data = {
            'id': self.id,
            'incident_id': self.incident_id,
            'camera_id': self.camera_id,
            'camera_name': cam.name if cam else self.camera_id,
            'sector': sec_name,
            'stage': self.stage,
            'zone_name': self.zone_name,
            'video_timestamp': self.video_timestamp,
            'video_timestamp_seconds': self.video_timestamp_seconds,
            'video_upload_id': self.video_upload_id,
            'location_name': cam.location_name if cam else 'Border Perimeter',
            'latitude': cam.latitude if cam else 0.0,
            'longitude': cam.longitude if cam else 0.0,
            'detection_type': self.detection_type,
            'object_class': self.object_class,
            'confidence': round(self.confidence, 1),
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'movement_direction': self.movement_direction,
            'direction_description': self.direction_description,
            'restricted_zone_breached': self.restricted_zone_breached,
            'person_count': self.person_count,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'detection_time': self.detection_time.isoformat() if self.detection_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'formatted_time': self.detection_time.strftime('%I:%M:%S %p') if self.detection_time else '',
            'formatted_date': self.detection_time.strftime('%Y-%m-%d') if self.detection_time else '',
            'video_clip_url': self.video_clip_url,
            'evidence_image_url': self.evidence_image_url,
            'status': self.status,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'investigated_by': self.investigated_by,
            'investigated_at': self.investigated_at.isoformat() if self.investigated_at else None,
            'resolved_by': self.resolved_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_timeline:
            data['timeline'] = [t.to_dict() for t in self.timelines.all()]
        return data


class IncidentTimeline(db.Model):
    __tablename__ = 'incident_timelines'

    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.String(50), db.ForeignKey('incidents.incident_id', ondelete='CASCADE'), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    event_title = db.Column(db.String(150), nullable=False)
    event_description = db.Column(db.String(255), nullable=False)
    event_type = db.Column(db.String(50), default='DETECTION')  # MONITORING, DETECTION, ZONE_ENTRY, RISK_EVAL, ALERT_DISPATCH, ACKNOWLEDGE, INVESTIGATION, RESOLUTION
    actor = db.Column(db.String(100), default='AI Neural Engine')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_id': self.incident_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'time': self.timestamp.strftime('%H:%M:%S') if self.timestamp else '',
            'event_title': self.event_title,
            'event_description': self.event_description,
            'event_type': self.event_type,
            'actor': self.actor
        }
