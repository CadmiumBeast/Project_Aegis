import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './HQDashboard.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on severity with required colors
const getMarkerIcon = (severity) => {
  let color, borderColor;
  if (severity <= 2) {
    color = '#902820'; // redbrick
    borderColor = '#ffffff';
  } else if (severity === 3) {
    color = '#F5D6BA'; // sand
    borderColor = '#333333';
  } else {
    color = '#307638'; // green
    borderColor = '#ffffff';
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map centering component - only centers when center/zoom actually changes
function MapCenter({ center, zoom, shouldCenter }) {
  const map = useMap();
  const prevCenterRef = useRef(center);
  const prevZoomRef = useRef(zoom);
  
  useEffect(() => {
    if (shouldCenter && 
        (prevCenterRef.current[0] !== center[0] || 
         prevCenterRef.current[1] !== center[1] || 
         prevZoomRef.current !== zoom)) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [map, center, zoom, shouldCenter]);
  
  return null;
}

// Fallback data if Firebase is not configured
const getFallbackIncidents = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  
  return [
    {
      id: 'INC-0100',
      type: 'FLOOD',
      severity: 1,
      status: 'NEW',
      timestamp: now,
      location: { lat: 6.7656, lng: 80.3515 },
      responder: 'RSP-0001',
      description: 'URGENT: Severe flooding reported in the area.',
      photo_url: null,
    },
    {
      id: 'INC-0099',
      type: 'POWER_LINE_DOWN',
      severity: 2,
      status: 'NEW',
      timestamp: now,
      location: { lat: 6.7563, lng: 80.3507 },
      responder: 'RSP-0004',
      description: 'Power line down blocking main road.',
      photo_url: null,
    },
    {
      id: 'INC-0025',
      type: 'LANDSLIDE',
      severity: 3,
      status: 'NEW',
      timestamp: oneHourAgo,
      location: { lat: 6.734445, lng: 80.418101 },
      responder: 'RSP-0022',
      locationName: 'Rakwana Valley',
      description: 'URGENT: New landslide reported. Assessment needed.',
      photo_url: null,
    },
  ];
};

export default function HQDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [userEmail] = useState(() => localStorage.getItem('hq_user_email') || 'admin@aegis.lk');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSeverity, setFilterSeverity] = useState('All Sev');
  const [sortBy, setSortBy] = useState('Newest');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationIncident, setNotificationIncident] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([6.6828, 80.4032]);
  const [mapZoom, setMapZoom] = useState(11);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const listRef = useRef(null);
  const selectedCardRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('hq_user_email');
    navigate('/hq/login');
  };

  // Fetch incidents from Firebase
  useEffect(() => {
    try {
      const incidentsRef = collection(db, 'responderReports');
      const q = query(incidentsRef, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedIncidents = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.incidentType || 'UNKNOWN',
            severity: parseInt(data.severity) || 3,
            status: data.status || 'NEW',
            timestamp: data.timestamp ? new Date(data.timestamp) : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date()),
            location: { lat: data.latitude || 6.6828, lng: data.longitude || 80.4032 },
            responder: data.responder || 'UNKNOWN',
            locationName: data.locationName || '',
            description: data.description || '',
            photo_url: data.photo || null,
          };
        });
        
        setIncidents(fetchedIncidents);
        setLastUpdated(new Date());
        setIsLoadingIncidents(false);
      }, (error) => {
        console.error('Error fetching incidents from Firebase:', error);
        
        // Check if it's a permission error
        if (error.code === 'permission-denied' || error.message.includes('permission')) {
          setFirebaseError('Firebase permissions not configured. Check FIREBASE_RULES_SETUP.md');
        } else {
          setFirebaseError(`Firebase error: ${error.message}`);
        }
        
        // Fallback to mock data if Firebase fails
        setIncidents(getFallbackIncidents());
        setIsLoadingIncidents(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setFirebaseError(`Firebase init error: ${error.message}`);
      // Fallback to mock data
      setIncidents(getFallbackIncidents());
      setIsLoadingIncidents(false);
    }
  }, []);


  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track previous incident count to detect new incidents
  const prevIncidentCountRef = useRef(incidents.length);
  
  // Show notification only when a NEW incident is added
  useEffect(() => {
    const currentCount = incidents.length;
    const prevCount = prevIncidentCountRef.current;
    
    // Only show notification if count increased (new incident added)
    if (currentCount > prevCount && !showNotification) {
      // Find the newest incident (first one in the array if sorted by newest)
      const newIncident = incidents.find(inc => inc.status === 'NEW') || incidents[0];
      if (newIncident) {
        // Use setTimeout to avoid setState in effect warning
        setTimeout(() => {
          setNotificationIncident(newIncident);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }, 0);
      }
    }
    
    prevIncidentCountRef.current = currentCount;
  }, [incidents.length, showNotification, incidents]);

  // Scroll to selected incident in list
  useEffect(() => {
    if (selectedIncident && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIncident]);


  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch = 
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.responder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (incident.locationName && incident.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'All Types' || incident.type === filterType;
      const matchesStatus = filterStatus === 'All Status' || incident.status === filterStatus;
      const matchesSeverity = filterSeverity === 'All Sev' || 
        (filterSeverity === 'Sev 1-2' && incident.severity <= 2) ||
        (filterSeverity === 'Sev 3' && incident.severity === 3) ||
        (filterSeverity === 'Sev 4-5' && incident.severity >= 4);
      
      return matchesSearch && matchesType && matchesStatus && matchesSeverity;
    });
  }, [incidents, searchQuery, filterType, filterStatus, filterSeverity]);

  // Sort incidents
  const sortedIncidents = useMemo(() => {
    const sorted = [...filteredIncidents];
    switch (sortBy) {
      case 'Newest':
        return sorted.sort((a, b) => b.timestamp - a.timestamp);
      case 'Severity':
        return sorted.sort((a, b) => a.severity - b.severity);
      case 'Status':
        return sorted.sort((a, b) => {
          if (a.status === 'NEW' && b.status !== 'NEW') return -1;
          if (a.status !== 'NEW' && b.status === 'NEW') return 1;
          return 0;
        });
      default:
        return sorted;
    }
  }, [filteredIncidents, sortBy]);

  const getTypeIcon = (type) => {
    const icons = {
      'Flood': '🌧️',
      'Landslide': '⛰️',
      'Road Block': '🚧',
      'Power Line Down': '⚡',
    };
    return icons[type] || '📍';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  const handleAcknowledge = async (incidentId) => {
    try {
      // Update local state immediately for UI feedback
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId 
          ? { ...inc, status: 'ACK' }
          : inc
      ));

      // Update selected incident if it's the one being acknowledged
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, status: 'ACK' } : null);
      }

      // Update Firebase
      const { doc, updateDoc } = await import('firebase/firestore');
      const incidentRef = doc(db, 'responderReports', incidentId);
      await updateDoc(incidentRef, {
        status: 'ACK',
        acknowledgedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to acknowledge incident:', error);
      // Revert on error
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId 
          ? { ...inc, status: 'NEW' }
          : inc
      ));
    }
  };

  const handleCopyGPS = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
      // Could show a toast here
    });
  };

  const handleOpenInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
    // Center map on selected incident
    setMapCenter([incident.location.lat, incident.location.lng]);
    setMapZoom(13);
    setShouldCenterMap(true);
    // Reset after centering
    setTimeout(() => setShouldCenterMap(false), 100);
  };

  const totalIncidents = incidents.length;
  const newIncidents = incidents.filter(i => i.status === 'NEW').length;
  const ackIncidents = incidents.filter(i => i.status === 'ACK').length;

  return (
    <div className="hq-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <img 
            src="/aegis-logo.png" 
            alt="AEGIS Logo" 
            className="dashboard-logo"
          />
        </div>
        <div className="header-right">
          <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="last-updated">
            Last Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="user-info">
            <span>{userEmail}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="global-stats">
          <div className="stat-item">
            <span className="stat-label">TOTAL</span>
            <span className="stat-value">{totalIncidents}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">NEW</span>
            <span className="stat-value new">{newIncidents}</span>
            {newIncidents > 0 && <span className="stat-dot red"></span>}
          </div>
          <div className="stat-item">
            <span className="stat-label">ACK</span>
            <span className="stat-value ack">{ackIncidents}</span>
            {ackIncidents > 0 && <span className="stat-dot green"></span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Firebase Error Banner */}
        {firebaseError && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            zIndex: 9999,
            maxWidth: '600px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#92400e' }}>Firebase Configuration Needed</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#78350f' }}>
                  {firebaseError}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#78350f', fontWeight: '600' }}>
                  📖 See FIREBASE_RULES_SETUP.md for instructions
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#78350f', fontStyle: 'italic' }}>
                  Using demo data for now...
                </p>
              </div>
              <button 
                onClick={() => setFirebaseError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  color: '#92400e'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Panel - Incident List */}
        <aside className={`left-panel ${isSidebarOpen ? 'open' : ''}`}>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search ID, responder, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option>All Types</option>
              <option>Power Line Down</option>
              <option>Landslide</option>
              <option>Road Block</option>
              <option>Flood</option>
            </select>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option>All Status</option>
              <option>NEW</option>
              <option>ACK</option>
            </select>
            <select 
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="filter-select"
            >
              <option>All Sev</option>
              <option>Sev 1-2</option>
              <option>Sev 3</option>
              <option>Sev 4-5</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option>Newest</option>
              <option>Severity</option>
              <option>Status</option>
            </select>
          </div>

          <div className="incident-list" ref={listRef}>
            {sortedIncidents.map((incident) => (
              <div
                key={incident.id}
                ref={selectedIncident?.id === incident.id ? selectedCardRef : null}
                className={`incident-card ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                onClick={() => {
                  handleIncidentSelect(incident);
                  setIsSidebarOpen(false); // Close sidebar on mobile when item selected
                }}
              >
                <div className="incident-header">
                  <span className="incident-type">
                    {getTypeIcon(incident.type)} {incident.type}
                  </span>
                  <span className={`severity-badge sev-${incident.severity}`}>
                    SEV {incident.severity}
                  </span>
                </div>
                <div className="incident-status">
                  <span className={`status-badge ${incident.status.toLowerCase()}`}>
                    {incident.status}
                  </span>
                  <span className="incident-time">{formatTime(incident.timestamp)}</span>
                </div>
                <div className="incident-location">
                  {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel - Map */}
        <main className="map-panel">
          <div className="map-header">
            <h3>Ratnapura District</h3>
            <p>6.6828°N, 80.4032°E</p>
          </div>
          <div className="severity-legend">
            <div className="legend-item">
              <span className="legend-dot redbrick"></span>
              <span>Sev 1-2</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot sand"></span>
              <span>Sev 3</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot green"></span>
              <span>Sev 4-5</span>
            </div>
          </div>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: 'calc(100vh - 140px)', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapCenter center={mapCenter} zoom={mapZoom} shouldCenter={shouldCenterMap} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {sortedIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.location.lat, incident.location.lng]}
                icon={getMarkerIcon(incident.severity)}
                eventHandlers={{
                  click: () => handleIncidentSelect(incident),
                }}
              >
                <Popup>
                  <div>
                    <strong>{incident.id}</strong><br />
                    {incident.type} - SEV {incident.severity}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>

        {/* Right Panel - Incident Details */}
        <aside className="right-panel">
          {selectedIncident ? (
            <>
              <div className="detail-header">
                <div className="detail-type">
                  <span className="type-icon">{getTypeIcon(selectedIncident.type)}</span>
                  <span>{selectedIncident.type}</span>
                </div>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedIncident(null)}
                >
                  ×
                </button>
              </div>

              <div className="detail-content">
                <div className="detail-section">
                  <div className="detail-id">{selectedIncident.id}</div>
                  <div className="detail-severity">
                    <span className={`severity-badge sev-${selectedIncident.severity}`}>
                      SEV {selectedIncident.severity}
                    </span>
                    <span className={`status-badge ${selectedIncident.status.toLowerCase()}`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Reported</h4>
                  <p>{selectedIncident.timestamp.toLocaleString()}</p>
                  <p><strong>Responder:</strong> {selectedIncident.responder}</p>
                </div>

                <div className="detail-section">
                  <h4>Location</h4>
                  {selectedIncident.locationName && (
                    <p><strong>{selectedIncident.locationName}</strong></p>
                  )}
                  <div className="location-coords">
                    <span>{selectedIncident.location.lat.toFixed(6)}, {selectedIncident.location.lng.toFixed(6)}</span>
                    <div className="location-actions">
                      <button 
                        className="icon-btn" 
                        title="Copy coordinates"
                        onClick={() => handleCopyGPS(selectedIncident.location.lat, selectedIncident.location.lng)}
                      >
                        📋
                      </button>
                      <button 
                        className="icon-btn" 
                        title="Open in maps"
                        onClick={() => handleOpenInMaps(selectedIncident.location.lat, selectedIncident.location.lng)}
                      >
                        🗺️
                      </button>
                    </div>
                  </div>
                </div>

                {selectedIncident.description && (
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{selectedIncident.description}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Photo</h4>
                  {selectedIncident.photo_url ? (
                    <div className="photo-preview">
                      <img src={selectedIncident.photo_url} alt="Incident photo" />
                    </div>
                  ) : (
                    <p className="no-photo">No photo uploaded</p>
                  )}
                </div>

                <div className="detail-actions">
                  {selectedIncident.status === 'NEW' && (
                    <button 
                      className="acknowledge-btn"
                      onClick={() => handleAcknowledge(selectedIncident.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button 
                    className="open-maps-btn"
                    onClick={() => handleOpenInMaps(selectedIncident.location.lat, selectedIncident.location.lng)}
                  >
                    Open in Maps
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <p>Select an incident from the list or map to view details</p>
            </div>
          )}
        </aside>
      </div>

      {/* Notification */}
      {showNotification && notificationIncident && (
        <div className="notification">
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">🚨</span>
              <strong>New Incident Received</strong>
            </div>
            <p>{notificationIncident.type} (Sev {notificationIncident.severity}) - {notificationIncident.responder}</p>
          </div>
        </div>
      )}
    </div>
  );
}
