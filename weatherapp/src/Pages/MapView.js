import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🌦️ Weather grid
const weatherPoints = [
  { lat: 12.9716, lon: 77.5946, type: "sun", label: "Central" },
  { lat: 13.0016, lon: 77.5946, type: "cloud", label: "North" },
  { lat: 12.9416, lon: 77.5946, type: "rain", label: "South" },
  { lat: 12.9716, lon: 77.6246, type: "storm", label: "East" },
  { lat: 12.9716, lon: 77.5646, type: "cloud", label: "West" },
];

// 🌈 icon logic
const getEmoji = (type) => {
  switch (type) {
    case "sun":
      return "☀️";
    case "cloud":
      return "☁️";
    case "rain":
      return "🌧️";
    case "storm":
      return "⛈️";
    default:
      return "🌤️";
  }
};

// 🌟 Create custom icon (THIS IS THE KEY)
const createWeatherIcon = (emoji) =>
  L.divIcon({
    html: `<div style="
      font-size: 28px;
      text-align: center;
      transform: translate(-50%, -50%);
    ">${emoji}</div>`,
    className: "weather-icon",
    iconSize: [30, 30],
  });

export default function MapView() {
  const center = [12.9716, 77.5946];

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {weatherPoints.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lon]}
          icon={createWeatherIcon(getEmoji(p.type))}
        >
          <Popup>
            {getEmoji(p.type)} {p.label}
            <br />
            Condition: {p.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}