import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Video, ShieldAlert, AlertTriangle, Eye, Layers, Compass, PlayCircle, MapPin } from 'lucide-react';

// Custom Marker Icon Generator using SVG HTML
const createCustomMarker = (status, healthStatus, activeIncident, cameraId) => {
  const hasIncident = Boolean(activeIncident);
  const isThreat = status === 'ALERT' || hasIncident;
  const isWarn = status === 'SUSPICIOUS';
  const isOffline = healthStatus === 'OFFLINE' || healthStatus === 'NO_SIGNAL';

  const color = isThreat ? '#ef4444' : isWarn ? '#f59e0b' : isOffline ? '#64748b' : '#10b981';
  const glowColor = isThreat ? 'rgba(239, 68, 68, 0.5)' : isWarn ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';

  const html = `
    <div class="relative flex items-center justify-center">
      ${isThreat ? `<div class="absolute w-9 h-9 rounded-full bg-red-500/40 animate-ping"></div>` : ''}
      <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2" 
           style="background: #0b1322; border-color: ${color}; box-shadow: 0 0 14px ${glowColor}">
        <div class="w-2.5 h-2.5 rounded-full" style="background: ${color}"></div>
      </div>
      <div class="absolute -bottom-4 font-mono font-bold text-[9px] px-1 py-0.2 rounded bg-black/90 text-white border border-slate-700 whitespace-nowrap">
        ${cameraId}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-surveillance-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
};

const MapController = ({ focusLocation, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (focusLocation && focusLocation.lat && focusLocation.lng) {
      map.flyTo([focusLocation.lat, focusLocation.lng], zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [focusLocation, map, zoom]);
  return null;
};

const BorderMap = ({
  cameras = [],
  sectors = [],
  focusedCameraId = null,
  selectedSectorId = null,
  onSelectSector = null,
  height = '500px',
  interactive = true,
}) => {
  const navigate = useNavigate();
  const markerRefs = useRef({});

  const defaultCenter = [29.45, 72.48];
  const defaultZoom = 10;

  // Strategic Border Line
  const borderPerimeterLine = [
    [29.3000, 72.2500],
    [29.3800, 72.3400],
    [29.4500, 72.4500],
    [29.5100, 72.5200],
    [29.5800, 72.6100],
    [29.6500, 72.7000],
  ];

  const focusedCamera = cameras.find((c) => c.camera_id === focusedCameraId);
  const selectedSec = sectors.find((s) => s.sector_id === selectedSectorId);

  const focusCoordinates = focusedCamera 
    ? { lat: focusedCamera.latitude, lng: focusedCamera.longitude }
    : (selectedSec ? { lat: selectedSec.center_lat, lng: selectedSec.center_lng } : null);

  const [layerType, setLayerType] = useState('satellite'); // 'satellite' | 'topo' | 'dark'

  useEffect(() => {
    if (focusedCameraId && markerRefs.current[focusedCameraId]) {
      markerRefs.current[focusedCameraId].openPopup();
    }
  }, [focusedCameraId]);

  const tileLayerConfigs = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics | BorderAI Recon',
      maxZoom: 19,
    },
    topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri Topo Map | BorderAI GIS',
      maxZoom: 19,
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      attribution: '&copy; CARTO Tactical Dark | BorderAI GIS',
      maxZoom: 19,
    }
  };

  const activeTileConfig = tileLayerConfigs[layerType] || tileLayerConfigs.dark;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#1a2c47] bg-[#070c16] shadow-xl" style={{ height }}>
      {/* Map Layer Switcher Control */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#0b1322]/90 backdrop-blur border border-[#1a2c47] rounded-lg p-1 flex items-center gap-1 shadow-lg text-[10px] font-mono">
        <button
          type="button"
          onClick={() => setLayerType('satellite')}
          className={`px-2 py-1 rounded transition-all font-semibold ${
            layerType === 'satellite'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          🛰️ Satellite
        </button>
        <button
          type="button"
          onClick={() => setLayerType('topo')}
          className={`px-2 py-1 rounded transition-all font-semibold ${
            layerType === 'topo'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          🏔️ Terrain
        </button>
        <button
          type="button"
          onClick={() => setLayerType('dark')}
          className={`px-2 py-1 rounded transition-all font-semibold ${
            layerType === 'dark'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          ⬛ Tactical Dark
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          key={layerType}
          attribution={activeTileConfig.attribution}
          url={activeTileConfig.url}
          subdomains={activeTileConfig.subdomains || 'abc'}
          maxZoom={activeTileConfig.maxZoom}
          eventHandlers={{
            tileerror: () => {
              // Graceful fallback to dark tactical if satellite or topo fails to load
              if (layerType !== 'dark') {
                console.warn(`Layer ${layerType} failed to load tile. Falling back to Tactical Dark.`);
                setLayerType('dark');
              }
            }
          }}
        />

        {focusCoordinates && <MapController focusLocation={focusCoordinates} zoom={selectedSec && !focusedCamera ? 11 : 13} />}

        {/* Global Border Line */}
        <Polyline
          positions={borderPerimeterLine}
          pathOptions={{
            color: '#06b6d4',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.85,
          }}
        />

        {/* Sector Boundary Polygons */}
        {sectors.map((sec) => {
          const poly = sec.boundary_polygon || [];
          if (poly.length === 0) return null;

          const isSelected = selectedSectorId === sec.sector_id;
          const isAlert = sec.status === 'ALERT';
          const isSuspicious = sec.status === 'SUSPICIOUS';

          const color = isAlert ? '#ef4444' : isSuspicious ? '#f59e0b' : '#10b981';

          return (
            <Polygon
              key={sec.sector_id}
              positions={poly}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isSelected ? 0.22 : 0.08,
                weight: isSelected ? 2.5 : 1.5,
                dashArray: isSelected ? '0' : '4, 4'
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectSector) onSelectSector(sec.sector_id);
                }
              }}
            >
              <Popup>
                <div className="p-2.5 font-sans min-w-[220px]">
                  <div className="flex items-center justify-between border-b border-[#1a2c47] pb-1.5 mb-1.5">
                    <span className="font-mono font-bold text-white text-xs">{sec.name}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                      isAlert ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {sec.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-tight">{sec.description}</p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      Cameras: <span className="font-bold text-cyan-400">{sec.camera_count}</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      Intrusions: <span className={`font-bold ${sec.active_intrusion_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{sec.active_intrusion_count}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Camera Markers */}
        {cameras.map((cam) => {
          const activeInc = cam.active_incident;
          const hasIncident = Boolean(activeInc);
          const isWarn = cam.status === 'SUSPICIOUS';

          return (
            <Marker
              key={cam.camera_id}
              position={[cam.latitude, cam.longitude]}
              icon={createCustomMarker(cam.status, cam.health_status, activeInc, cam.camera_id)}
              ref={(ref) => {
                if (ref) markerRefs.current[cam.camera_id] = ref;
              }}
            >
              <Popup>
                <div className="p-3 font-sans min-w-[260px]">
                  <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white text-sm">{cam.camera_id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                        {cam.sector}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full ${
                      hasIncident ? 'bg-red-600 text-white font-bold animate-pulse' : (isWarn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40')
                    }`}>
                      {hasIncident ? `RISK ${activeInc.risk_score}` : cam.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="font-semibold text-white truncate">{cam.name}</p>
                    <p className="text-[11px] text-slate-400">{cam.location_name}</p>
                    
                    {hasIncident && (
                      <div className="p-2 rounded bg-red-950/60 border border-red-800/50 text-[11px] text-red-200 space-y-1">
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span>{activeInc.incident_id}</span>
                          <span className="text-red-400">{activeInc.risk_level}</span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          {activeInc.object_class} • {activeInc.confidence}%
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                          <Compass className="w-3 h-3" />
                          <span>{activeInc.direction_description}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pt-1">
                      <span>GPS: {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}</span>
                      <span className="text-cyan-400">{cam.stream_type.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#1a2c47] flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/cameras/${cam.camera_id}`)}
                      className={`flex-1 py-1 px-2 rounded text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 transition-colors ${
                        hasIncident
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60'
                      }`}
                    >
                      {hasIncident ? <PlayCircle className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      {hasIncident ? 'Incident Replay' : 'Live Feed'}
                    </button>
                    <button
                      onClick={() => navigate(`/alerts?camera_id=${cam.camera_id}`)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[10px] font-mono font-bold uppercase transition-colors"
                    >
                      Alerts
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Tactical Map Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0b1322]/90 backdrop-blur p-2.5 rounded-lg border border-[#1a2c47] text-[10px] font-mono space-y-1 shadow-lg pointer-events-auto">
        <div className="font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" /> Tactical Geofences
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Secure Sector Node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-red-400 font-semibold">Confirmed Intrusion Breach</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-amber-300">Suspicious Approach</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-[#1a2c47]">
          <span className="w-4 h-0.5 bg-cyan-400"></span>
          <span className="text-cyan-400">Border Perimeter Line</span>
        </div>
      </div>
    </div>
  );
};

export default BorderMap;
