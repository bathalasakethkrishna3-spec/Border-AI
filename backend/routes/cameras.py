import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models import db
from models.camera import Camera
from models.alert import Alert
from models.detection import Detection
from models.incident import Incident
from models.video_upload import VideoUpload
from models.audit_log import AuditLog
from models.notification import Notification
from services.video_analysis_service import VideoAnalysisService
from utils.auth_helper import jwt_required_custom

cameras_bp = Blueprint('cameras', __name__, url_prefix='/api/cameras')

@cameras_bp.route('', methods=['GET'])
def get_cameras():
    sector = request.args.get('sector')
    status = request.args.get('status')
    health_status = request.args.get('health_status')
    
    query = Camera.query
    if sector and sector != 'ALL':
        query = query.filter_by(sector=sector)
    if status and status != 'ALL':
        query = query.filter_by(status=status)
    if health_status and health_status != 'ALL':
        query = query.filter_by(health_status=health_status)
        
    cameras = query.order_by(Camera.camera_id.asc()).all()
    return jsonify([c.to_dict(include_active_incident=True, include_24h_incidents=True) for c in cameras]), 200

@cameras_bp.route('/<identifier>', methods=['GET'])
def get_camera(identifier):
    if identifier.isdigit():
        camera = Camera.query.get(int(identifier))
    else:
        camera = Camera.query.filter_by(camera_id=identifier).first()
        
    if not camera:
        return jsonify({'error': 'Camera not found'}), 404
        
    # Get recent detections for this camera
    recent_detections = Detection.query.filter_by(camera_id=camera.camera_id)\
        .order_by(Detection.timestamp.desc()).limit(20).all()
        
    # Get recent alerts for this camera
    recent_alerts = Alert.query.filter_by(camera_id=camera.camera_id)\
        .order_by(Alert.created_at.desc()).limit(10).all()

    # Get recent incidents for this camera
    recent_incidents = Incident.query.filter_by(camera_id=camera.camera_id)\
        .order_by(Incident.detection_time.desc()).limit(10).all()

    # Get recent video uploads for this camera
    recent_uploads = VideoUpload.query.filter_by(camera_id=camera.camera_id)\
        .order_by(VideoUpload.created_at.desc()).limit(5).all()
        
    cam_data = camera.to_dict(include_active_incident=True, include_24h_incidents=True)
    cam_data['recent_detections'] = [d.to_dict() for d in recent_detections]
    cam_data['recent_alerts'] = [a.to_dict() for a in recent_alerts]
    cam_data['recent_incidents'] = [inc.to_dict(include_timeline=False) for inc in recent_incidents]
    cam_data['recent_uploads'] = [u.to_dict() for u in recent_uploads]
    
    return jsonify(cam_data), 200

