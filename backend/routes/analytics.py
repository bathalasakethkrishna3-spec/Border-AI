from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func
from models import db
from models.camera import Camera
from models.alert import Alert
from models.detection import Detection
from models.incident import Incident
from models.sector import Sector
from services.correlation_service import CrossCameraCorrelationService

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Cameras counts
    total_cameras = Camera.query.count()
    active_cameras = Camera.query.filter_by(health_status='ONLINE').count()
    offline_cameras = Camera.query.filter(Camera.health_status.in_(['OFFLINE', 'NO_SIGNAL', 'UNSTABLE'])).count()
    camera_pct = round((active_cameras / total_cameras * 100), 1) if total_cameras > 0 else 100.0

    # 2. AI Detections Today
    today_detections_count = Detection.query.filter(Detection.timestamp >= today_start).count()

    # 3. Active & Resolved Incidents
    active_incidents = Incident.query.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).all()
    active_incidents_count = len(active_incidents)
    critical_incidents_count = sum(1 for inc in active_incidents if inc.risk_level == 'CRITICAL')
    resolved_incidents_count = Incident.query.filter_by(status='RESOLVED').count()

    # 4. Active Alerts
    active_alerts_count = Alert.query.filter_by(status='ACTIVE').count()
    critical_alerts_count = Alert.query.filter(Alert.status == 'ACTIVE', Alert.priority.in_(['HIGH', 'CRITICAL'])).count()

    # 5. Border Status Evaluation
    if critical_incidents_count > 0:
        border_status = {'status': 'CRITICAL ALERT', 'subtitle': f'{critical_incidents_count} Critical Breach(es) Active', 'color': 'red'}
    elif active_incidents_count > 0:
        border_status = {'status': 'ELEVATED RISK', 'subtitle': f'{active_incidents_count} Unresolved Incident(s)', 'color': 'amber'}
    elif offline_cameras > 0:
        border_status = {'status': 'DEGRADED', 'subtitle': f'{offline_cameras} Camera(s) Offline', 'color': 'yellow'}
    else:
        border_status = {'status': 'SECURE', 'subtitle': 'All Sectors Synchronized', 'color': 'green'}

    # 6. Environmental Telemetry
    hour_utc = now.hour
    # Convert approximate local border time (e.g. UTC+5:30)
    local_hour = (hour_utc + 5) % 24
    is_night = local_hour < 6 or local_hour >= 19
    env_status = {
        'mode': 'NIGHT MODE (FLIR Active)' if is_night else 'DAY MODE (Optical RGB)',
        'is_night': is_night,
        'lighting': 'Low-Light (IR Enabled)' if is_night else 'Bright Sunlight',
        'visibility': '92% Clear Visibility',
        'weather': 'Clear Skies / 24°C',
        'ai_analysis_status': 'OPTIMAL - ALL ENGINES SYNCED'
    }

    # 7. Grid Cameras (Top 4)
    grid_cams = Camera.query.order_by(Camera.camera_id.asc()).limit(4).all()

    # 8. Recent Alerts
    recent_alerts = Alert.query.order_by(Alert.created_at.desc()).limit(5).all()

    # 9. Cross-Camera Correlation
    correlations = CrossCameraCorrelationService.find_correlated_movements()

    # 10. Sectors Summary
    sectors = Sector.query.order_by(Sector.sector_id.asc()).all()

    return jsonify({
        'active_cameras': {
            'count': active_cameras,
            'total': total_cameras,
            'percentage': camera_pct
        },
        'offline_cameras': offline_cameras,
        'ai_detections': {
            'count': today_detections_count,
            'sparkline': [12, 18, 25, 30, 22, 28, today_detections_count]
        },
        'active_incidents': {
            'count': active_incidents_count,
            'critical_count': critical_incidents_count,
            'sparkline': [1, 2, 4, 3, 5, 2, active_incidents_count]
        },
        'resolved_incidents': {
            'count': resolved_incidents_count
        },
        'active_alerts': {
            'count': critical_alerts_count,
            'total_active': active_alerts_count,
            'sparkline': [2, 3, 5, 4, 3, 6, critical_alerts_count]
        },
        'border_status': border_status,
        'environmental_status': env_status,
        'cross_camera_correlations': correlations,
        'sectors_summary': [s.to_dict(include_cameras=False, include_incidents=False) for s in sectors],
        'grid_cameras': [c.to_dict(include_active_incident=True) for c in grid_cams],
        'recent_alerts': [a.to_dict() for a in recent_alerts]
    }), 200

