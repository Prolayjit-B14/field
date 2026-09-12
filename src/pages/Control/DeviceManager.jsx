import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  Cpu, Search, ChevronRight, Plus, Droplets, CloudSun, Camera, X, Wifi, Radio
} from 'lucide-react';

const DEVICE_FILTERS = ['All', 'Online', 'Offline', 'Soil Nodes', 'Weather', 'Cameras'];

const BASE_HARDWARE_NODES = [
  {
    id: 'SOIL-01',
    nodeKey: 'soil_node',
    name: 'SOIL-01',
    type: 'Soil Monitoring Node',
    category: 'Soil Nodes',
    icon: Droplets,
    color: '#15803D',
    sensorsSummary: 'Moisture, Temp, pH, NPK'
  },
  {
    id: 'WEATHER-01',
    nodeKey: 'weather_node',
    name: 'WEATHER-01',
    type: 'Weather Station Node',
    category: 'Weather',
    icon: CloudSun,
    color: '#0EA5E9',
    sensorsSummary: 'Temp, Humidity, Light, Rain'
  },
  {
    id: 'CAM-01',
    nodeKey: 'vision_node',
    name: 'CAM-01',
    type: 'Vision & AI Node',
    category: 'Cameras',
    icon: Camera,
    color: '#8B5CF6',
    sensorsSummary: 'Field Stream'
  }
];

