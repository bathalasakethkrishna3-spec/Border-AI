import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Camera, 
  Activity, 
  MapPin, 
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Clock
} from 'lucide-react';
import { assistantAPI } from '../services/api';

const QUICK_PROMPTS = [
  "Which sector has the most alerts today?",
  "Show unresolved critical incidents.",
  "Which cameras are offline?",
  "How many intrusions happened today?",
  "What is the status of Sector B?"
];

const AssistantDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 **BorderAI Tactical Assistant** operational. I can query real-time sector health, active intrusion alerts, camera diagnostic states, and defense telemetry directly from the surveillance database.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryToSend) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await assistantAPI.query(q);
      const data = res.data;

      const assistantMsg = {
        sender: 'assistant',
        text: data.answer || "Query processed successfully.",
        suggested_action: data.suggested_action,
        category: data.category,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: "⚠️ Failed to retrieve database telemetry. Please ensure the backend server is reachable.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#070d18] border-l border-[#1a2c47] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-[#0a1222] border-b border-[#1a2c47] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono tracking-wider flex items-center gap-1.5">
              BORDERAI ASSISTANT
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h3>
            <p className="text-[10px] font-mono text-cyan-400">Neural Intelligence & Data Query</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl border ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-br-none border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-[#0c1629] text-slate-200 rounded-bl-none border-[#1a2c47] shadow-md'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed text-[11px]">
                  {m.text}
                </div>

                {m.suggested_action && (
                  <div className="mt-2.5 pt-2 border-t border-[#1a2c47]/80">
                    <button
                      onClick={() => {
                        onClose();
                        navigate(m.suggested_action);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Navigate to Action View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-cyan-400 text-[11px] p-2 bg-[#0c1629] rounded-xl border border-[#1a2c47] w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Querying BorderAI database telemetry...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Carousel / Chips */}
      <div className="p-3 bg-[#080e1b] border-t border-[#1a2c47]/80 space-y-1.5">
        <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Tactical Quick Queries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-[#1a2c47] hover:border-cyan-500 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#0a1222] border-t border-[#1a2c47]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a defense telemetry question..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantDrawer;
