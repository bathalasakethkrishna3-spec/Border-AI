from datetime import datetime
from flask import Blueprint, request, jsonify
from models.detection import Detection
from services.detection_service import DetectionService
from utils.auth_helper import jwt_required_custom

detections_bp = Blueprint('detections', __name__, url_prefix='/api/detections')

@detections_bp.route('', methods=['GET'])
def get_detections():
    camera_id = request.args.get('camera_id')
    object_type = request.args.get('object_type')
    limit = request.args.get('limit', 50, type=int)

    query = Detection.query
    if camera_id and camera_id != 'ALL':
        query = query.filter_by(camera_id=camera_id)
    if object_type and object_type != 'ALL':
        query = query.filter_by(object_type=object_type)

    detections = query.order_by(Detection.timestamp.desc()).limit(limit).all()
    return jsonify([d.to_dict() for d in detections]), 200

@detections_bp.route('', methods=['POST'])
def create_detection():
    """
    Primary ingestion endpoint for YOLO / OpenCV object detection pipelines.
    Payload:
    {
      "camera_id": "CAM-01",
      "object_type": "PERSON",
      "confidence": 96.5,
      "bbox": {"x": 0.4, "y": 0.3, "w": 0.2, "h": 0.4},
      "timestamp": "2026-08-30T10:23:00"
    }
    """
    data = request.get_json() or {}
    if not data.get('camera_id') or not data.get('object_type'):
        return jsonify({'error': 'camera_id and object_type are required'}), 400

    try:
        result = DetectionService.process_detection(data)
        return jsonify({
            'message': 'Detection processed successfully',
            'data': result
        }), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        return jsonify({'error': f'Failed to process detection: {str(e)}'}), 500

@detections_bp.route('/simulate', methods=['POST'])
@jwt_required_custom
def simulate_detection():
    """Convenient endpoint for triggering instant simulation events."""
    data = request.get_json() or {}
    camera_id = data.get('camera_id', 'CAM-01')
    object_type = data.get('object_type', 'PERSON')
    confidence = float(data.get('confidence', 92.5))
    person_count = int(data.get('person_count', 1))

    from models.camera import Camera
    camera = Camera.query.filter_by(camera_id=camera_id).first()
    rz = camera.get_restricted_zone() if camera else {'x': 0.65, 'y': 0.25, 'w': 0.30, 'h': 0.50}

    sim_data = {
        'camera_id': camera_id,
        'object_type': object_type,
        'confidence': confidence,
        'person_count': person_count,
        'bbox': {
            'x': float(rz.get('x', 0.65)) + 0.05,
            'y': float(rz.get('y', 0.25)) + 0.05,
            'w': 0.15,
            'h': 0.30
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    
    try:
        result = DetectionService.process_detection(sim_data)
        return jsonify({
            'message': f'Simulated {object_type} detection on {camera_id}',
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
