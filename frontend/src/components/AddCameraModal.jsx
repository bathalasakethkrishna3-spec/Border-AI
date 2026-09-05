import React, { useState, useEffect } from 'react';
import { X, Camera as CameraIcon, Save, Plus } from 'lucide-react';

const AddCameraModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    camera_id: '',
    name: '',
    sector: 'Sector A',
    location_name: '',
    latitude: '29.4500',
    longitude: '72.4000',
    status: 'ONLINE',
    stream_type: 'optical',
    ip_address: '192.168.10.110',
    resolution: '1080p (1920x1080)',
    fps: '30',
    video_url: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        camera_id: initialData.camera_id || '',
        name: initialData.name || '',
        sector: initialData.sector || 'Sector A',
        location_name: initialData.location_name || '',
        latitude: String(initialData.latitude || '29.4500'),
        longitude: String(initialData.longitude || '72.4000'),
        status: initialData.status || 'ONLINE',
        stream_type: initialData.stream_type || 'optical',
        ip_address: initialData.ip_address || '192.168.10.110',
        resolution: initialData.resolution || '1080p (1920x1080)',
        fps: String(initialData.fps || '30'),
        video_url: initialData.video_url || '',
      });
    } else {
      setFormData({
        camera_id: '',
        name: '',
        sector: 'Sector A',
        location_name: '',
        latitude: '29.4500',
        longitude: '72.4000',
        status: 'ONLINE',
        stream_type: 'optical',
        ip_address: '192.168.10.110',
        resolution: '1080p (1920x1080)',
        fps: '30',
        video_url: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.camera_id || !formData.name || !formData.location_name) {
      setError('Please fill in Camera ID, Name, and Location.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        fps: parseInt(formData.fps, 10) || 30,
      };
      await onSave(payload, initialData?.id || initialData?.camera_id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save camera configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1322] border border-[#1a2c47] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#0e192c] border-b border-[#1a2c47] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <CameraIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {initialData ? 'Edit Surveillance Camera' : 'Deploy New Surveillance Camera'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {initialData ? `Updating ${initialData.camera_id}` : 'Provisioning camera sensor node'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Camera ID *</label>
              <input
                type="text"
                name="camera_id"
                value={formData.camera_id}
                onChange={handleChange}
                placeholder="e.g. CAM-09"
                disabled={!!initialData}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Sector *</label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="Sector A">Sector A</option>
                <option value="Sector B">Sector B</option>
                <option value="Sector C">Sector C</option>
                <option value="Sector D">Sector D</option>
                <option value="Sector E">Sector E</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Camera Name / Description *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sector A - North Perimeter Outpost"
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Location Name / Landmark *</label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="e.g. Checkpoint Echo Ridge"
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Longitude *</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Stream Sensor Type</label>
              <select
                name="stream_type"
                value={formData.stream_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="optical">Optical RGB</option>
                <option value="thermal">FLIR Thermal</option>
                <option value="night_vision">Night Vision (NVG)</option>
                <option value="infrared">Low-Light IR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Operating Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="ONLINE">ONLINE (Green)</option>
                <option value="ALERT">ALERT (Red)</option>
                <option value="SUSPICIOUS">SUSPICIOUS (Orange)</option>
                <option value="OFFLINE">OFFLINE (Gray)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Resolution</label>
              <select
                name="resolution"
                value={formData.resolution}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="1080p (1920x1080)">1080p FHD (1920x1080)</option>
                <option value="4K UHD (3840x2160)">4K UHD (3840x2160)</option>
                <option value="1080p FLIR Thermal">1080p FLIR Thermal</option>
                <option value="720p HD">720p HD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">RTSP Stream IP</label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                placeholder="192.168.10.xxx"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Assigned Video Source URL / File Path</label>
            <input
              type="text"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="e.g. /uploads/CAM01.mp4"
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-cyan-300 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#1a2c47] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : (initialData ? 'Update Camera' : 'Deploy Camera')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCameraModal;
