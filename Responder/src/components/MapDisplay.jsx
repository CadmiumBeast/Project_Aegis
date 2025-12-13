import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom SVG marker icon (avoids CDN tracking issues)
const createCustomIcon = () => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c41e3a" width="32" height="32">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 10 10 20 10 20s10-10 10-20c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    </svg>
  `;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function MapDisplay({ latitude, longitude, incidentType }) {
  if (!latitude || !longitude) {
    return <p style={{ fontSize: "0.9rem", color: "#666", textAlign: "center" }}>📍 Location not available</p>;
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      style={{ height: "250px", width: "100%", borderRadius: "10px", marginBottom: "10px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[latitude, longitude]} icon={createCustomIcon()}>
        <Popup>
          <div style={{ fontSize: "12px" }}>
            <strong>{incidentType}</strong>
            <br />
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default MapDisplay;
