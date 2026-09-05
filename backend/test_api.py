import unittest
import json
from app import create_app
from models import db
from models.user import User
from models.camera import Camera
from models.sector import Sector
from models.incident import Incident
from models.alert import Alert

class BorderAIApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_01_root_and_health(self):
        # Root serves React SPA frontend index.html
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)

        # Health endpoint serves JSON
        health = self.client.get('/api/health')
        self.assertEqual(health.status_code, 200)
        data = json.loads(health.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('BorderAI', data['service'])

    def test_02_auth_login(self):
        # Admin login
        res = self.client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'].upper(), 'ADMIN')

        # Operator login
        op_res = self.client.post('/api/auth/login', json={
            'username': 'operator',
            'password': 'operator123'
        })
        self.assertEqual(op_res.status_code, 200)
        self.assertEqual(json.loads(op_res.data)['user']['role'].upper(), 'OPERATOR')

        # Analyst login
        an_res = self.client.post('/api/auth/login', json={
            'username': 'analyst',
            'password': 'analyst123'
        })
        self.assertEqual(an_res.status_code, 200)
        self.assertEqual(json.loads(an_res.data)['user']['role'].upper(), 'ANALYST')

    def test_03_sectors_endpoints(self):
        res = self.client.get('/api/sectors')
        self.assertEqual(res.status_code, 200)
        sectors = json.loads(res.data)
        self.assertGreaterEqual(len(sectors), 5)
        
        # Test specific sector detail
        sec_res = self.client.get('/api/sectors/Sector B')
        self.assertEqual(sec_res.status_code, 200)
        sec_b = json.loads(sec_res.data)
        self.assertEqual(sec_b['sector_id'], 'Sector B')
        self.assertIn('boundary_polygon', sec_b)
        self.assertIn('zones', sec_b)
        self.assertGreater(len(sec_b['cameras']), 0)

    def test_04_camera_smart_opening_and_zones(self):
        # CAM-02 has active incident -> smart opening returns active_incident
        res = self.client.get('/api/cameras/CAM-02')
        self.assertEqual(res.status_code, 200)
        cam = json.loads(res.data)
        self.assertIn('zones', cam)
        self.assertIn('restricted_zone', cam['zones'])
        self.assertIn('normal_zone', cam['zones'])

        # CAM-05 is resolved -> no active incident
        res5 = self.client.get('/api/cameras/CAM-05')
        self.assertEqual(res5.status_code, 200)
        cam5 = json.loads(res5.data)
        self.assertIsNone(cam5['active_incident'])

    def test_05_video_upload_to_existing_camera(self):
        # Upload video directly to CAM-02 -> automatically uses CAM-02 sector & zones
        res = self.client.post('/api/cameras/CAM-02/upload-video', json={
            'filename': 'patrol_test_clip.mp4',
            'duration_seconds': 60.0
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data['camera_id'], 'CAM-02')
        self.assertEqual(data['sector'], 'Sector B')
        self.assertIn('analysis', data)
        self.assertGreater(data['analysis']['total_detections'], 0)
        self.assertGreater(data['analysis']['total_incidents'], 0)

    def test_06_incident_workflow(self):
        login_res = self.client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        token = json.loads(login_res.data)['token']
        headers = {'Authorization': f'Bearer {token}'}

        inc = Incident.query.filter_by(status='NEW').first()
        if inc:
            inc_id = inc.incident_id
            # Acknowledge
            res1 = self.client.post(f'/api/incidents/{inc_id}/acknowledge', json={'actor': 'Officer Test'}, headers=headers)
            self.assertEqual(res1.status_code, 200)

            # Investigate
            res2 = self.client.post(f'/api/incidents/{inc_id}/investigate', json={'actor': 'Officer Test'}, headers=headers)
            self.assertEqual(res2.status_code, 200)

            # Resolve
            res3 = self.client.post(f'/api/incidents/{inc_id}/resolve', json={
                'notes': 'Perimeter sweep completed. All clear.'
            }, headers=headers)
            self.assertEqual(res3.status_code, 200)
            self.assertEqual(res3.json['incident']['status'], 'RESOLVED')

    def test_07_assistant_queries(self):
        # Query 1: Which sector has the most alerts?
        res1 = self.client.post('/api/assistant/query', json={'query': 'Which sector has the most alerts today?'})
        self.assertEqual(res1.status_code, 200)
        data1 = json.loads(res1.data)
        self.assertIn('answer', data1)

        # Query 2: Which cameras are offline?
        res2 = self.client.post('/api/assistant/query', json={'query': 'Which cameras are offline?'})
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)
        self.assertIn('answer', data2)

    def test_08_analytics_and_correlations(self):
        res = self.client.get('/api/analytics/dashboard')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('active_cameras', data)
        self.assertIn('environmental_status', data)
        self.assertIn('cross_camera_correlations', data)

if __name__ == '__main__':
    unittest.main()
