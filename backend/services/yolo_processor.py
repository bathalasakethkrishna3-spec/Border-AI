import os
import sys
import math
import logging
import cv2
import numpy as np
import av
from ultralytics import YOLO

logger = logging.getLogger(__name__)

class YOLOVideoProcessor:
    _model = None

    @classmethod
    def get_model(cls, model_name='yolov8n.pt'):
        if cls._model is None:
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            weights_path = os.path.join(backend_dir, model_name)
            if not os.path.exists(weights_path):
                weights_path = model_name
            logger.info(f"Loading YOLO model weights from {weights_path}...")
            cls._model = YOLO(weights_path)
            logger.info("YOLO model loaded successfully.")
        return cls._model

    @staticmethod
    def calculate_direction(dx, dy):
        """Calculates 8-compass direction from displacement (dx, dy)."""
        dist = math.hypot(dx, dy)
        if dist < 0.005:
            return 'STATIONARY'
        
        angle_deg = math.degrees(math.atan2(dy, dx))
        if -22.5 <= angle_deg < 22.5:
            return 'EAST'
        elif 22.5 <= angle_deg < 67.5:
            return 'SOUTH_EAST'
        elif 67.5 <= angle_deg < 112.5:
            return 'SOUTH'
        elif 112.5 <= angle_deg < 157.5:
            return 'SOUTH_WEST'
        elif angle_deg >= 157.5 or angle_deg < -157.5:
            return 'WEST'
        elif -157.5 <= angle_deg < -112.5:
            return 'NORTH_WEST'
        elif -112.5 <= angle_deg < -67.5:
            return 'NORTH'
        else:
            return 'NORTH_EAST'

    @staticmethod
    def is_point_in_zone(zone, cx, cy):
        if not zone:
            return False
        zx = float(zone.get('x', 0))
        zy = float(zone.get('y', 0))
        zw = float(zone.get('w', 0))
        zh = float(zone.get('h', 0))
        return (zx <= cx <= zx + zw) and (zy <= cy <= zy + zh)

    @classmethod
    def evaluate_zone_stage(cls, cx, cy, zones):
        normal_z = zones.get('normal_zone') or {}
        warning_z = zones.get('warning_zone') or {}
        perimeter_l = zones.get('perimeter_line') or {}
        restricted_z = zones.get('restricted_zone') or {}

        # 1. Check Stage 4: Restricted Exclusion Zone
        if cls.is_point_in_zone(restricted_z, cx, cy) or (perimeter_l and cx >= float(perimeter_l.get('x1', 0.62))):
            return 'STAGE_4_INTRUSION', restricted_z.get('label', 'Red Restricted Exclusion Zone'), 94, 'CRITICAL'

        # 2. Check Stage 3: Near Perimeter Line
        if perimeter_l:
            px = float(perimeter_l.get('x1', 0.62))
            if abs(cx - px) < 0.08:
                return 'STAGE_3_PERIMETER', perimeter_l.get('label', 'Perimeter Defense Fence'), 72, 'HIGH'

        # 3. Check Stage 2: Warning Approach Zone
        if cls.is_point_in_zone(warning_z, cx, cy):
            return 'STAGE_2_APPROACH', warning_z.get('label', 'Approach Warning Zone'), 55, 'MEDIUM'

        # 4. Check Stage 1: Normal Area (or Default)
        return 'STAGE_1_NORMAL', normal_z.get('label', 'Normal Base Activity Area'), 20, 'LOW'

    @classmethod
    def process_video(cls, input_path, output_path, camera_config):
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input video not found: {input_path}")

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {input_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        if fps <= 0 or fps > 120:
            fps = 25.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        camera_id = camera_config.get('camera_id', 'CAM-01')
        camera_name = camera_config.get('name', 'Surveillance Node')
        sector = camera_config.get('sector', 'Sector A')
        stream_type = camera_config.get('stream_type', 'optical').upper()
        zones = camera_config.get('zones', {})

        normal_z = zones.get('normal_zone') or {'x': 0.05, 'y': 0.35, 'w': 0.28, 'h': 0.50, 'label': 'Civilian Access Road'}
        warning_z = zones.get('warning_zone') or {'x': 0.35, 'y': 0.30, 'w': 0.25, 'h': 0.55, 'label': 'Approach Warning Zone'}
        perimeter_l = zones.get('perimeter_line') or {'x1': 0.62, 'y1': 0.20, 'x2': 0.62, 'y2': 0.90, 'label': 'Perimeter Fence Line'}
        restricted_z = zones.get('restricted_zone') or {'x': 0.65, 'y': 0.25, 'w': 0.32, 'h': 0.65, 'label': 'Red Restricted Exclusion Zone'}

        model = cls.get_model()

        # Initialize PyAV container for H.264 output
        container = av.open(output_path, mode='w')
        stream = container.add_stream('h264', rate=int(round(fps)))
        stream.width = width
        stream.height = height
        stream.pix_fmt = 'yuv420p'
        stream.options = {'preset': 'fast', 'crf': '22'}

        tracks = {}
        next_track_id = 1
        all_detections_summary = []
        frame_idx = 0
        current_max_risk = 20
        current_threat_status = 'SECURE'

        print(f"[{camera_id}] Starting YOLO+OpenCV video processing: {total_frames} frames ({width}x{height} @ {fps:.1f} FPS)")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            current_time_sec = frame_idx / fps
            timestamp_str = f"{int(current_time_sec // 60):02d}:{int(current_time_sec % 60):02d}"

            # 1. Run YOLO inference on frame
            results = model(frame, conf=0.20, verbose=False)
            current_frame_detections = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    raw_cls = model.names[cls_id].upper()
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    if raw_cls in ['PERSON']:
                        obj_type = 'PERSON'
                    elif raw_cls in ['CAR', 'TRUCK', 'BUS', 'MOTORCYCLE', 'BICYCLE']:
                        obj_type = 'VEHICLE'
                    else:
                        obj_type = raw_cls

                    nx1 = x1 / width
                    ny1 = y1 / height
                    nx2 = x2 / width
                    ny2 = y2 / height
                    cx = (nx1 + nx2) / 2
                    cy = (ny1 + ny2) / 2
                    bw = nx2 - nx1
                    bh = ny2 - ny1

                    current_frame_detections.append({
                        'type': obj_type,
                        'conf': conf,
                        'bbox': (int(x1), int(y1), int(x2), int(y2)),
                        'norm_bbox': {'x': round(nx1, 4), 'y': round(ny1, 4), 'w': round(bw, 4), 'h': round(bh, 4)},
                        'center': (cx, cy)
                    })

            # 2. Track matching between consecutive frames
            matched_track_ids = set()
            for det in current_frame_detections:
                cx, cy = det['center']
                best_track_id = None
                best_dist = 0.15

                for tid, tdata in tracks.items():
                    if tid in matched_track_ids:
                        continue
                    last_cx, last_cy, _ = tdata['history'][-1]
                    dist = math.hypot(cx - last_cx, cy - last_cy)
                    if dist < best_dist:
                        best_dist = dist
                        best_track_id = tid

                if best_track_id is None:
                    best_track_id = next_track_id
                    next_track_id += 1
                    tracks[best_track_id] = {
                        'history': [(cx, cy, frame_idx)],
                        'type': det['type'],
                        'conf': det['conf'],
                        'last_seen': frame_idx
                    }
                else:
                    tracks[best_track_id]['history'].append((cx, cy, frame_idx))
                    tracks[best_track_id]['conf'] = max(tracks[best_track_id]['conf'], det['conf'])
                    tracks[best_track_id]['last_seen'] = frame_idx
                    if len(tracks[best_track_id]['history']) > 30:
                        tracks[best_track_id]['history'].pop(0)

                matched_track_ids.add(best_track_id)
                det['track_id'] = f"TRK-{best_track_id:02d}"

                hist = tracks[best_track_id]['history']
                if len(hist) >= 4:
                    dx = hist[-1][0] - hist[0][0]
                    dy = hist[-1][1] - hist[0][1]
                    det['direction'] = cls.calculate_direction(dx, dy)
                else:
                    det['direction'] = 'NORTH_EAST' if cx > 0.4 else 'EAST'

                stage, zone_name, risk_score, risk_level = cls.evaluate_zone_stage(cx, cy, zones)
                det['stage'] = stage
                det['zone_name'] = zone_name
                det['risk_score'] = risk_score
                det['risk_level'] = risk_level

                if stage == 'STAGE_4_INTRUSION':
                    det['type'] = 'INTRUDER' if det['type'] == 'PERSON' else det['type']
                    current_max_risk = max(current_max_risk, risk_score)
                    current_threat_status = 'CRITICAL INTRUSION'
                elif stage == 'STAGE_3_PERIMETER':
                    current_max_risk = max(current_max_risk, risk_score)
                    if current_threat_status != 'CRITICAL INTRUSION':
                        current_threat_status = 'PERIMETER ALERT'
                elif stage == 'STAGE_2_APPROACH':
                    current_max_risk = max(current_max_risk, risk_score)
                    if current_threat_status not in ['CRITICAL INTRUSION', 'PERIMETER ALERT']:
                        current_threat_status = 'APPROACH WARNING'

                all_detections_summary.append({
                    'frame_idx': frame_idx,
                    'timestamp_str': timestamp_str,
                    'time_sec': round(current_time_sec, 2),
                    'tracking_id': det['track_id'],
                    'object_type': det['type'],
                    'confidence': round(det['conf'] * 100, 1),
                    'stage': stage,
                    'zone_name': zone_name,
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'direction': det['direction'],
                    'bbox': det['norm_bbox']
                })

            # =========================================================
            # 3. OPENCV DIRECT FRAME ANNOTATION & TACTICAL HUD
            # =========================================================
            overlay = frame.copy()

            # A. Draw 4-Tier Sector Zones on frame
            if normal_z:
                nz_x = int(float(normal_z.get('x', 0.05)) * width)
                nz_y = int(float(normal_z.get('y', 0.35)) * height)
                nz_w = int(float(normal_z.get('w', 0.28)) * width)
                nz_h = int(float(normal_z.get('h', 0.50)) * height)
                cv2.rectangle(overlay, (nz_x, nz_y), (nz_x + nz_w, nz_y + nz_h), (50, 180, 50), -1)
                cv2.rectangle(frame, (nz_x, nz_y), (nz_x + nz_w, nz_y + nz_h), (50, 220, 50), 1)
                cv2.putText(frame, f"[STAGE 1: {normal_z.get('label', 'NORMAL')}]", (nz_x + 6, nz_y + 16),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.40, (100, 255, 100), 1, cv2.LINE_AA)

            if warning_z:
                wz_x = int(float(warning_z.get('x', 0.35)) * width)
                wz_y = int(float(warning_z.get('y', 0.30)) * height)
                wz_w = int(float(warning_z.get('w', 0.25)) * width)
                wz_h = int(float(warning_z.get('h', 0.55)) * height)
                cv2.rectangle(overlay, (wz_x, wz_y), (wz_x + wz_w, wz_y + wz_h), (20, 140, 230), -1)
                cv2.rectangle(frame, (wz_x, wz_y), (wz_x + wz_w, wz_y + wz_h), (30, 170, 250), 1)
                cv2.putText(frame, f"[STAGE 2: {warning_z.get('label', 'APPROACH')}]", (wz_x + 6, wz_y + 16),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.40, (50, 200, 255), 1, cv2.LINE_AA)

            if perimeter_l:
                fx1 = int(float(perimeter_l.get('x1', 0.62)) * width)
                fy1 = int(float(perimeter_l.get('y1', 0.20)) * height)
                fx2 = int(float(perimeter_l.get('x2', 0.62)) * width)
                fy2 = int(float(perimeter_l.get('y2', 0.90)) * height)
                cv2.line(frame, (fx1, fy1), (fx2, fy2), (230, 200, 10), 2, cv2.LINE_AA)
                cv2.putText(frame, f"| {perimeter_l.get('label', 'PERIMETER FENCE')}", (fx1 + 4, fy1 + 18),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 230, 50), 1, cv2.LINE_AA)

            if restricted_z:
                rz_x = int(float(restricted_z.get('x', 0.65)) * width)
                rz_y = int(float(restricted_z.get('y', 0.25)) * height)
                rz_w = int(float(restricted_z.get('w', 0.32)) * width)
                rz_h = int(float(restricted_z.get('h', 0.65)) * height)
                cv2.rectangle(overlay, (rz_x, rz_y), (rz_x + rz_w, rz_y + rz_h), (20, 20, 200), -1)
                cv2.rectangle(frame, (rz_x, rz_y), (rz_x + rz_w, rz_y + rz_h), (40, 40, 245), 2)
                cv2.putText(frame, f"[STAGE 4: {restricted_z.get('label', 'RESTRICTED RED ZONE')}]", (rz_x + 6, rz_y + 18),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (80, 80, 255), 1, cv2.LINE_AA)

            cv2.addWeighted(overlay, 0.12, frame, 0.88, 0, frame)

            # B. Draw Real YOLO Bounding Boxes & Tactical HUDs
            for det in current_frame_detections:
                x1, y1, x2, y2 = det['bbox']
                stage = det['stage']
                conf_pct = det['conf'] * 100
                obj_name = det['type']
                dir_name = det['direction']

                if stage == 'STAGE_4_INTRUSION':
                    box_color = (40, 40, 240)
                    badge_bg = (20, 20, 180)
                    stage_title = "STAGE 4: INTRUSION"
                elif stage == 'STAGE_3_PERIMETER':
                    box_color = (10, 180, 240)
                    badge_bg = (10, 140, 200)
                    stage_title = "STAGE 3: PERIMETER"
                elif stage == 'STAGE_2_APPROACH':
                    box_color = (30, 190, 250)
                    badge_bg = (20, 150, 210)
                    stage_title = "STAGE 2: APPROACH"
                else:
                    box_color = (60, 220, 60)
                    badge_bg = (30, 150, 30)
                    stage_title = "STAGE 1: NORMAL"

                cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

                c_len = min(14, int((x2 - x1) * 0.25))
                cv2.line(frame, (x1, y1), (x1 + c_len, y1), box_color, 3)
                cv2.line(frame, (x1, y1), (x1, y1 + c_len), box_color, 3)
                cv2.line(frame, (x2, y1), (x2 - c_len, y1), box_color, 3)
                cv2.line(frame, (x2, y1), (x2, y1 + c_len), box_color, 3)
                cv2.line(frame, (x1, y2), (x1 + c_len, y2), box_color, 3)
                cv2.line(frame, (x1, y2), (x1, y2 - c_len), box_color, 3)
                cv2.line(frame, (x2, y2), (x2 - c_len, y2), box_color, 3)
                cv2.line(frame, (x2, y2), (x2, y2 - c_len), box_color, 3)

                label_text = f"{obj_name} {conf_pct:.1f}% [{stage_title}]"
                (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
                badge_y1 = max(0, y1 - th - 8)
                badge_y2 = y1
                cv2.rectangle(frame, (x1, badge_y1), (x1 + tw + 10, badge_y2), badge_bg, -1)
                cv2.putText(frame, label_text, (x1 + 5, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

                cx_px = int((x1 + x2) / 2)
                cy_px = int((y1 + y2) / 2)
                arrow_len = 32
                angle_rad = 0
                if dir_name == 'NORTH': angle_rad = -math.pi / 2
                elif dir_name == 'NORTH_EAST': angle_rad = -math.pi / 4
                elif dir_name == 'EAST': angle_rad = 0
                elif dir_name == 'SOUTH_EAST': angle_rad = math.pi / 4
                elif dir_name == 'SOUTH': angle_rad = math.pi / 2
                elif dir_name == 'SOUTH_WEST': angle_rad = 3 * math.pi / 4
                elif dir_name == 'WEST': angle_rad = math.pi
                elif dir_name == 'NORTH_WEST': angle_rad = -3 * math.pi / 4

                ax2 = int(cx_px + math.cos(angle_rad) * arrow_len)
                ay2 = int(cy_px + math.sin(angle_rad) * arrow_len)
                cv2.arrowedLine(frame, (cx_px, cy_px), (ax2, ay2), (240, 200, 50), 2, tipLength=0.35)

                vec_text = f"VECTOR: {dir_name}"
                cv2.rectangle(frame, (x1, y2 + 2), (x1 + 130, y2 + 18), (15, 20, 30), -1)
                cv2.putText(frame, vec_text, (x1 + 4, y2 + 14),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, (240, 200, 50), 1, cv2.LINE_AA)

            # C. Top Telemetry Command HUD Banner
            hud_bg = (10, 15, 25)
            cv2.rectangle(frame, (0, 0), (width, 32), hud_bg, -1)
            cv2.line(frame, (0, 32), (width, 32), (30, 60, 100), 1)

            status_color = (60, 220, 60) if current_threat_status == 'SECURE' else (
                (40, 40, 240) if 'CRITICAL' in current_threat_status else (40, 180, 240)
            )
            cv2.circle(frame, (16, 16), 5, status_color, -1)
            cv2.putText(frame, f"{camera_id} [{sector}] - {camera_name.upper()}", (28, 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

            mode_text = f"MODE: {stream_type} | {timestamp_str} UTC"
            cv2.putText(frame, mode_text, (int(width * 0.45), 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 220, 255), 1, cv2.LINE_AA)

            threat_text = f"{current_threat_status} (RISK {current_max_risk}/100)"
            (stw, _), _ = cv2.getTextSize(threat_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            cv2.putText(frame, threat_text, (width - stw - 16, 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, status_color, 1, cv2.LINE_AA)

            # 4. Encode frame to PyAV stream
            av_frame = av.VideoFrame.from_ndarray(frame, format='bgr24')
            for packet in stream.encode(av_frame):
                container.mux(packet)

            frame_idx += 1

        for packet in stream.encode():
            container.mux(packet)
        container.close()
        cap.release()

        print(f"[{camera_id}] Complete! Output: {output_path} ({os.path.getsize(output_path)} bytes)")

        return {
            'camera_id': camera_id,
            'processed_frames': frame_idx,
            'output_path': output_path,
            'detections_count': len(all_detections_summary),
            'detections_summary': all_detections_summary,
            'max_risk_score': current_max_risk,
            'threat_status': current_threat_status
        }
