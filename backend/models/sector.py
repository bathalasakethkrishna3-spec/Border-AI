import json
from datetime import datetime
from . import db

class Sector(db.Model):
    __tablename__ = 'sectors'

    id = db.Column(db.Integer, primary_key=True)
    sector_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. "Sector A", "Sector B"
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), default='')
    status = db.Column(db.String(50), nullable=False, default='SECURE') # SECURE, SUSPICIOUS, ALERT
    risk_level = db.Column(db.String(50), nullable=False, default='LOW') # LOW, MEDIUM, HIGH, CRITICAL
    
    # Geographic center & GIS Polygon Boundary
    center_lat = db.Column(db.Float, nullable=False, default=29.45)
    center_lng = db.Column(db.Float, nullable=False, default=72.45)
    boundary_polygon = db.Column(db.Text, default='[]') # JSON list of [lat, lng] points

    # Multi-Tier Zone Geofences for Staged Intrusion Evaluation
    normal_zones = db.Column(db.Text, default='[]') # Stage 1: Allowed activity areas
    warning_zones = db.Column(db.Text, default='[]') # Stage 2: Approach/buffer zones
    perimeter_fence_lines = db.Column(db.Text, default='[]') # Stage 3: Physical perimeter fence line
    restricted_zones = db.Column(db.Text, default='[]') # Stage 4: Exclusion / Red zones

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cameras = db.relationship('Camera', backref='sector_rel', lazy='dynamic', foreign_keys='Camera.sector_name_id')

    def get_boundary_polygon(self):
        try:
            return json.loads(self.boundary_polygon) if self.boundary_polygon else []
        except Exception:
            return []

    def get_normal_zones(self):
        try:
            return json.loads(self.normal_zones) if self.normal_zones else []
        except Exception:
            return []

    def get_warning_zones(self):
        try:
            return json.loads(self.warning_zones) if self.warning_zones else []
        except Exception:
            return []

    def get_perimeter_fence_lines(self):
        try:
            return json.loads(self.perimeter_fence_lines) if self.perimeter_fence_lines else []
        except Exception:
            return []

    def get_restricted_zones(self):
        try:
            return json.loads(self.restricted_zones) if self.restricted_zones else []
        except Exception:
            return []

    def get_active_incidents(self):
        from models.incident import Incident
        return Incident.query.filter(
            Incident.sector == self.sector_id,
            Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])
        ).order_by(Incident.detection_time.desc()).all()

    def to_dict(self, include_cameras=True, include_incidents=True):
        from models.incident import Incident
        active_incs = self.get_active_incidents() if include_incidents else []
        camera_list = [c.to_dict(include_active_incident=False) for c in self.cameras.all()] if include_cameras else []
        
        # Calculate dynamic status
        has_critical = any(inc.risk_level == 'CRITICAL' for inc in active_incs)
        has_active = len(active_incs) > 0
        computed_status = 'ALERT' if (has_critical or len(active_incs) >= 2) else ('SUSPICIOUS' if has_active else 'SECURE')
        computed_risk = 'CRITICAL' if has_critical else ('HIGH' if has_active else 'LOW')

        data = {
            'id': self.id,
            'sector_id': self.sector_id,
            'name': self.name,
            'description': self.description,
            'status': computed_status,
            'risk_level': computed_risk,
            'center_lat': self.center_lat,
            'center_lng': self.center_lng,
            'boundary_polygon': self.get_boundary_polygon(),
            'zones': {
                'normal_zones': self.get_normal_zones(),
                'warning_zones': self.get_warning_zones(),
                'perimeter_fence_lines': self.get_perimeter_fence_lines(),
                'restricted_zones': self.get_restricted_zones(),
            },
            'camera_count': self.cameras.count(),
            'active_camera_count': self.cameras.filter_by(health_status='ONLINE').count(),
            'active_intrusion_count': len(active_incs),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_cameras:
            data['cameras'] = camera_list
        if include_incidents:
            data['active_incidents'] = [inc.to_dict(include_timeline=False) for inc in active_incs]

        return data