const DeviceManager = () => {
  const navigate = useNavigate();
  const { sensorData, devices, rawDevices, mqttStatus, lastGlobalUpdate } = useTelemetry();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [customNodes, setCustomNodes] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeType, setNewNodeType] = useState('Soil Monitoring Node');

  // Dynamically compute real hardware nodes state based on TelemetryContext
  const realDevices = useMemo(() => {
    const isMqttLive = mqttStatus === 'connected';

    const baseList = BASE_HARDWARE_NODES.map(node => {
      let isOnline = false;
      let lastSeenText = 'Offline';

      if (node.id === 'SOIL-01') {
        const hasSoilData = sensorData?.soil?.moisture != null || sensorData?.soil?.temp != null;
        const isSoilActive = devices?.soil_node?.status === 'ACTIVE' || rawDevices?.soil_node?.status === 'ACTIVE';
        isOnline = isMqttLive && (isSoilActive || hasSoilData);
        lastSeenText = isOnline 
          ? (lastGlobalUpdate || 'Live Telemetry') 
          : (isMqttLive ? 'Awaiting Telemetry' : 'Offline');
      } else if (node.id === 'WEATHER-01') {
        const hasWeatherData = sensorData?.weather?.temp != null || sensorData?.weather?.humidity != null;
        const isWeatherActive = devices?.weather_node?.status === 'ACTIVE' || rawDevices?.weather_node?.status === 'ACTIVE';
        isOnline = isMqttLive && (isWeatherActive || hasWeatherData);
        lastSeenText = isOnline 
          ? (lastGlobalUpdate || 'Live Telemetry') 
          : (isMqttLive ? 'Awaiting Telemetry' : 'Offline');
      } else if (node.id === 'CAM-01') {
        const isCamActive = devices?.vision_node?.status === 'ACTIVE' || rawDevices?.vision_node?.status === 'ACTIVE';
        isOnline = isMqttLive && isCamActive;
        lastSeenText = isOnline ? (lastGlobalUpdate || 'Stream Ready') : (isMqttLive ? 'Standby' : 'Offline');
      }

      return {
        ...node,
        status: isOnline ? 'Online' : 'Offline',
        lastSeen: lastSeenText
      };
    });

    return [...baseList, ...customNodes];
  }, [sensorData, devices, rawDevices, mqttStatus, lastGlobalUpdate, customNodes]);

  // Compute live summary stats
  const stats = useMemo(() => {
    const total = realDevices.length;
    const online = realDevices.filter(d => d.status === 'Online').length;
    const offline = realDevices.filter(d => d.status === 'Offline').length;
    return { total, online, offline };
  }, [realDevices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return realDevices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.sensorsSummary?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === 'All') return true;
      if (activeFilter === 'Online') return d.status === 'Online';
      if (activeFilter === 'Offline') return d.status === 'Offline';
      if (activeFilter === 'Soil Nodes') return d.category === 'Soil Nodes';
      if (activeFilter === 'Weather') return d.category === 'Weather';
      if (activeFilter === 'Cameras') return d.category === 'Cameras';
      return true;
    });
  }, [realDevices, searchQuery, activeFilter]);

  const handleDeviceClick = (device) => {
    navigate(`/device-detail?node=${encodeURIComponent(device.id)}`, { 
      state: { nodeId: device.id, device, from: '/device-area' } 
    });
  };

  const handleAddDeviceSubmit = (e) => {
    e.preventDefault();
    if (!newNodeId.trim()) return;

    const formattedId = newNodeId.trim().toUpperCase();
    const newDev = {
      id: formattedId,
      name: formattedId,
      type: newNodeType,
      category: newNodeType.includes('Soil') ? 'Soil Nodes' : newNodeType.includes('Weather') ? 'Weather' : 'Cameras',
      icon: newNodeType.includes('Soil') ? Droplets : newNodeType.includes('Weather') ? CloudSun : Camera,
      color: '#15803D',
      status: mqttStatus === 'connected' ? 'Online' : 'Offline',
      lastSeen: mqttStatus === 'connected' ? 'Paired (Ready)' : 'Offline',
      sensorsSummary: 'Custom Node'
    };

    setCustomNodes(prev => [...prev, newDev]);
    setIsAddModalOpen(false);
    setNewNodeId('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%'
    }}>

      {/* ─── SUMMARY CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px 8px',
          border: '1px solid var(--border-main)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Nodes</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)', marginTop: '2px' }}>
            {stats.total}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px 8px',
          border: '1px solid var(--border-main)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#15803D' }}>Online</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#15803D', marginTop: '2px' }}>
            {stats.online}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px 8px',
          border: '1px solid var(--border-main)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626' }}>Offline</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#DC2626', marginTop: '2px' }}>
            {stats.offline}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px 8px',
          border: '1px solid var(--border-main)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: mqttStatus === 'connected' ? '#15803D' : '#DC2626' }}>
            MQTT Link
          </div>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 900,
            color: mqttStatus === 'connected' ? '#15803D' : '#DC2626',
            marginTop: '6px',
            textTransform: 'capitalize'
          }}>
            {mqttStatus === 'connected' ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div style={{
        position: 'relative',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
        <input
          type="text"
          placeholder="Search real IoT node or sensor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '42px',
            borderRadius: '14px',
            border: '1.5px solid var(--border-main)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            paddingLeft: '38px',
            paddingRight: '14px',
            fontSize: '0.84rem',
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* ─── FILTER CHIPS ─── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {DEVICE_FILTERS.map(f => {
          const isSelected = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: isSelected ? 'none' : '1px solid var(--border-main)',
                background: isSelected ? '#15803D' : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* ─── REAL HARDWARE DEVICE LIST CARDS WITH SIDE ARROWS ─── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {filteredDevices.map(device => {
          const Icon = device.icon;
          const isDevOnline = device.status === 'Online';

          return (
            <Link
              key={device.id}
              to={`/device-detail?node=${encodeURIComponent(device.id)}`}
              state={{ nodeId: device.id, device, from: '/device-area' }}
              onClick={() => handleDeviceClick(device)}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '22px',
                  padding: '16px 20px',
                  minHeight: '76px',
                  border: '1.5px solid var(--border-main)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#15803D';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-main)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  {/* Device Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: isDevOnline ? `${device.color}15` : '#F1F5F9',
                    border: `1px solid ${isDevOnline ? device.color + '30' : '#E2E8F0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDevOnline ? device.color : '#94A3B8',
                    flexShrink: 0
                  }}>
                    <Icon size={26} strokeWidth={2.4} />
                  </div>

                  {/* Big Bold Node Name taking full height */}
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.45rem', 
                    fontWeight: 950, 
                    color: 'var(--text-main)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1
                  }}>
                    {device.name}
                  </h3>
                </div>

                {/* Right: Status Badge (Right Aligned) + Side Arrow */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0,
                    pointerEvents: 'none' /* Passes click straight to the Link parent */
                  }}
                >
                  {/* Right-aligned Status Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: isDevOnline ? '#DCFCE7' : '#FEF2F2',
                    border: `1px solid ${isDevOnline ? '#86EFAC' : '#FCA5A5'}`,
                    color: isDevOnline ? '#15803D' : '#DC2626',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    <span style={{ fontSize: '0.65rem' }}>●</span>
                    <span>{device.status}</span>
                  </div>

                  {/* Side Arrow */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)'
                  }}>
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── BOTTOM CTA: + PAIR DEVICE ─── */}
      <div style={{ marginTop: 'auto', paddingTop: '8px', paddingBottom: '10px' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddModalOpen(true)}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '24px',
            background: '#15803D',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)'
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Pair New IoT Node</span>
        </motion.button>
      </div>

      {/* ─── ADD DEVICE MODAL ─── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '28px',
                padding: '24px',
                maxWidth: '380px',
                width: '100%',
                boxShadow: 'var(--shadow-premium)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Pair New IoT Node
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddDeviceSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Node Hardware Serial / ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOIL-02"
                    value={newNodeId}
                    onChange={e => setNewNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Node Type
                  </label>
                  <select
                    value={newNodeType}
                    onChange={e => setNewNodeType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option>Soil Monitoring Node</option>
                    <option>Weather Station Node</option>
                    <option>Vision & Camera Node</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '16px',
                    background: '#15803D',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Pair Node
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DeviceManager;