@cameras_bp.route('/<identifier>/upload-video', methods=['POST'])
def upload_camera_video(identifier):
    """
    UPLOAD VIDEO DIRECTLY TO AN EXISTING CAMERA:
    Permanently associates the uploaded video with the camera (camera.video_url).
    Automatically uses the existing camera location, sector, sector boundary,
    normal zones, warning zones, perimeter fence line, and restricted zones.
    Analyzes the entire uploaded video from 00:00 to end.
    """
    if identifier.isdigit():
        camera = Camera.query.get(int(identifier))
    else:
        camera = Camera.query.filter_by(camera_id=identifier).first()

    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    now_utc = datetime.utcnow()
    filename = f"surveillance_{camera.camera_id}_{now_utc.strftime('%Y%m%d_%H%M%S')}.mp4"
    file_path = f"/uploads/{filename}"
    file_size_mb = 18.5
    duration_seconds = 60.0

    # Handle file upload if multipart
    if 'file' in request.files:
        file = request.files['file']
        if file.filename:
            sec_name = secure_filename(file.filename)
            filename = f"{camera.camera_id}_{sec_name}"
            upload_folder = os.path.join(current_app.root_path, 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            saved_path = os.path.join(upload_folder, filename)
            file.save(saved_path)
            file_path = f"/uploads/{filename}"
            try:
                file_size_mb = round(os.path.getsize(saved_path) / (1024 * 1024), 2)
            except Exception:
                file_size_mb = 12.0
    else:
        try:
            data = json.loads(request.data.decode('utf-8')) if request.data else {}
        except Exception:
            data = request.get_json(force=True, silent=True) or {}
        if not data and request.form:
            data = request.form
        if data and 'filename' in data and data['filename']:
            filename = data['filename']
            file_path = f"/uploads/{filename}"
        if data and 'duration_seconds' in data:
            try:
                duration_seconds = float(data['duration_seconds'])
            except Exception:
                duration_seconds = 60.0

    # Permanently assign uploaded video to this camera
    camera.video_url = file_path
    Camera.query.filter_by(camera_id=camera.camera_id).update({'video_url': file_path})

    # Generate Unique Upload ID
    count = VideoUpload.query.count() + 1
    upload_id = f"VID-{now_utc.year}-{count:03d}"
    while VideoUpload.query.filter_by(upload_id=upload_id).first():
        count += 1
        upload_id = f"VID-{now_utc.year}-{count:03d}"

    # Create Video Upload Entity
    upload = VideoUpload(
        upload_id=upload_id,
        camera_id=camera.camera_id,
        sector_id=camera.sector,
        filename=filename,
        file_path=file_path,
        file_size_mb=file_size_mb,
        duration_seconds=duration_seconds,
        status='PROCESSING',
        analysis_progress=0
    )
    db.session.add(upload)
    db.session.add(camera)
    db.session.commit()

    # Launch Full-Length Video AI Analysis Pipeline
    analysis_result = VideoAnalysisService.analyze_uploaded_video(upload_id)

    return jsonify({
        'message': f'Video successfully uploaded and assigned to camera {camera.camera_id}',
        'camera_id': camera.camera_id,
        'sector': camera.sector,
        'location_name': camera.location_name,
        'video_url': camera.video_url,
        'zones_used': camera.to_dict()['zones'],
        'analysis': analysis_result
    }), 201

@cameras_bp.route('/<identifier>/uploads', methods=['GET'])
def get_camera_uploads(identifier):
    if identifier.isdigit():
        camera = Camera.query.get(int(identifier))
    else:
        camera = Camera.query.filter_by(camera_id=identifier).first()

    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    uploads = VideoUpload.query.filter_by(camera_id=camera.camera_id)\
        .order_by(VideoUpload.created_at.desc()).all()
    return jsonify([u.to_dict() for u in uploads]), 200

@cameras_bp.route('/<identifier>/uploads/<upload_id>', methods=['GET'])
def get_upload_detail(identifier, upload_id):
    upload = VideoUpload.query.filter_by(upload_id=upload_id).first()
    if not upload:
        return jsonify({'error': 'Video upload not found'}), 404

    detections = Detection.query.filter_by(video_upload_id=upload.upload_id)\
        .order_by(Detection.video_timestamp_seconds.asc()).all()

    incidents = Incident.query.filter_by(video_upload_id=upload.upload_id)\
        .order_by(Incident.detection_time.asc()).all()

    data = upload.to_dict()
    data['detections'] = [d.to_dict() for d in detections]
    data['incidents'] = [inc.to_dict(include_timeline=True) for inc in incidents]
    return jsonify(data), 200

@cameras_bp.route('', methods=['POST'])
@jwt_required_custom
def create_camera():
    data = request.get_json() or {}
    camera_id = data.get('camera_id', '').strip().upper()
    name = data.get('name', '').strip()
    sector = data.get('sector', 'Sector A').strip()
    location_name = data.get('location_name', '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    status = data.get('status', 'ONLINE').strip()
    health_status = data.get('health_status', 'ONLINE').strip()
    video_url = data.get('video_url', '')
    stream_type = data.get('stream_type', 'optical')
    ip_address = data.get('ip_address', '192.168.1.100')
    resolution = data.get('resolution', '1080p (1920x1080)')
    fps = int(data.get('fps', 30))

    if not camera_id or not name or not location_name or latitude is None or longitude is None:
        return jsonify({'error': 'camera_id, name, location_name, latitude and longitude are required'}), 400

    existing = Camera.query.filter_by(camera_id=camera_id).first()
    if existing:
        return jsonify({'error': f"Camera with ID '{camera_id}' already exists"}), 409

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        return jsonify({'error': 'Latitude and Longitude must be valid numbers'}), 400

    new_camera = Camera(
        camera_id=camera_id,
        name=name,
        sector=sector,
        sector_name_id=sector,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        status=status,
        health_status=health_status,
        video_url=video_url,
        stream_type=stream_type,
        ip_address=ip_address,
        resolution=resolution,
        fps=fps
    )
    db.session.add(new_camera)

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='CAMERA_ADDED',
        details=f"New camera {camera_id} ({name}) added in {sector} by {username}."
    )
    db.session.add(audit)

    db.session.commit()
    return jsonify({'message': 'Camera created successfully', 'camera': new_camera.to_dict()}), 201

@cameras_bp.route('/<identifier>', methods=['PUT'])
@jwt_required_custom
def update_camera(identifier):
    if identifier.isdigit():
        camera = Camera.query.get(int(identifier))
    else:
        camera = Camera.query.filter_by(camera_id=identifier).first()

    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        camera.name = data['name'].strip()
    if 'sector' in data:
        camera.sector = data['sector'].strip()
        camera.sector_name_id = data['sector'].strip()
    if 'location_name' in data:
        camera.location_name = data['location_name'].strip()
    if 'latitude' in data:
        try:
            camera.latitude = float(data['latitude'])
        except ValueError:
            pass
    if 'longitude' in data:
        try:
            camera.longitude = float(data['longitude'])
        except ValueError:
            pass
    if 'status' in data:
        camera.status = data['status'].strip()
    if 'health_status' in data:
        camera.health_status = data['health_status'].strip()
    if 'video_url' in data:
        camera.video_url = data['video_url']
    if 'stream_type' in data:
        camera.stream_type = data['stream_type']
    if 'ip_address' in data:
        camera.ip_address = data['ip_address']
    if 'resolution' in data:
        camera.resolution = data['resolution']
    if 'fps' in data:
        camera.fps = int(data['fps'])

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='CAMERA_UPDATED',
        details=f"Camera {camera.camera_id} configuration updated by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Camera updated successfully', 'camera': camera.to_dict()}), 200

@cameras_bp.route('/<identifier>', methods=['DELETE'])
@jwt_required_custom
def delete_camera(identifier):
    if identifier.isdigit():
        camera = Camera.query.get(int(identifier))
    else:
        camera = Camera.query.filter_by(camera_id=identifier).first()

    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    cam_id = camera.camera_id
    db.session.delete(camera)

    user = getattr(request, 'current_user', None)
    username = user.username if user else 'Operator'
    audit = AuditLog(
        user_id=user.id if user else None,
        username=username,
        action='CAMERA_DELETED',
        details=f"Camera {cam_id} decommissioned and deleted by {username}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'Camera {cam_id} deleted successfully'}), 200
