import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera as CameraIcon, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  MapPin, 
  Video, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';
import AddCameraModal from '../components/AddCameraModal';
import { camerasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CameraManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);

  const fetchCameras = async () => {
    try {
      const res = await camerasAPI.getAll();
      setCameras(res.data || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleOpenAdd = () => {
    setEditingCamera(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cam) => {
    setEditingCamera(cam);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, cameraId) => {
    if (window.confirm(`Are you sure you want to permanently decommission and delete ${cameraId}?`)) {
      try {
        await camerasAPI.delete(id);
        await fetchCameras();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete camera.');
      }
    }
  };

  const handleSaveCamera = async (payload, id) => {
    if (id) {
      await camerasAPI.update(id, payload);
    } else {
      await camerasAPI.create(payload);
    }
    await fetchCameras();
  };

  const filteredCameras = cameras.filter((c) => {
    const matchSector = sectorFilter === 'ALL' || c.sector === sectorFilter;
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchSearch = !searchQuery || 
      c.camera_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSector && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              SURVEILLANCE SENSOR NODE PROVISIONING & REGISTRY
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {cameras.length} NODES CONFIGURED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage CCTV hardware channels, FLIR thermal sensors, coordinates, and RTSP ingestion pipelines.
          </p>
        </div>

        {/* Add Camera Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>PROVISION NEW CAMERA</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#09101e] border border-[#1a2c47] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Sector and Status filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Sectors</option>
            <option value="Sector A">Sector A</option>
            <option value="Sector B">Sector B</option>
            <option value="Sector C">Sector C</option>
            <option value="Sector D">Sector D</option>
            <option value="Sector E">Sector E</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONLINE">Online (Green)</option>
            <option value="ALERT">Alert (Red)</option>
            <option value="SUSPICIOUS">Suspicious (Orange)</option>
            <option value="OFFLINE">Offline (Gray)</option>
          </select>
        </div>
      </div>

      {/* Cameras Table */}
      <div className="surveillance-panel rounded-xl border border-[#1a2c47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080e1a] border-b border-[#1a2c47] text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Camera ID</th>
                <th className="px-4 py-3">Camera Name</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Location Landmark</th>
                <th className="px-4 py-3">Assigned Video Source</th>
                <th className="px-4 py-3">Sensor Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2c47]/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">Loading cameras registry...</td>
                </tr>
              ) : filteredCameras.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">No surveillance cameras configured matching criteria.</td>
                </tr>
              ) : (
                filteredCameras.map((cam) => {
                  const isThreat = cam.status === 'ALERT';
                  const isWarn = cam.status === 'SUSPICIOUS';
                  const isOff = cam.status === 'OFFLINE';

                  return (
                    <tr key={cam.camera_id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            isThreat ? 'bg-red-500 animate-ping' : (isWarn ? 'bg-amber-400' : (isOff ? 'bg-slate-500' : 'bg-emerald-400'))
                          }`}></span>
                          {cam.camera_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans font-bold text-white max-w-xs truncate">
                        {cam.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{cam.sector}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{cam.location_name}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {cam.video_url ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                            {cam.video_url.split('/').pop()}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Synthetic Stream</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 uppercase border border-slate-700">
                          {cam.stream_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isThreat ? 'bg-red-950 text-red-400 border border-red-800' : (isWarn ? 'bg-amber-950 text-amber-400 border border-amber-800' : (isOff ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'))
                        }`}>
                          {cam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/cameras/${cam.camera_id}`)}
                            className="p-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
                            title="View Camera Diagnostics & Video Feed"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cam)}
                            className="p-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                            title="Edit Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cam.id || cam.camera_id, cam.camera_id)}
                            className="p-1.5 rounded bg-red-950/60 text-red-400 border border-red-900/60 hover:bg-red-900/80 transition-colors"
                            title="Decommission Node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Camera Modal */}
      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCamera}
        initialData={editingCamera}
      />
    </div>
  );
};

export default CameraManagement;
