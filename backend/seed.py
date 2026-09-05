import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from models import db
from models.user import User
from models.sector import Sector
from models.camera import Camera
from models.alert import Alert
from models.detection import Detection
from models.incident import Incident, IncidentTimeline
from models.video_upload import VideoUpload
from models.notification import Notification
from models.audit_log import AuditLog
from models.system_setting import SystemSetting

def seed_database():
    """Seeds the BorderAI database with complete Sectors, Multi-Tier Zones, Cameras, and Staged Incidents."""
    db.drop_all()
    db.create_all()

    print("Re-creating and seeding Border AI database with realistic sectors, multi-tier zones, and smart camera incidents...")

    # Clear existing data to ensure pristine referential integrity
    try:
        db.session.query(IncidentTimeline).delete()
        db.session.query(Alert).delete()
        db.session.query(Detection).delete()
        db.session.query(Incident).delete()
        db.session.query(VideoUpload).delete()
        db.session.query(Camera).delete()
        db.session.query(Sector).delete()
        db.session.query(Notification).delete()
        db.session.query(AuditLog).delete()
        db.session.query(SystemSetting).delete()
        db.session.query(User).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    now = datetime.utcnow()

    # 1. Users
    users = [
        User(
            username='admin',
            email='admin@borderai.gov',
            password_hash=generate_password_hash('admin123'),
            full_name='Col. Rajesh Varma',
            role='ADMIN',
            badge_number='BDR-001',
            is_active=True
        ),
        User(
            username='operator',
            email='operator@borderai.gov',
            password_hash=generate_password_hash('operator123'),
            full_name='Capt. Priya Sharma',
            role='OPERATOR',
            badge_number='BDR-042',
            is_active=True
        ),
        User(
            username='analyst',
            email='analyst@borderai.gov',
            password_hash=generate_password_hash('analyst123'),
            full_name='Dr. Vikram Mehta',
            role='ANALYST',
            badge_number='BDR-108',
            is_active=True
        )
    ]
    db.session.add_all(users)

    # 2. Sectors with Geographic Polygons and 4-Tier Zones
    sectors = [
        Sector(
            sector_id='Sector A',
            name='Sector A — Desert Ridge Perimeter',
            description='Northern desert border corridor covering high-altitude sand dunes and primary patrol checkpoint.',
            status='SECURE',
            risk_level='LOW',
            center_lat=29.4500,
            center_lng=72.4500,
            boundary_polygon=json.dumps([
                [29.4700, 72.4200],
                [29.4700, 72.4800],
                [29.4300, 72.4800],
                [29.4300, 72.4200]
            ]),
            normal_zones=json.dumps([{'name': 'Civilian Highway Buffer', 'type': 'NORMAL', 'color': '#10b981'}]),
            warning_zones=json.dumps([{'name': 'Approach Zone A-1', 'type': 'WARNING', 'color': '#f59e0b'}]),
            perimeter_fence_lines=json.dumps([{'name': 'Double-Barbed Fence A', 'type': 'FENCE', 'color': '#06b6d4'}]),
            restricted_zones=json.dumps([{'name': 'Zero-Tolerance Red Zone A', 'type': 'RESTRICTED', 'color': '#ef4444'}])
        ),
        Sector(
            sector_id='Sector B',
            name='Sector B — River Basin & Ridge Corridor',
            description='Active riverbank sector with dense vegetation, high thermal activity, and vulnerable blind spots.',
            status='ALERT',
            risk_level='CRITICAL',
            center_lat=29.5100,
            center_lng=72.5200,
            boundary_polygon=json.dumps([
                [29.5350, 72.4900],
                [29.5350, 72.5500],
                [29.4850, 72.5500],
                [29.4850, 72.4900]
            ]),
            normal_zones=json.dumps([{'name': 'Border Guard Patrol Base', 'type': 'NORMAL', 'color': '#10b981'}]),
            warning_zones=json.dumps([{'name': 'Riverbank Approach Buffer', 'type': 'WARNING', 'color': '#f59e0b'}]),
            perimeter_fence_lines=json.dumps([{'name': 'Smart Sensor Wire B-Ridge', 'type': 'FENCE', 'color': '#06b6d4'}]),
            restricted_zones=json.dumps([{'name': 'Restricted Riverbank Exclusion Zone', 'type': 'RESTRICTED', 'color': '#ef4444'}])
        ),
        Sector(
            sector_id='Sector C',
            name='Sector C — Mountain Pass & Gorge',
            description='Rugged rocky terrain featuring deep ravines, monitored by FLIR long-range thermal PTZ sensors.',
            status='SUSPICIOUS',
            risk_level='HIGH',
            center_lat=29.3900,
            center_lng=72.3800,
            boundary_polygon=json.dumps([
                [29.4150, 72.3500],
                [29.4150, 72.4100],
                [29.3650, 72.4100],
                [29.3650, 72.3500]
            ]),
            normal_zones=json.dumps([{'name': 'Supply Road Zone', 'type': 'NORMAL', 'color': '#10b981'}]),
            warning_zones=json.dumps([{'name': 'Gorge Slope Warning', 'type': 'WARNING', 'color': '#f59e0b'}]),
            perimeter_fence_lines=json.dumps([{'name': 'Mountain Fence C', 'type': 'FENCE', 'color': '#06b6d4'}]),
            restricted_zones=json.dumps([{'name': 'High-Altitude Restricted Perimeter', 'type': 'RESTRICTED', 'color': '#ef4444'}])
        ),
        Sector(
            sector_id='Sector D',
            name='Sector D — Coastal & Salt Marsh Border',
            description='Low-lying wetland sector with tidal flats, monitored via radar and night-vision optical sensors.',
            status='SECURE',
            risk_level='LOW',
            center_lat=29.3200,
            center_lng=72.3100,
            boundary_polygon=json.dumps([
                [29.3450, 72.2800],
                [29.3450, 72.3400],
                [29.2950, 72.3400],
                [29.2950, 72.2800]
            ]),
            normal_zones=json.dumps([{'name': 'Coastal Guard Post', 'type': 'NORMAL', 'color': '#10b981'}]),
            warning_zones=json.dumps([{'name': 'Marsh Approach Zone', 'type': 'WARNING', 'color': '#f59e0b'}]),
            perimeter_fence_lines=json.dumps([{'name': 'Anti-Vessel Barrier D', 'type': 'FENCE', 'color': '#06b6d4'}]),
            restricted_zones=json.dumps([{'name': 'Coastal Exclusion Boundary', 'type': 'RESTRICTED', 'color': '#ef4444'}])
        ),
        Sector(
            sector_id='Sector E',
            name='Sector E — Forest Canopy & Forward Post',
            description='Dense woodland sector with automated AI tripwire alerts and thermal motion tracking nodes.',
            status='SECURE',
            risk_level='LOW',
            center_lat=29.5800,
            center_lng=72.6100,
            boundary_polygon=json.dumps([
                [29.6050, 72.5800],
                [29.6050, 72.6400],
                [29.5550, 72.6400],
                [29.5550, 72.5800]
            ]),
            normal_zones=json.dumps([{'name': 'Forward Post Base', 'type': 'NORMAL', 'color': '#10b981'}]),
            warning_zones=json.dumps([{'name': 'Forest Buffer', 'type': 'WARNING', 'color': '#f59e0b'}]),
            perimeter_fence_lines=json.dumps([{'name': 'Perimeter Smart Fence E', 'type': 'FENCE', 'color': '#06b6d4'}]),
            restricted_zones=json.dumps([{'name': 'Zero-Access Canopy Zone', 'type': 'RESTRICTED', 'color': '#ef4444'}])
        )
    ]
    db.session.add_all(sectors)

    # 3. Cameras (with Multi-Tier Zone Configurations and Health Statuses)
    cameras = [
        Camera(
            camera_id='CAM-01',
            name='Northern Sand Dune Outpost',
            sector='Sector A',
            sector_name_id='Sector A',
            location_name='Post Alpha-1 (Dune Ridge)',
            latitude=29.4520,
            longitude=72.4480,
            status='ONLINE',
            health_status='ONLINE',
            stream_type='optical',
            video_url='/uploads/processed_CAM01.mp4',
            ip_address='192.168.1.101',
            resolution='4K Ultra-HD (3840x2160)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Civilian Access Road"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Approach Warning Zone"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Perimeter Fence Line A"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Red Restricted Exclusion Zone"}'
        ),
        Camera(
            camera_id='CAM-02',
            name='River Basin Thermal Cam 1',
            sector='Sector B',
            sector_name_id='Sector B',
            location_name='Bravo Riverbank Junction',
            latitude=29.5120,
            longitude=72.5180,
            status='ALERT',
            health_status='ONLINE',
            stream_type='thermal',
            video_url='/uploads/processed_CAM02.mp4',
            ip_address='192.168.1.102',
            resolution='1080p FLIR (1920x1080)',
            fps=60,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "River Patrol Boat Dock"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Riverbank Approach Buffer"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Smart Sensor Wire B"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Riverbank Red Zone"}'
        ),
        Camera(
            camera_id='CAM-03',
            name='Ridge Canyon PTZ Optical',
            sector='Sector B',
            sector_name_id='Sector B',
            location_name='Bravo Ridge Watchtower',
            latitude=29.5240,
            longitude=72.5310,
            status='ALERT',
            health_status='ONLINE',
            stream_type='optical',
            video_url='/uploads/processed_CAM03.mp4',
            ip_address='192.168.1.103',
            resolution='4K Ultra-HD (3840x2160)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Watchtower Base Area"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Ridge Approach Slope"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Ridge Barbed Perimeter"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Ridge Exclusion Zone"}'
        ),
        Camera(
            camera_id='CAM-04',
            name='Mountain Gorge Night-Vision',
            sector='Sector C',
            sector_name_id='Sector C',
            location_name='Charlie Gorge Checkpoint',
            latitude=29.3940,
            longitude=72.3780,
            status='ALERT',
            health_status='UNSTABLE',
            stream_type='night_vision',
            video_url='/uploads/processed_CAM04.mp4',
            ip_address='192.168.1.104',
            resolution='1080p Enhanced IR (1920x1080)',
            fps=25,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Gorge Inspection Post"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Ravine Warning Slope"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Gorge Steel Fence"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Gorge Exclusion Zone"}'
        ),
        Camera(
            camera_id='CAM-05',
            name='Coastal Marsh Sensor 1',
            sector='Sector D',
            sector_name_id='Sector D',
            location_name='Delta Wetland Watch 1',
            latitude=29.3240,
            longitude=72.3140,
            status='ONLINE',
            health_status='ONLINE',
            stream_type='optical',
            video_url='/uploads/processed_CAM05.mp4',
            ip_address='192.168.1.105',
            resolution='1080p (1920x1080)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Marsh Research Dock"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Tidal Buffer Area"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Anti-Vessel Line"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Wetland Zone"}'
        ),
        Camera(
            camera_id='CAM-06',
            name='Forest Canopy Sensor Node',
            sector='Sector E',
            sector_name_id='Sector E',
            location_name='Echo Forward Post 2',
            latitude=29.5840,
            longitude=72.6140,
            status='ONLINE',
            health_status='ONLINE',
            stream_type='thermal',
            ip_address='192.168.1.106',
            resolution='1080p FLIR (1920x1080)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Campground Perimeter"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Tree Line Warning"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Canopy Smart Fence"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Canopy Red Zone"}'
        ),
        Camera(
            camera_id='CAM-07',
            name='Southern Ridge Backup Node',
            sector='Sector A',
            sector_name_id='Sector A',
            location_name='Alpha South Tower',
            latitude=29.4380,
            longitude=72.4620,
            status='OFFLINE',
            health_status='OFFLINE',
            stream_type='optical',
            ip_address='192.168.1.107',
            resolution='1080p (1920x1080)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "South Base Camp"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "South Slope Buffer"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "South Perimeter Wire"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Ridge Red Zone"}'
        ),
        Camera(
            camera_id='CAM-08',
            name='High-Altitude Relay Dome',
            sector='Sector C',
            sector_name_id='Sector C',
            location_name='Charlie Summit Station',
            latitude=29.4080,
            longitude=72.3920,
            status='ONLINE',
            health_status='ONLINE',
            stream_type='optical',
            ip_address='192.168.1.108',
            resolution='4K Ultra-HD (3840x2160)',
            fps=30,
            normal_zone='{"x": 0.05, "y": 0.35, "w": 0.28, "h": 0.50, "label": "Summit Relay Platform"}',
            warning_zone='{"x": 0.35, "y": 0.30, "w": 0.25, "h": 0.55, "label": "Cliff Warning Zone"}',
            perimeter_line='{"x1": 0.62, "y1": 0.20, "x2": 0.62, "y2": 0.90, "label": "Summit Razor Wire"}',
            restricted_zone='{"x": 0.65, "y": 0.25, "w": 0.32, "h": 0.65, "label": "Restricted Summit Red Zone"}'
        )
    ]
    db.session.add_all(cameras)
    db.session.commit()

    # 4. Uploaded Video Sample (CAM-02 in Sector B)
    sample_upload = VideoUpload(
        upload_id='VID-2026-001',
        camera_id='CAM-02',
        sector_id='Sector B',
        filename='CAM02.mp4',
        file_path='/uploads/CAM02.mp4',
        file_size_mb=4.3,
        duration_seconds=60.0,
        status='COMPLETED',
        analysis_progress=100,
        total_detections=6,
        total_incidents=2,
        events_summary=json.dumps([
            {'step': 1, 'video_timestamp': '00:05', 'object': 'PERSON (95.8% Conf)', 'stage': 'STAGE_1_NORMAL', 'zone': 'River Patrol Boat Dock', 'status': 'NORMAL ACTIVITY', 'direction': 'EAST', 'risk_score': 20, 'risk_level': 'LOW', 'action_taken': 'LOGGED TELEMETRY'},
            {'step': 2, 'video_timestamp': '00:14', 'object': 'PERSON (96.2% Conf)', 'stage': 'STAGE_1_NORMAL', 'zone': 'River Patrol Boat Dock', 'status': 'NORMAL ACTIVITY', 'direction': 'EAST', 'risk_score': 20, 'risk_level': 'LOW', 'action_taken': 'LOGGED TELEMETRY'},
            {'step': 3, 'video_timestamp': '00:22', 'object': 'PERSON (94.5% Conf)', 'stage': 'STAGE_2_APPROACH', 'zone': 'Riverbank Approach Buffer', 'status': 'SUSPICIOUS ACTIVITY', 'direction': 'NORTH_EAST', 'risk_score': 55, 'risk_level': 'MEDIUM', 'action_taken': 'LOGGED TELEMETRY'},
            {'step': 4, 'video_timestamp': '00:34', 'object': 'PERSON (93.0% Conf)', 'stage': 'STAGE_3_PERIMETER', 'zone': 'Smart Sensor Wire B', 'status': 'PERIMETER ACTIVITY', 'direction': 'NORTH_EAST', 'risk_score': 72, 'risk_level': 'HIGH', 'action_taken': 'LOGGED TELEMETRY'},
            {'step': 5, 'video_timestamp': '00:42', 'object': 'INTRUDER (97.4% Conf)', 'stage': 'STAGE_4_INTRUSION', 'zone': 'Restricted Riverbank Red Zone', 'status': 'CONFIRMED INTRUSION', 'direction': 'NORTH_EAST', 'risk_score': 94, 'risk_level': 'CRITICAL', 'action_taken': 'AUTOMATIC INCIDENT CREATED'},
            {'step': 6, 'video_timestamp': '00:54', 'object': 'MULTI_PERSON (95.1% Conf)', 'stage': 'STAGE_4_INTRUSION', 'zone': 'Restricted Riverbank Red Zone', 'status': 'CONFIRMED INTRUSION', 'direction': 'EAST', 'risk_score': 96, 'risk_level': 'CRITICAL', 'action_taken': 'AUTOMATIC INCIDENT CREATED'}
        ]),
        completed_at=now - timedelta(minutes=4)
    )
    db.session.add(sample_upload)
    db.session.commit()

    # 5. Active Incidents (Unresolved on CAM-02, CAM-03, CAM-04)
    inc1_det_time = now - timedelta(minutes=12)
    inc1 = Incident(
        incident_id='INC-2026-001',
        camera_id='CAM-02',
        video_upload_id='VID-2026-001',
        sector='Sector B',
        stage='CONFIRMED_INTRUSION',
        zone_name='Restricted Riverbank Red Zone',
        video_timestamp='00:02:45',
        video_timestamp_seconds=165.0,
        detection_type='PERSON',
        object_class='Intruder',
        confidence=96.4,
        risk_score=94,
        risk_level='CRITICAL',
        movement_direction='NORTH_EAST',
        direction_description='Moving North-East across Restricted Riverbank Red Zone',
        restricted_zone_breached=True,
        person_count=1,
        start_time=inc1_det_time - timedelta(seconds=15),
        detection_time=inc1_det_time,
        end_time=inc1_det_time + timedelta(seconds=30),
        status='NEW',
        created_at=inc1_det_time
    )

    inc2_det_time = now - timedelta(minutes=28)
    inc2 = Incident(
        incident_id='INC-2026-002',
        camera_id='CAM-03',
        sector='Sector B',
        stage='CONFIRMED_INTRUSION',
        zone_name='Restricted Ridge Exclusion Zone',
        video_timestamp='00:04:12',
        video_timestamp_seconds=252.0,
        detection_type='MULTI_PERSON',
        object_class='Group of Persons',
        confidence=93.8,
        risk_score=88,
        risk_level='CRITICAL',
        movement_direction='SOUTH_EAST',
        direction_description='Coordinated group movement South-East near Ridge Watchtower',
        restricted_zone_breached=True,
        person_count=3,
        start_time=inc2_det_time - timedelta(seconds=15),
        detection_time=inc2_det_time,
        end_time=inc2_det_time + timedelta(seconds=30),
        status='ACKNOWLEDGED',
        acknowledged_by='Capt. Priya Sharma',
        acknowledged_at=inc2_det_time + timedelta(minutes=2),
        created_at=inc2_det_time
    )

    inc3_det_time = now - timedelta(minutes=45)
    inc3 = Incident(
        incident_id='INC-2026-003',
        camera_id='CAM-04',
        sector='Sector C',
        stage='CONFIRMED_INTRUSION',
        zone_name='Restricted Gorge Exclusion Zone',
        video_timestamp='00:01:50',
        video_timestamp_seconds=110.0,
        detection_type='INTRUDER',
        object_class='Intruder with Load',
        confidence=91.2,
        risk_score=82,
        risk_level='CRITICAL',
        movement_direction='NORTH',
        direction_description='Ascending North along Ravine boundary',
        restricted_zone_breached=True,
        person_count=1,
        start_time=inc3_det_time - timedelta(seconds=15),
        detection_time=inc3_det_time,
        end_time=inc3_det_time + timedelta(seconds=30),
        status='UNDER_INVESTIGATION',
        acknowledged_by='Col. Rajesh Varma',
        acknowledged_at=inc3_det_time + timedelta(minutes=1),
        investigated_by='Patrol Unit Echo-4',
        investigated_at=inc3_det_time + timedelta(minutes=10),
        created_at=inc3_det_time
    )

    # 6. Resolved Incidents (Saved permanently in Incident History)
    inc4_det_time = now - timedelta(hours=3, minutes=15)
    inc4 = Incident(
        incident_id='INC-2026-004',
        camera_id='CAM-01',
        sector='Sector A',
        stage='CONFIRMED_INTRUSION',
        zone_name='Red Restricted Exclusion Zone',
        video_timestamp='00:03:10',
        video_timestamp_seconds=190.0,
        detection_type='PERSON',
        object_class='Civilian Trespasser',
        confidence=89.5,
        risk_score=76,
        risk_level='HIGH',
        movement_direction='WEST',
        direction_description='Approached outer dune marker',
        restricted_zone_breached=True,
        person_count=1,
        start_time=inc4_det_time - timedelta(seconds=15),
        detection_time=inc4_det_time,
        end_time=inc4_det_time + timedelta(seconds=30),
        status='RESOLVED',
        acknowledged_by='Capt. Priya Sharma',
        acknowledged_at=inc4_det_time + timedelta(minutes=3),
        investigated_by='Dune Patrol Alpha',
        investigated_at=inc4_det_time + timedelta(minutes=12),
        resolved_by='Col. Rajesh Varma',
        resolved_at=inc4_det_time + timedelta(minutes=25),
        resolution_notes='Civilian herder strayed across outer fence. Intercepted by Dune Patrol Alpha and safely escorted back. No breach intended.',
        created_at=inc4_det_time
    )

    inc5_det_time = now - timedelta(hours=8, minutes=40)
    inc5 = Incident(
        incident_id='INC-2026-005',
        camera_id='CAM-05',
        sector='Sector D',
        stage='CONFIRMED_INTRUSION',
        zone_name='Restricted Wetland Zone',
        video_timestamp='00:05:22',
        video_timestamp_seconds=322.0,
        detection_type='VEHICLE',
        object_class='Unregistered ATV',
        confidence=94.0,
        risk_score=78,
        risk_level='HIGH',
        movement_direction='SOUTH',
        direction_description='ATV tracks spotted along salt flat perimeter',
        restricted_zone_breached=True,
        person_count=2,
        start_time=inc5_det_time - timedelta(seconds=15),
        detection_time=inc5_det_time,
        end_time=inc5_det_time + timedelta(seconds=30),
        status='RESOLVED',
        acknowledged_by='Dr. Vikram Mehta',
        acknowledged_at=inc5_det_time + timedelta(minutes=2),
        resolved_by='Capt. Priya Sharma',
        resolved_at=inc5_det_time + timedelta(minutes=40),
        resolution_notes='Wildlife sanctuary survey team with authorized permit. Transponder code re-synced.',
        created_at=inc5_det_time
    )

    inc6_det_time = now - timedelta(days=1, hours=2)
    inc6 = Incident(
        incident_id='INC-2026-006',
        camera_id='CAM-06',
        sector='Sector E',
        stage='CONFIRMED_INTRUSION',
        zone_name='Restricted Canopy Red Zone',
        video_timestamp='00:02:18',
        video_timestamp_seconds=138.0,
        detection_type='INTRUDER',
        object_class='Infiltrator',
        confidence=97.8,
        risk_score=96,
        risk_level='CRITICAL',
        movement_direction='NORTH_EAST',
        direction_description='Night crossing under dense canopy',
        restricted_zone_breached=True,
        person_count=1,
        start_time=inc6_det_time - timedelta(seconds=15),
        detection_time=inc6_det_time,
        end_time=inc6_det_time + timedelta(seconds=30),
        status='RESOLVED',
        acknowledged_by='Col. Rajesh Varma',
        acknowledged_at=inc6_det_time + timedelta(minutes=1),
        investigated_by='Echo Special Recon Team',
        investigated_at=inc6_det_time + timedelta(minutes=8),
        resolved_by='Col. Rajesh Varma',
        resolved_at=inc6_det_time + timedelta(minutes=35),
        resolution_notes='Suspect apprehended at Forward Post 2. Contraband seized and suspect transferred to military intelligence custody.',
        created_at=inc6_det_time
    )

    db.session.add_all([inc1, inc2, inc3, inc4, inc5, inc6])
    db.session.commit()

    # 7. Incident Timelines
    timelines = [
        # INC-2026-001 Timeline
        IncidentTimeline(
            incident_id='INC-2026-001',
            timestamp=inc1.start_time,
            event_title='45s Buffer Recording Initiated',
            event_description='Neural analyzer detected target approach from River Patrol Base.',
            event_type='MONITORING',
            actor='FLIR Video Streamer'
        ),
        IncidentTimeline(
            incident_id='INC-2026-001',
            timestamp=inc1.detection_time - timedelta(seconds=6),
            event_title='Target Approached Riverbank Buffer (Stage 2)',
            event_description='Person observed moving North-East towards perimeter boundary.',
            event_type='DETECTION',
            actor='YOLOv8x Classifier'
        ),
        IncidentTimeline(
            incident_id='INC-2026-001',
            timestamp=inc1.detection_time,
            event_title='Restricted Riverbank Zone Breached (Stage 4)',
            event_description='Restricted Red Zone entered. Confirmed intrusion event logged.',
            event_type='ZONE_ENTRY',
            actor='Spatial Geofence Engine'
        ),
        IncidentTimeline(
            incident_id='INC-2026-001',
            timestamp=inc1.detection_time + timedelta(seconds=1),
            event_title='Smart Threat Risk Score Evaluated: 94/100',
            event_description='Classified as CRITICAL due to restricted zone penetration and rapid NE vector.',
            event_type='RISK_EVAL',
            actor='Smart Risk Engine'
        ),
        IncidentTimeline(
            incident_id='INC-2026-001',
            timestamp=inc1.detection_time + timedelta(seconds=2),
            event_title='Critical Intrusion Alert Dispatched',
            event_description='Command center sirens triggered. Sector B marked in ALERT state.',
            event_type='ALERT_DISPATCH',
            actor='Tactical Dispatcher'
        )
    ]
    db.session.add_all(timelines)

    # 8. Alerts
    alerts = [
        Alert(
            alert_id='ALERT-001',
            incident_id='INC-2026-001',
            camera_id='CAM-02',
            detection_type='PERSON',
            message='CRITICAL INTRUSION: Restricted zone breach at Riverbank Junction (Sector B)',
            confidence=96.4,
            risk_score=94,
            priority='CRITICAL',
            movement_direction='NORTH_EAST',
            status='ACTIVE',
            created_at=inc1.detection_time
        ),
        Alert(
            alert_id='ALERT-002',
            incident_id='INC-2026-002',
            camera_id='CAM-03',
            detection_type='MULTI_PERSON',
            message='CRITICAL INTRUSION: Group of 3 moving South-East in Sector B',
            confidence=93.8,
            risk_score=88,
            priority='CRITICAL',
            movement_direction='SOUTH_EAST',
            status='ACTIVE',
            created_at=inc2.detection_time
        ),
        Alert(
            alert_id='ALERT-003',
            incident_id='INC-2026-003',
            camera_id='CAM-04',
            detection_type='INTRUDER',
            message='HIGH THREAT: Night-vision perimeter crossing in Charlie Gorge (Sector C)',
            confidence=91.2,
            risk_score=82,
            priority='HIGH',
            movement_direction='NORTH',
            status='ACTIVE',
            created_at=inc3.detection_time
        )
    ]
    db.session.add_all(alerts)

    # 9. Initial Detections for Telemetry
    sample_detections = [
        Detection(camera_id='CAM-01', tracking_id='TRK-01', object_type='PERSON', confidence=95.4, stage='STAGE_1_NORMAL', zone_name='Civilian Access Road', video_timestamp='00:01:20', video_timestamp_seconds=80.0, bbox_x=0.15, bbox_y=0.45, bbox_w=0.10, bbox_h=0.25, movement_direction='EAST', is_in_restricted_zone=False, person_count=1, timestamp=now - timedelta(minutes=5)),
        Detection(camera_id='CAM-02', tracking_id='TRK-02', object_type='INTRUDER', confidence=96.4, stage='STAGE_4_INTRUSION', zone_name='Restricted Riverbank Red Zone', video_timestamp='00:02:45', video_timestamp_seconds=165.0, bbox_x=0.72, bbox_y=0.35, bbox_w=0.15, bbox_h=0.35, movement_direction='NORTH_EAST', is_in_restricted_zone=True, person_count=1, timestamp=inc1.detection_time),
        Detection(camera_id='CAM-03', tracking_id='TRK-03', object_type='MULTI_PERSON', confidence=93.8, stage='STAGE_4_INTRUSION', zone_name='Restricted Ridge Exclusion Zone', video_timestamp='00:04:12', video_timestamp_seconds=252.0, bbox_x=0.68, bbox_y=0.30, bbox_w=0.20, bbox_h=0.40, movement_direction='SOUTH_EAST', is_in_restricted_zone=True, person_count=3, timestamp=inc2.detection_time),
        Detection(camera_id='CAM-05', tracking_id='TRK-04', object_type='VEHICLE', confidence=97.1, stage='STAGE_1_NORMAL', zone_name='Marsh Research Dock', video_timestamp='00:03:00', video_timestamp_seconds=180.0, bbox_x=0.12, bbox_y=0.50, bbox_w=0.25, bbox_h=0.30, movement_direction='SOUTH', is_in_restricted_zone=False, person_count=1, timestamp=now - timedelta(hours=1)),
        Detection(camera_id='CAM-06', tracking_id='TRK-05', object_type='PERSON', confidence=94.2, stage='STAGE_1_NORMAL', zone_name='Campground Perimeter', video_timestamp='00:02:15', video_timestamp_seconds=135.0, bbox_x=0.20, bbox_y=0.40, bbox_w=0.12, bbox_h=0.28, movement_direction='EAST', is_in_restricted_zone=False, person_count=1, timestamp=now - timedelta(hours=2))
    ]
    db.session.add_all(sample_detections)

    # 10. System Settings
    settings = [
        SystemSetting(key='yolo_confidence_threshold', value='0.65', category='AI', description='Minimum detection confidence score'),
        SystemSetting(key='risk_critical_threshold', value='80', category='AI', description='Threshold for CRITICAL risk classification'),
        SystemSetting(key='buffer_pre_seconds', value='15', category='SURVEILLANCE', description='Pre-incident replay buffer in seconds'),
        SystemSetting(key='buffer_post_seconds', value='30', category='SURVEILLANCE', description='Post-incident replay buffer in seconds')
    ]
    db.session.add_all(settings)

    # 11. Initial Audit Log
    db.session.add(AuditLog(
        username='System',
        action='SYSTEM_BOOT',
        details='BorderAI Command System initialized with 5 sectors, 8 cameras, and active geofences.'
    ))

    db.session.commit()
    print("Border AI database successfully seeded with realistic sectors, multi-tier zones, and smart incident datasets!")
