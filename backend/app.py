import os
import logging
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from config import Config
from models import db
from seed import seed_database

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('BorderAI')

def create_app(config_class=Config):
    # Set static folder to frontend dist if available
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    app = Flask(__name__, static_folder=dist_dir)
    app.config.from_object(config_class)

    # Enable CORS for all routes (supports localhost & production domains)
    cors_origins = os.environ.get('CORS_ORIGINS', '*')
    CORS(app, resources={r"/api/*": {"origins": cors_origins}, r"/uploads/*": {"origins": cors_origins}})

    # Ensure uploads folder exists
    upload_folder = os.path.join(app.root_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # Initialize database
    db.init_app(app)

    # Register Blueprints
    from routes.auth import auth_bp
    from routes.sectors import sectors_bp
    from routes.cameras import cameras_bp
    from routes.incidents import incidents_bp
    from routes.alerts import alerts_bp
    from routes.analytics import analytics_bp
    from routes.detections import detections_bp
    from routes.notifications import notifications_bp
    from routes.users import users_bp
    from routes.audit_logs import audit_logs_bp
    from routes.settings import settings_bp
    from routes.assistant import assistant_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(sectors_bp)
    app.register_blueprint(cameras_bp)
    app.register_blueprint(incidents_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(detections_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(audit_logs_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(assistant_bp)

    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename, conditional=True)
        response.headers['Accept-Ranges'] = 'bytes'
        return response

    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'BorderAI Unified Command Platform',
            'version': '2.5.0-ENTERPRISE',
            'environment': os.environ.get('FLASK_ENV', 'production'),
            'timestamp': str(os.environ.get('TZ', 'UTC'))
        })

    # Serve Production Frontend (SPA routing)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/') or path == 'api':
            return jsonify({'error': 'API endpoint not found'}), 404
        
        # If file exists in dist, serve it
        full_path = os.path.join(dist_dir, path)
        if path and os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(dist_dir, path)
        
        # Otherwise serve index.html for client-side routing
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_dir, 'index.html')
        
        return jsonify({
            'platform': 'BORDER AI - Intelligent Video Analytics Platform',
            'status': 'OPERATIONAL',
            'version': '2.5.0-ENTERPRISE',
            'api_base': '/api',
            'note': 'Frontend dist not found. Run "npm run build" in frontend/'
        })

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'API endpoint not found'}), 404
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_dir, 'index.html')
        return jsonify({'error': 'Page not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

    # Auto seed and reconcile database on startup
    with app.app_context():
        try:
            db.create_all()
            from models.user import User
            if User.query.count() == 0:
                seed_database()
            else:
                # Reconcile any existing desynchronized incident/alert/camera rows
                from models.incident import Incident
                from models.alert import Alert
                from models.camera import Camera

                # 1. Sync incidents whose alerts are resolved
                active_incs = Incident.query.filter(Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])).all()
                for inc in active_incs:
                    als = Alert.query.filter_by(incident_id=inc.incident_id).all()
                    if als and all(a.status == 'RESOLVED' for a in als):
                        inc.status = 'RESOLVED'
                        inc.resolved_by = inc.resolved_by or 'Operator'
                        inc.resolved_at = inc.resolved_at or datetime.utcnow()

                # 2. Sync alerts whose incidents are resolved
                active_als = Alert.query.filter_by(status='ACTIVE').all()
                for al in active_als:
                    if al.incident_id:
                        inc = Incident.query.filter_by(incident_id=al.incident_id).first()
                        if inc and inc.status == 'RESOLVED':
                            al.status = 'RESOLVED'
                            al.resolved_by = al.resolved_by or 'Operator'
                            al.resolved_at = al.resolved_at or datetime.utcnow()

                db.session.commit()

                # 3. Synchronize all camera statuses
                for cam in Camera.query.all():
                    cam.sync_status()
        except Exception as e:
            logger.warning(f"Database initialization/sync note: {e}")
            seed_database()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f"  BORDER AI - Intelligent Video Analytics Platform     ")
    print(f"  Unified Production Server running at:               ")
    print(f"  --> http://127.0.0.1:{port}                         ")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=False)
