import json
from datetime import datetime, timedelta
from . import db

class Camera(db.Model):
    __tablename__ = 'cameras'

    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    
    # Sector Reference (sector name string e.g. "Sector A" and foreign key to Sector table)
    sector = db.Column(db.String(50), nullable=False, default='Sector A', index=True)
    sector_name_id = db.Column(db.String(50), db.ForeignKey('sectors.sector_id', ondelete='SET NULL'), nullable=True)

    location_name = db.Column(db.String(150), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='ONLINE')  # ONLINE, ALERT, SUSPICIOUS, OFFLINE
    health_status = db.Column(db.String(50), nullable=False, default='ONLINE')  # ONLINE, OFFLINE, UNSTABLE, NO_SIGNAL
    video_url = db.Column(db.String(255), default='')
    stream_type = db.Column(db.String(50), default='optical')  # optical, thermal, night_vision, infrared
    ip_address = db.Column(db.String(50), default='192.168.1.101')
    resolution = db.Column(db.String(50), default='1080p (1920x1080)')
    fps = db.Column(db.Integer, default=30)
    ptz_enabled = db.Column(db.Boolean, default=True)

    # Multi-Tier Geofence Zones on the Camera Canvas [Normalized 0.0 to 1.0 coords]
    # Stage 1: Allowed normal activity zone
    normal_zone = db.Column(db.Text, default='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Normal Base Activity Area"}')
    # Stage 2: Warning approach zone
    warning_zone = db.Column(db.Text, default='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Approach Warning Zone"}')
    # Stage 3: Perimeter physical fence line
    perimeter_line = db.Column(db.Text, default='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Perimeter Defense Fence"}')
    # Stage 4: Restricted / Red Exclusion zone
    restricted_zone = db.Column(db.Text, default='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Red Restricted Exclusion Zone"}')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    alerts = db.relationship('Alert', backref='camera', lazy='dynamic', cascade='all, delete-orphan')
    detections = db.relationship('Detection', backref='camera', lazy='dynamic', cascade='all, delete-orphan')
    incidents = db.relationship('Incident', backref='camera', lazy='dynamic', cascade='all, delete-orphan', order_by='Incident.detection_time.desc()')
    video_uploads = db.relationship('VideoUpload', backref='camera', lazy='dynamic', cascade='all, delete-orphan', order_by='VideoUpload.created_at.desc()')

    def get_normal_zone(self):
        try:
            return json.loads(self.normal_zone) if self.normal_zone else {"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Normal Area"}
        except Exception:
            return {"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Normal Area"}

    def get_warning_zone(self):
        try:
            return json.loads(self.warning_zone) if self.warning_zone else {"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Warning Zone"}
        except Exception:
            return {"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Warning Zone"}

    def get_perimeter_line(self):
        try:
            return json.loads(self.perimeter_line) if self.perimeter_line else {"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Fence Line"}
        except Exception:
            return {"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Fence Line"}

    def get_restricted_zone(self):
        try:
            return json.loads(self.restricted_zone) if self.restricted_zone else {"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Zone"}
        except Exception:
            return {"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Zone"}

    def get_latest_unresolved_incident(self):
        """Returns the latest unresolved incident (NEW, ACKNOWLEDGED, UNDER_INVESTIGATION) for smart camera opening."""
        from models.incident import Incident
        return self.incidents.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).first()

    def get_recent_incidents_24h(self):
        """Returns incidents that occurred on this camera within the previous 24 hours (for offline camera logic)."""
        from models.incident import Incident
        since = datetime.utcnow() - timedelta(hours=24)
        return self.incidents.filter(Incident.detection_time >= since).order_by(Incident.detection_time.desc()).all()

    def sync_status(self):
        """
        Recalculates and updates camera.status based on active alerts/incidents:
        - Shows ALERT if and only if one or more active unresolved alerts/incidents exist.
        - Returns to OFFLINE if health_status in ('OFFLINE', 'NO_SIGNAL'), else returns to ONLINE.
        """
        from models.incident import Incident
        from models.alert import Alert
        active_alerts_cnt = self.alerts.filter_by(status='ACTIVE').count()
        active_inc_cnt = self.incidents.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).count()

        if active_alerts_cnt > 0 or active_inc_cnt > 0:
            new_status = 'ALERT'
        elif self.health_status in ['OFFLINE', 'NO_SIGNAL']:
            new_status = 'OFFLINE'
        else:
            new_status = 'ONLINE'

        if self.status != new_status:
            self.status = new_status
            db.session.commit()
        return self.status

    def to_dict(self, include_active_incident=True, include_24h_incidents=False):
        from models.incident import Incident
        active_inc = self.get_latest_unresolved_incident() if include_active_incident else None
        recent_24h = self.get_recent_incidents_24h() if include_24h_incidents else []
        
        active_alerts_cnt = self.alerts.filter_by(status='ACTIVE').count()
        active_inc_cnt = self.incidents.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).count()

        # Dynamic synchronized status: ALERT only if unresolved alerts or incidents exist
        if active_alerts_cnt > 0 or active_inc_cnt > 0:
            effective_status = 'ALERT'
        elif self.health_status in ['OFFLINE', 'NO_SIGNAL']:
            effective_status = 'OFFLINE'
        else:
            effective_status = 'ONLINE'

        # Auto-sync persistent column if drifted
        if self.status != effective_status:
            try:
                self.status = effective_status
                db.session.commit()
            except Exception:
                db.session.rollback()

        return {
            'id': self.id,
            'camera_id': self.camera_id,
            'name': self.name,
            'sector': self.sector,
            'location_name': self.location_name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': effective_status,
            'health_status': self.health_status,
            'video_url': self.video_url,
            'stream_type': self.stream_type,
            'ip_address': self.ip_address,
            'resolution': self.resolution,
            'fps': self.fps,
            'ptz_enabled': self.ptz_enabled,
            'zones': {
                'normal_zone': self.get_normal_zone(),
                'warning_zone': self.get_warning_zone(),
                'perimeter_line': self.get_perimeter_line(),
                'restricted_zone': self.get_restricted_zone()
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_active': self.last_active.isoformat() if self.last_active else None,
            'alert_count': active_alerts_cnt,
            'active_incident_count': active_inc_cnt,
            'active_incident': active_inc.to_dict(include_timeline=True) if active_inc else None,
            'has_24h_incident': len(recent_24h) > 0,
            'recent_24h_incident': recent_24h[0].to_dict(include_timeline=True) if len(recent_24h) > 0 else None
        }
