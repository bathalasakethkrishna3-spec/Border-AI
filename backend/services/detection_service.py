import random
import math
from datetime import datetime, timedelta
from models import db
from models.detection import Detection
from models.alert import Alert
from models.incident import Incident, IncidentTimeline
from models.camera import Camera
from models.notification import Notification
from models.audit_log import AuditLog
from models.system_setting import SystemSetting

class DetectionService:
    @staticmethod
    def get_threshold(object_type):
        """Retrieve threshold for object type from database settings or default."""
        key_map = {
            'PERSON': 'threshold_person',
            'MULTI_PERSON': 'threshold_person',
            'VEHICLE': 'threshold_vehicle',
            'WEAPON': 'threshold_weapon',
            'INTRUDER': 'threshold_intruder',
            'MOTION': 'threshold_motion',
            'DRONE': 'threshold_drone'
        }
        setting_key = key_map.get(object_type.upper(), 'threshold_general')
        setting = SystemSetting.query.filter_by(key=setting_key).first()
        if setting:
            try:
                return float(setting.value)
            except ValueError:
                pass
        return 75.0  # Default 75%

    @staticmethod
    def check_restricted_zone_breach(bbox, restricted_zone):
        """
        Check if object bounding box intersects or falls inside camera's restricted zone.
        BBox and Zone are both normalized coordinates [0.0 to 1.0].
        """
        if not bbox or not restricted_zone:
            return True  # Default to breach if zone not configured

        bx = float(bbox.get('x', 0.5))
        by = float(bbox.get('y', 0.5))
        bw = float(bbox.get('w', 0.15))
        bh = float(bbox.get('h', 0.30))

        zx = float(restricted_zone.get('x', 0.35))
        zy = float(restricted_zone.get('y', 0.35))
        zw = float(restricted_zone.get('w', 0.45))
        zh = float(restricted_zone.get('h', 0.45))

        # Check AABB intersection
        intersects = not (
            (bx + bw < zx) or  # Object is left of zone
            (bx > zx + zw) or  # Object is right of zone
            (by + bh < zy) or  # Object is above zone
            (by > zy + zh)     # Object is below zone
        )
        return intersects

    @staticmethod
    def calculate_movement_direction(camera_id, object_type, current_bbox):
        """
        Calculates 8-way movement direction and human-readable description
        by comparing previous position with current position.
        """
        last_det = Detection.query.filter_by(camera_id=camera_id)\
            .order_by(Detection.timestamp.desc()).first()

        if not last_det or not last_det.bbox_x:
            directions = ['NORTH_EAST', 'EAST', 'SOUTH_EAST', 'NORTH_WEST']
            chosen = random.choice(directions)
            desc_map = {
                'NORTH_EAST': 'Moving north-east towards primary restricted perimeter',
                'EAST': 'Moving east along sector fence line',
                'SOUTH_EAST': 'Advancing south-east towards forward checkpoint',
                'NORTH_WEST': 'Moving north-west away from buffer zone'
            }
            return chosen, desc_map.get(chosen, 'Moving along perimeter')

        dx = float(current_bbox.get('x', 0.5)) - last_det.bbox_x
        dy = float(current_bbox.get('y', 0.5)) - last_det.bbox_y

        # If displacement is very small, maintain or assign direction
        if abs(dx) < 0.01 and abs(dy) < 0.01:
            dx = 0.05
            dy = -0.03

        angle = math.degrees(math.atan2(-dy, dx))  # Standard polar angle (up is north)

        if -22.5 <= angle < 22.5:
            direction = 'EAST'
            desc = 'Moving east parallel to defense line'
        elif 22.5 <= angle < 67.5:
            direction = 'NORTH_EAST'
            desc = 'Moving north-east towards restricted zone'
        elif 67.5 <= angle < 112.5:
            direction = 'NORTH'
            desc = 'Moving north directly towards command perimeter'
        elif 112.5 <= angle < 157.5:
            direction = 'NORTH_WEST'
            desc = 'Moving north-west along observation ridge'
        elif angle >= 157.5 or angle < -157.5:
            direction = 'WEST'
            desc = 'Moving west towards outer border boundary'
        elif -157.5 <= angle < -112.5:
            direction = 'SOUTH_WEST'
            desc = 'Moving south-west away from restricted zone'
        elif -112.5 <= angle < -67.5:
            direction = 'SOUTH'
            desc = 'Moving south towards egress path'
        else:
            direction = 'SOUTH_EAST'
            desc = 'Moving south-east approaching checkpoint'

        return direction, desc

    @classmethod
    def calculate_smart_risk_score(cls, object_type, confidence, in_restricted_zone, person_count, timestamp):
        """
        Calculates smart risk score from 0 to 100 based on multi-factor intelligence:
        - Object type threat base
        - Restricted zone entry
        - Group / multiple person count
        - Night / low-light time factor
        - AI Confidence level
        """
        base_scores = {
            'PERSON': 45,
            'MULTI_PERSON': 68,
            'VEHICLE': 52,
            'INTRUDER': 80,
            'WEAPON': 90,
            'DRONE': 78,
            'MOTION': 32
        }

        score = base_scores.get(object_type, 40)

        # Restricted Zone Breach (+25 pts)
        if in_restricted_zone:
            score += 25

        # Multiple Persons (+8 pts per extra person)
        if person_count > 1:
            score += min(30, (person_count - 1) * 8)

        # Night time factor (20:00 to 06:00) (+12 pts)
        hour = timestamp.hour if timestamp else datetime.utcnow().hour
        if hour >= 20 or hour <= 6:
            score += 12

        # Confidence bonus
        if confidence > 85:
            score += int((confidence - 85) * 0.4)

        # Clamp score between 10 and 99
        risk_score = max(10, min(99, int(score)))

        # Risk Level mapping
        if risk_score >= 81:
            risk_level = 'CRITICAL'
        elif risk_score >= 61:
            risk_level = 'HIGH'
        elif risk_score >= 31:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'

        return risk_score, risk_level

    @classmethod
    def process_detection(cls, data):
        """
        Main pipeline for processing detection from AI/YOLO/OpenCV or test simulation.
        Checks restricted zone -> calculates direction -> computes smart risk score (0-100)
        -> generates 45s buffered Incident -> adds IncidentTimeline events -> creates Alert & Notification.
        """
        camera_id = data.get('camera_id')
        object_type = data.get('object_type', 'PERSON').upper()
        confidence = float(data.get('confidence', 88.0))
        person_count = int(data.get('person_count', 1 if object_type != 'MULTI_PERSON' else 4))
        tracking_id = data.get('tracking_id', f"TRK-{random.randint(100, 999)}")
        
        # Verify camera exists
        camera = Camera.query.filter_by(camera_id=camera_id).first()
        if not camera:
            raise ValueError(f"Camera with ID '{camera_id}' not found.")

        # Parse Bounding Box
        bbox = data.get('bbox', {'x': 0.45, 'y': 0.35, 'w': 0.15, 'h': 0.30})
        bbox_x = float(bbox.get('x', 0.45))
        bbox_y = float(bbox.get('y', 0.35))
        bbox_w = float(bbox.get('w', 0.15))
        bbox_h = float(bbox.get('h', 0.30))

        # Parse timestamp
        ts_str = data.get('timestamp')
        if ts_str:
            try:
                timestamp = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            except Exception:
                timestamp = datetime.utcnow()
        else:
            timestamp = datetime.utcnow()

        # 1. Evaluate Restricted Zone Breach
        restricted_zone = camera.get_restricted_zone()
        in_restricted_zone = cls.check_restricted_zone_breach(bbox, restricted_zone)

        # 2. Calculate Movement Direction & Vector
        direction, direction_desc = cls.calculate_movement_direction(camera_id, object_type, bbox)

        # 3. Calculate Smart Risk Score (0 - 100)
        risk_score, risk_level = cls.calculate_smart_risk_score(
            object_type, confidence, in_restricted_zone, person_count, timestamp
        )

        # 4. Save Detection record in SQLite
        detection = Detection(
            camera_id=camera_id,
            tracking_id=tracking_id,
            object_type=object_type,
            confidence=confidence,
            bbox_x=bbox_x,
            bbox_y=bbox_y,
            bbox_w=bbox_w,
            bbox_h=bbox_h,
            movement_direction=direction,
            is_in_restricted_zone=in_restricted_zone,
            person_count=person_count,
            timestamp=timestamp
        )
        db.session.add(detection)
        camera.last_active = datetime.utcnow()

        # 5. Check if Incident & Alert should be triggered
        # Rule: Trigger Incident if object breaches restricted zone OR high-risk object exceeds threshold
        threshold = cls.get_threshold(object_type)
        is_threat = in_restricted_zone or confidence >= threshold or risk_score >= 60

        created_incident = None
        created_alert = None
        created_notification = None

        if is_threat:
            # Generate Unique Incident ID (e.g. INC-2026-008)
            inc_count = Incident.query.count() + 1
            incident_id = f"INC-{datetime.utcnow().year}-{inc_count:03d}"
            while Incident.query.filter_by(incident_id=incident_id).first():
                inc_count += 1
                incident_id = f"INC-{datetime.utcnow().year}-{inc_count:03d}"

            # Video Buffering Timestamps (15s before intrusion + detection moment + 30s after intrusion)
            start_time = timestamp - timedelta(seconds=15)
            end_time = timestamp + timedelta(seconds=30)

            # Create Incident Record
            created_incident = Incident(
                incident_id=incident_id,
                camera_id=camera_id,
                detection_type=object_type,
                object_class='Group of Persons' if person_count > 1 else ('Vehicle' if object_type == 'VEHICLE' else 'Person'),
                confidence=confidence,
                risk_score=risk_score,
                risk_level=risk_level,
                movement_direction=direction,
                direction_description=direction_desc,
                restricted_zone_breached=in_restricted_zone,
                person_count=person_count,
                start_time=start_time,
                detection_time=timestamp,
                end_time=end_time,
                status='NEW',
                created_at=timestamp
            )
            db.session.add(created_incident)

            # Create 5 Chronological Incident Timeline Events
            timeline_events = [
                IncidentTimeline(
                    incident_id=incident_id,
                    timestamp=start_time,
                    event_title="Monitoring Active",
                    event_description=f"Standard perimeter surveillance running on {camera.name}.",
                    event_type="MONITORING",
                    actor="Sensor Network"
                ),
                IncidentTimeline(
                    incident_id=incident_id,
                    timestamp=timestamp - timedelta(seconds=5),
                    event_title=f"{object_type} Detected",
                    event_description=f"Neural tracking identified {person_count} target(s) with {confidence:.1f}% confidence.",
                    event_type="DETECTION",
                    actor="YOLO Neural Engine"
                ),
                IncidentTimeline(
                    incident_id=incident_id,
                    timestamp=timestamp,
                    event_title="Restricted Zone Breached" if in_restricted_zone else "Perimeter Threat Flagged",
                    event_description=f"Target entered {restricted_zone.get('label', 'Restricted Red Zone')} in {camera.sector}.",
                    event_type="ZONE_ENTRY",
                    actor="Geofence Engine"
                ),
                IncidentTimeline(
                    incident_id=incident_id,
                    timestamp=timestamp + timedelta(seconds=1),
                    event_title=f"Risk Evaluated: {risk_score}/100 ({risk_level})",
                    event_description=f"Threat score calculated based on {direction_desc} and group size ({person_count}).",
                    event_type="RISK_EVAL",
                    actor="Smart Risk Evaluator"
                ),
                IncidentTimeline(
                    incident_id=incident_id,
                    timestamp=timestamp + timedelta(seconds=2),
                    event_title=f"{risk_level} Threat Alert Dispatched",
                    event_description=f"Automated priority incident logged. Waiting for operator triage.",
                    event_type="ALERT_DISPATCH",
                    actor="Command Dispatcher"
                )
            ]
            db.session.add_all(timeline_events)

            # Generate unique Alert ID
            alt_count = Alert.query.count() + 1
            alert_id = f"ALERT-{alt_count:03d}"
            while Alert.query.filter_by(alert_id=alert_id).first():
                alt_count += 1
                alert_id = f"ALERT-{alt_count:03d}"

            alert_msg = f"{'CRITICAL ' if risk_level == 'CRITICAL' else ''}{object_type} Intrusion in {camera.sector} ({camera.location_name}) - Risk: {risk_score}/100"

            created_alert = Alert(
                alert_id=alert_id,
                incident_id=incident_id,
                camera_id=camera_id,
                detection_type=object_type,
                message=alert_msg,
                confidence=confidence,
                risk_score=risk_score,
                priority=risk_level,
                movement_direction=direction,
                status='ACTIVE',
                created_at=timestamp
            )
            db.session.add(created_alert)

            # Update Camera Operating Status
            if risk_level in ['CRITICAL', 'HIGH']:
                camera.status = 'ALERT'
            elif risk_level == 'MEDIUM' and camera.status != 'ALERT':
                camera.status = 'SUSPICIOUS'

            # Operator Notification
            created_notification = Notification(
                title=f"{risk_level} ALERT: {object_type} at {camera_id}",
                message=alert_msg,
                type='ALERT' if risk_level in ['CRITICAL', 'HIGH'] else 'WARNING',
                camera_id=camera_id,
                created_at=timestamp
            )
            db.session.add(created_notification)

            # Audit Log
            audit = AuditLog(
                action='INTRUSION_INCIDENT_CREATED',
                details=f"Created {risk_level} Incident {incident_id} (Risk: {risk_score}/100, {object_type}) on {camera_id}."
            )
            db.session.add(audit)

        db.session.commit()

        return {
            'detection': detection.to_dict(),
            'incident': created_incident.to_dict(include_timeline=True) if created_incident else None,
            'alert': created_alert.to_dict() if created_alert else None,
            'notification': created_notification.to_dict() if created_notification else None,
            'camera_status': camera.status
        }
