from datetime import datetime
from . import db

class Detection(db.Model):
    __tablename__ = 'detections'

    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.String(50), db.ForeignKey('cameras.camera_id', ondelete='CASCADE'), nullable=False, index=True)
    video_upload_id = db.Column(db.String(50), db.ForeignKey('video_uploads.upload_id', ondelete='SET NULL'), nullable=True, index=True)
    tracking_id = db.Column(db.String(50), default='TRK-01')
    
    object_type = db.Column(db.String(100), nullable=False)  # PERSON, VEHICLE, MOTION, INTRUDER, WEAPON, MULTI_PERSON
    confidence = db.Column(db.Float, nullable=False)
    
    # 4-Stage Classification: NORMAL, SUSPICIOUS, PERIMETER, INTRUSION
    stage = db.Column(db.String(50), default='NORMAL')
    zone_name = db.Column(db.String(100), default='Normal Area')
    video_timestamp = db.Column(db.String(50), default='00:00:00') # Timestamp in video (e.g., 00:02:45)
    video_timestamp_seconds = db.Column(db.Float, default=0.0)
    
    # Bounding Box normalized coordinates [0.0 to 1.0]
    bbox_x = db.Column(db.Float, default=0.0)
    bbox_y = db.Column(db.Float, default=0.0)
    bbox_w = db.Column(db.Float, default=0.0)
    bbox_h = db.Column(db.Float, default=0.0)
    
    # Tracking & Geofencing properties
    movement_direction = db.Column(db.String(50), default='NORTH_EAST')
    is_in_restricted_zone = db.Column(db.Boolean, default=False)
    person_count = db.Column(db.Integer, default=1)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        cam = self.camera
        return {
            'id': self.id,
            'camera_id': self.camera_id,
            'camera_name': cam.name if cam else self.camera_id,
            'sector': cam.sector if cam else 'Sector A',
            'video_upload_id': self.video_upload_id,
            'tracking_id': self.tracking_id,
            'object_type': self.object_type,
            'confidence': round(self.confidence, 1),
            'stage': self.stage,
            'zone_name': self.zone_name,
            'video_timestamp': self.video_timestamp,
            'video_timestamp_seconds': self.video_timestamp_seconds,
            'bbox': {
                'x': self.bbox_x,
                'y': self.bbox_y,
                'w': self.bbox_w,
                'h': self.bbox_h
            },
            'movement_direction': self.movement_direction,
            'is_in_restricted_zone': self.is_in_restricted_zone,
            'person_count': self.person_count,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'time': self.timestamp.strftime('%I:%M:%S %p') if self.timestamp else ''
        }