@analytics_bp.route('/trends', methods=['GET'])
def get_trends():
    now = datetime.utcnow()
    
    # 1. 7-Day Intrusion & Object Trend (Calculated from actual Detection and Incident records)
    trend_7_days = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        persons = Detection.query.filter(
            Detection.timestamp >= day_start,
            Detection.timestamp < day_end,
            Detection.object_type.in_(['PERSON', 'MULTI_PERSON'])
        ).count()
        
        vehicles = Detection.query.filter(
            Detection.timestamp >= day_start,
            Detection.timestamp < day_end,
            Detection.object_type == 'VEHICLE'
        ).count()
        
        intrusions = Incident.query.filter(
            Incident.detection_time >= day_start,
            Incident.detection_time < day_end
        ).count()

        trend_7_days.append({
            'date': day_date.strftime('%b %d'),
            'persons': persons,
            'vehicles': vehicles,
            'intrusions': intrusions
        })

    # 2. Sector Threat Concentration (Calculated from incidents associated with each sector)
    sectors = Sector.query.order_by(Sector.sector_id.asc()).all()
    alerts_by_sector = []
    for s in sectors:
        tot_incidents = Incident.query.filter(Incident.sector == s.sector_id).count()
        high_threats = Incident.query.filter(
            Incident.sector == s.sector_id,
            Incident.risk_level.in_(['HIGH', 'CRITICAL'])
        ).count()
        alerts_by_sector.append({
            'sector': s.sector_id,
            'total_alerts': tot_incidents,
            'high_priority': high_threats
        })

    # 3. Detection Breakdown (Calculated from real Detection records)
    persons_total = Detection.query.filter(Detection.object_type.in_(['PERSON', 'MULTI_PERSON'])).count()
    vehicles_total = Detection.query.filter(Detection.object_type == 'VEHICLE').count()
    intrusions_total = Detection.query.filter(
        db.or_(
            Detection.object_type == 'INTRUDER',
            Detection.is_in_restricted_zone == True,
            Detection.stage.in_(['STAGE_4_INTRUSION', 'INTRUSION'])
        )
    ).count()
    other_total = Detection.query.filter(
        ~Detection.object_type.in_(['PERSON', 'MULTI_PERSON', 'VEHICLE', 'INTRUDER'])
    ).count()

    total_detections_count = persons_total + vehicles_total + intrusions_total + other_total

    # 4. 24-Hour Perimeter Motion Distribution (Hourly aggregation over last 24 hours)
    hourly_distribution = []
    for h in range(23, -1, -1):
        h_start = (now - timedelta(hours=h)).replace(minute=0, second=0, microsecond=0)
        h_end = h_start + timedelta(hours=1)

        det_count = Detection.query.filter(
            Detection.timestamp >= h_start,
            Detection.timestamp < h_end
        ).count()

        inc_count = Incident.query.filter(
            Incident.detection_time >= h_start,
            Incident.detection_time < h_end
        ).count()

        hourly_distribution.append({
            'hour': h_start.strftime('%H:00'),
            'detections': det_count,
            'intrusions': inc_count,
            'total': det_count + inc_count
        })

    return jsonify({
        'trend_7_days': trend_7_days,
        'alerts_by_sector': alerts_by_sector,
        'hourly_distribution': hourly_distribution,
        'correlations': CrossCameraCorrelationService.find_correlated_movements(),
        'detection_overview': {
            'total': total_detections_count,
            'breakdown': [
                {'name': 'Persons', 'value': persons_total, 'color': '#3b82f6'},
                {'name': 'Vehicles', 'value': vehicles_total, 'color': '#06b6d4'},
                {'name': 'Intrusions', 'value': intrusions_total, 'color': '#ef4444'},
                {'name': 'Motion/Others', 'value': other_total, 'color': '#8b5cf6'}
            ]
        }
    }), 200
