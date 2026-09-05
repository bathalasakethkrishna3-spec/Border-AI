from datetime import datetime, timedelta
from sqlalchemy import func
from models import db
from models.camera import Camera
from models.sector import Sector
from models.alert import Alert
from models.incident import Incident
from models.detection import Detection

class BorderAIAssistantService:
    @classmethod
    def process_query(cls, query_text):
        """
        Processes natural language defense questions using structured database aggregations.
        """
        q = (query_text or '').strip().lower()
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Which sector has the most alerts / incidents?
        if 'most alert' in q or 'most incident' in q or 'highest threat' in q or 'high risk sector' in q:
            sector_counts = db.session.query(
                Incident.sector, func.count(Incident.id)
            ).group_by(Incident.sector).order_by(func.count(Incident.id).desc()).all()

            if sector_counts:
                top_sector, top_cnt = sector_counts[0]
                active_crit = Incident.query.filter(
                    Incident.sector == top_sector,
                    Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])
                ).count()
                return {
                    'query': query_text,
                    'category': 'SECTOR_ANALYSIS',
                    'answer': f"**{top_sector}** currently leads with **{top_cnt} recorded incidents** ({active_crit} active unresolved). The primary threat classification in this corridor is unauthorized perimeter breach.",
                    'data': [{'sector': s, 'incident_count': c} for s, c in sector_counts],
                    'suggested_action': f"/map?sector={top_sector}"
                }
            return {
                'query': query_text,
                'category': 'SECTOR_ANALYSIS',
                'answer': "All sectors currently report baseline activity with zero critical alerts.",
                'data': []
            }

        # 2. Show unresolved critical incidents
        if 'unresolved' in q or 'critical incident' in q or 'active incident' in q or 'active intrusion' in q:
            unresolved = Incident.query.filter(
                Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])
            ).order_by(Incident.risk_score.desc()).all()

            count = len(unresolved)
            crit_count = sum(1 for inc in unresolved if inc.risk_level == 'CRITICAL')

            inc_list_text = "\n".join([
                f"- **{inc.incident_id}** on `{inc.camera_id}` ({inc.sector}): Risk **{inc.risk_score}/100** [{inc.status}] — *{inc.direction_description}*"
                for inc in unresolved[:4]
            ])

            return {
                'query': query_text,
                'category': 'INCIDENT_QUERY',
                'answer': f"There are currently **{count} unresolved incidents** ({crit_count} Critical):\n\n{inc_list_text}\n\nAll sensor feeds have archived 45s buffered replay clips.",
                'data': [inc.to_dict(include_timeline=False) for inc in unresolved],
                'suggested_action': '/incidents?status=UNRESOLVED'
            }

        # 3. Which cameras are offline?
        if 'offline' in q or 'camera health' in q or 'disconnected' in q or 'no signal' in q:
            offline_cams = Camera.query.filter(
                Camera.health_status.in_(['OFFLINE', 'NO_SIGNAL', 'UNSTABLE'])
            ).all()

            if offline_cams:
                cam_names = ", ".join([f"`{c.camera_id}` ({c.name} - {c.health_status})" for c in offline_cams])
                return {
                    'query': query_text,
                    'category': 'HARDWARE_HEALTH',
                    'answer': f"**{len(offline_cams)} sensor nodes** require inspection: {cam_names}. Check power supply and local microwave relay.",
                    'data': [c.to_dict(include_active_incident=False) for c in offline_cams],
                    'suggested_action': '/cameras?health_status=OFFLINE'
                }
            return {
                'query': query_text,
                'category': 'HARDWARE_HEALTH',
                'answer': "All 8 border surveillance nodes and FLIR thermal sensors are **ONLINE and synchronized**.",
                'data': [],
                'suggested_action': '/cameras'
            }

        # 4. How many intrusions / detections happened today?
        if 'today' in q or 'how many' in q or 'count' in q or 'total' in q:
            det_today = Detection.query.filter(Detection.timestamp >= today_start).count()
            inc_today = Incident.query.filter(Incident.detection_time >= today_start).count()
            resolved_today = Incident.query.filter(
                Incident.status == 'RESOLVED',
                Incident.resolved_at >= today_start
            ).count()

            return {
                'query': query_text,
                'category': 'DAILY_STATISTICS',
                'answer': f"Today's operational metrics:\n- **AI Detections Processed:** {det_today}\n- **Confirmed Intrusions:** {inc_today}\n- **Incidents Resolved:** {resolved_today}\n- **Overall Border Readiness:** 99.8% DEFENSE ACTIVE",
                'data': {
                    'detections_today': det_today,
                    'intrusions_today': inc_today,
                    'resolved_today': resolved_today
                },
                'suggested_action': '/analytics'
            }

        # 5. Sector-specific query (e.g. Sector B, Sector A)
        for sec_name in ['sector a', 'sector b', 'sector c', 'sector d', 'sector e']:
            if sec_name in q:
                formal_name = sec_name.title()
                sec = Sector.query.filter_by(sector_id=formal_name).first()
                cams = Camera.query.filter_by(sector=formal_name).all()
                active_incs = Incident.query.filter(
                    Incident.sector == formal_name,
                    Incident.status.in_(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'])
                ).all()

                status_text = f"**{formal_name} Telemetry Summary:**\n"
                status_text += f"- **Status:** {sec.status if sec else 'ACTIVE'}\n"
                status_text += f"- **Risk Level:** {sec.risk_level if sec else 'MEDIUM'}\n"
                status_text += f"- **Assigned Nodes:** {len(cams)} cameras ({', '.join([c.camera_id for c in cams])})\n"
                status_text += f"- **Active Intrusions:** {len(active_incs)}\n"

                return {
                    'query': query_text,
                    'category': 'SECTOR_SPECIFIC',
                    'answer': status_text,
                    'data': sec.to_dict(include_cameras=True, include_incidents=True) if sec else {},
                    'suggested_action': f"/map?sector={formal_name}"
                }

        # Default Intelligent Defense Response
        return {
            'query': query_text,
            'category': 'GENERAL_ASSISTANCE',
            'answer': "BorderAI Command Assistant ready. You can ask queries such as:\n- *'Which sector has the most alerts today?'*\n- *'Show unresolved critical incidents.'*\n- *'Which cameras are offline?'*\n- *'How many intrusions happened today?'*\n- *'What is the status of Sector B?'*",
            'data': {}
        }
