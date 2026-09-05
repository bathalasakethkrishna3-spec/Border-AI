import json
from datetime import datetime
from . import db

class VideoUpload(db.Model):
    __tablename__ = 'video_uploads'

    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    camera_id = db.Column(db.String(50), db.ForeignKey('cameras.camera_id', ondelete='CASCADE'), nullable=False, index=True)
    sector_id = db.Column(db.String(50), nullable=False, default='Sector A')
    
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size_mb = db.Column(db.Float, default=0.0)
    duration_seconds = db.Column(db.Float, default=60.0) # Video duration in seconds
    
    # Analysis Status: UPLOADED, PROCESSING, COMPLETED, FAILED
    status = db.Column(db.String(50), nullable=False, default='PROCESSING')
    analysis_progress = db.Column(db.Integer, default=100) # 0 to 100%
    
    total_detections = db.Column(db.Integer, default=0)
    total_incidents = db.Column(db.Integer, default=0)
    events_summary = db.Column(db.Text, default='[]') # JSON list of all chronological detection events
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    detections = db.relationship('Detection', backref='video_upload_rel', lazy='dynamic', cascade='all, delete-orphan')
    incidents = db.relationship('Incident', backref='video_upload_rel', lazy='dynamic')

    def get_events_summary(self):
        try:
            return json.loads(self.events_summary) if self.events_summary else []
        except Exception:
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'upload_id': self.upload_id,
            'camera_id': self.camera_id,
            'sector_id': self.sector_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size_mb': round(self.file_size_mb, 2),
            'duration_seconds': self.duration_seconds,
            'status': self.status,
            'analysis_progress': self.analysis_progress,
            'total_detections': self.total_detections,
            'total_incidents': self.total_incidents,
            'events_summary': self.get_events_summary(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
