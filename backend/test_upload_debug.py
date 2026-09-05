from app import create_app
from models import db
from models.camera import Camera
from models.video_upload import VideoUpload
from services.video_analysis_service import VideoAnalysisService

app = create_app()

with app.app_context():
    cam = Camera.query.filter_by(camera_id='CAM-01').first()
    print("Initial CAM-01 video_url:", repr(cam.video_url))
    
    # Simulate upload
    upload = VideoUpload(
        upload_id="VID-DEBUG-001",
        camera_id=cam.camera_id,
        sector_id=cam.sector,
        filename="patrol_recon_cam01.mp4",
        file_path="/uploads/patrol_recon_cam01.mp4",
        file_size_mb=18.5,
        duration_seconds=60.0,
        status='PROCESSING',
        analysis_progress=0
    )
    cam.video_url = "/uploads/patrol_recon_cam01.mp4"
    db.session.add(upload)
    db.session.add(cam)
    db.session.commit()
    
    print("After commit CAM-01 video_url:", repr(cam.video_url))
    
    # Run analysis
    res = VideoAnalysisService.analyze_uploaded_video("VID-DEBUG-001")
    
    cam_reloaded = Camera.query.filter_by(camera_id='CAM-01').first()
    print("After analysis CAM-01 video_url:", repr(cam_reloaded.video_url))
    print("cam_reloaded.to_dict()['video_url']:", repr(cam_reloaded.to_dict()['video_url']))
