from flask import Blueprint, request, jsonify
from services.assistant_service import BorderAIAssistantService
from utils.auth_helper import jwt_required_custom

assistant_bp = Blueprint('assistant', __name__, url_prefix='/api/assistant')

@assistant_bp.route('/query', methods=['POST'])
def handle_assistant_query():
    data = request.get_json() or {}
    query_text = data.get('query', '').strip()
    if not query_text:
        return jsonify({'error': 'Query text is required'}), 400

    result = BorderAIAssistantService.process_query(query_text)
    return jsonify(result), 200
