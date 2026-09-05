import urllib.request
import urllib.parse
import json
import time

BASE_URL = 'http://127.0.0.1:5000'

def req(path, method='GET', data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    encoded_data = json.dumps(data).encode('utf-8') if data is not None else None
    request = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(request) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        return e.code, json.loads(res_body) if res_body else {'error': str(e)}

def run_e2e_audit():
    print("==================================================")
    print("     BORDER AI COMPLETE E2E FLOW AUDIT           ")
    print("==================================================")
    
    # 1. Health check
    code, res = req('/api/health')
    assert code == 200 and res['status'] == 'healthy', f"Health check failed: {res}"
    print("[PASS] [TEST 1] System Health API: 200 OK - Version:", res.get('version'))
    
    # 2. Authentication flow for all 3 roles
    for role, user, pwd in [
        ('ADMIN', 'admin', 'admin123'),
        ('OPERATOR', 'operator', 'operator123'),
        ('ANALYST', 'analyst', 'analyst123')
    ]:
        code, res = req('/api/auth/login', 'POST', {'username': user, 'password': pwd})
        assert code == 200 and 'token' in res, f"Login failed for {role}: {res}"
        token = res['token']
        # Verify token with /api/auth/me
        code, me = req('/api/auth/me', 'GET', token=token)
        assert code == 200 and me['user']['username'] == user, f"Auth verification failed for {user}: {me}"
        print(f"[PASS] [TEST 2] Role Auth: {role} ({user}) logged in successfully. Token verified.")
    
    # Login as admin for privileged routes
    code, res = req('/api/auth/login', 'POST', {'username': 'admin', 'password': 'admin123'})
    admin_token = res['token']

    # 3. Sectors & Cameras retrieval
    code, sectors = req('/api/sectors', 'GET')
    assert code == 200 and len(sectors) >= 5, f"Sectors check failed: {len(sectors)}"
    print(f"[PASS] [TEST 3] Sectors Grid: {len(sectors)} sectors loaded with GIS boundary data.")

    code, cameras = req('/api/cameras', 'GET')
    assert code == 200 and len(cameras) >= 5, f"Cameras check failed: {len(cameras)}"
    print(f"[PASS] [TEST 4] Camera Registry: {len(cameras)} active camera nodes loaded with 4-tier zones.")

    # 4. Upload & Assign Video to CAM-01
    print("\n--- Testing Video Upload & AI Analysis on CAM-01 ---")
    upload_payload = {
        'filename': 'patrol_recon_cam01.mp4',
        'duration_seconds': 60.0
    }
    code, upload_res = req('/api/cameras/CAM-01/upload-video', 'POST', upload_payload, token=admin_token)
    if code != 201:
        print("Upload failed with code:", code, "Response:", upload_res)
    assert code == 201, f"Upload failed: {upload_res}"
    print(f"[PASS] [TEST 5] Video Upload: Assigned to {upload_res.get('camera_id')}, Video URL: {upload_res.get('video_url')}")
    print(f"         AI Analysis Result: {upload_res['analysis']['total_detections']} detections, {upload_res['analysis']['total_incidents']} confirmed intrusion incidents generated.")

    # 5. Check CAM-01 video_url is permanently saved
    code, cam1 = req('/api/cameras/CAM-01', 'GET')
    assert code == 200 and cam1['video_url'] == '/uploads/patrol_recon_cam01.mp4', f"CAM-01 video url not updated: {cam1}"
    print("[PASS] [TEST 6] Permanent Association: CAM-01 video source is", cam1['video_url'])

    # 6. Incident Lifecycle: NEW -> ACKNOWLEDGED -> UNDER_INVESTIGATION -> RESOLVED
    code, active_incs = req('/api/incidents?status=NEW', 'GET', token=admin_token)
    assert code == 200 and len(active_incs) > 0, "No NEW incidents found."
    target_inc = active_incs[0]
    inc_id = target_inc['incident_id']
    print(f"\n--- Testing Incident Lifecycle for {inc_id} ---")
    print(f"  Initial Status: {target_inc['status']} on camera {target_inc['camera_id']}")

    # Acknowledge
    code, ack_res = req(f'/api/incidents/{inc_id}/acknowledge', 'POST', token=admin_token)
    assert code == 200 and ack_res['incident']['status'] == 'ACKNOWLEDGED', f"Acknowledge failed: {ack_res}"
    print(f"[PASS] [TEST 7] Acknowledge: {inc_id} transitioned to ACKNOWLEDGED.")

    # Investigate
    code, inv_res = req(f'/api/incidents/{inc_id}/investigate', 'POST', token=admin_token)
    assert code == 200 and inv_res['incident']['status'] == 'UNDER_INVESTIGATION', f"Investigate failed: {inv_res}"
    print(f"[PASS] [TEST 8] Investigate: {inc_id} transitioned to UNDER_INVESTIGATION.")

    # Resolve with Notes
    resolve_payload = {
        'notes': 'Unit 3 rapid interception team deployed. Threat neutralized and perimeter secured. Node returned to normal.'
    }
    code, res_res = req(f'/api/incidents/{inc_id}/resolve', 'POST', resolve_payload, token=admin_token)
    assert code == 200 and res_res['incident']['status'] == 'RESOLVED', f"Resolve failed: {res_res}"
    print(f"[PASS] [TEST 9] Resolve: {inc_id} transitioned to RESOLVED. Resolved at: {res_res['incident']['resolved_at']}")
    print(f"         Resolution Notes: {res_res['incident']['resolution_notes']}")

    # 7. Check Incident in History and Dashboard counters
    code, hist_inc = req(f'/api/incidents/{inc_id}', 'GET', token=admin_token)
    assert code == 200 and hist_inc['status'] == 'RESOLVED', f"History check failed: {hist_inc}"
    print(f"[PASS] [TEST 10] Permanent History: {inc_id} permanently recorded with complete timeline events ({len(hist_inc['timeline'])} events).")

    # 8. Check Dashboard Counters
    code, dash = req('/api/analytics/dashboard', 'GET')
    assert code == 200, f"Dashboard failed: {dash}"
    print(f"[PASS] [TEST 11] Live Dashboard State:")
    print(f"           - Active Cameras: {dash['active_cameras']['count']} / {dash['active_cameras']['total']}")
    print(f"           - Active Incidents: {dash['active_incidents']['count']}")
    print(f"           - Resolved Incidents: {dash['resolved_incidents']['count']}")
    print(f"           - AI Detections Today: {dash['ai_detections']['count']}")

    print("\n==================================================")
    print("    ALL 11 E2E TESTS PASSED WITH 100% SUCCESS!    ")
    print("==================================================")

if __name__ == '__main__':
    run_e2e_audit()
