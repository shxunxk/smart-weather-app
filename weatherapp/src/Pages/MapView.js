import { useEffect, useRef, useState } from "react";
import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import getWeather from "../Functions/getWeather";
import getPlaces from "../Functions/getPlaces";
import getWeatherType from "../Functions/getWeatherType";
import getEmoji from "../Functions/getEmoji";
import useLocationTracker from "../Functions/useLocationTracker";

// 🌦️ Weather icon
const createIcon = (emoji) =>
  L.divIcon({
    html: `
      <div style="
        font-size: 30px;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 0 8px rgba(255,255,255,0.7));
      ">
        ${emoji}
      </div>
    `,
    className: "",
    iconSize: [30, 30],
  });

// 📏 Calculate visible map width
const getMapWidthKm = (bounds) => {
  const west = bounds.getWest();
  const east = bounds.getEast();
  const centerLat = bounds.getCenter().lat;

  const kmPerDegree = 111;

  return (
    Math.abs(east - west) *
    kmPerDegree *
    Math.cos((centerLat * Math.PI) / 180)
  );
};

function WeatherLayer() {
  const map = useMap();

  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userWeather, setUserWeather] = useState(null);

  const timeoutRef = useRef(null);

  // ✅ NEW LOCATION LOGIC (REPLACES OLD SYSTEM)
  const handleLocationChange = async (location) => {
    console.log("📍 New location:", location);

    setUserLocation(location);

    try {
      const weather = await getWeather(location.lat, location.lon);

      const code = weather?.current_weather?.weathercode;

      setUserWeather(getWeatherType(code));

      // keep map synced with user
      map.setView([location.lat, location.lon], 11);
    } catch (err) {
      console.log("Location weather error:", err);
    }
  };

  // ✅ TRACK USER LOCATION CONTINUOUSLY
  useLocationTracker(handleLocationChange);

  useEffect(() => {
    // 🌦️ Fetch weather
    const fetchWeather = async () => {
      const bounds = map.getBounds();
      const widthKm = getMapWidthKm(bounds);

      console.log("Visible Width:", widthKm);

      if (widthKm > 100) {
        setPlaces([]);
        console.log("Zoom in to view weather");
        return;
      }

      try {
        const visiblePlaces = await getPlaces(bounds);
        const limitedPlaces = visiblePlaces.slice(0, 100);

        const results = await Promise.all(
          limitedPlaces.map(async (p) => {
            try {
              const weather = await getWeather(p.lat, p.lon);

              const code = weather?.current_weather?.weathercode;

              return {
                lat: p.lat,
                lon: p.lon,
                name: p.tags?.name || "Unknown",
                type: getWeatherType(code),
              };
            } catch (err) {
              return null;
            }
          })
        );

        setPlaces(results.filter(Boolean));
      } catch (err) {
        console.log("Place API Error:", err);
      }
    };

    const triggerFetch = () => {
      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        fetchWeather();
      }, 500);
    };

    map.on("moveend", triggerFetch);

    return () => {
      clearTimeout(timeoutRef.current);
      map.off("moveend", triggerFetch);
    };
  }, [map]);

  return (
    <>
      {/* 📍 USER MARKER */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={L.divIcon({
            html: `
              <div style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(0,191,255,0.2);
                border: 2px solid #00bfff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:24px;
                box-shadow: 0 0 20px #00bfff, 0 0 40px rgba(0,191,255,0.5);
              ">
                ${getEmoji(userWeather)}
              </div>
            `,
            className: "",
            iconSize: [48, 48],
          })}
        >
          <Popup>
            <strong>Your Location</strong>
            <br />
            Weather: {userWeather}
          </Popup>
        </Marker>
      )}

      {/* 🌦️ PLACES */}
      {places.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lon]}
          icon={createIcon(getEmoji(p.type))}
        >
          <Popup>
            <div style={{ fontSize: "16px", fontWeight: "600" }}>
              {p.name}
            </div>
            <br />
            Weather: {p.type}
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function MapView() {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={11}
      zoomAnimation={false}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap contributors & Stadia Maps"
        detectRetina={true}
        maxZoom={20}
        tileSize={512}
        zoomOffset={-1}
      />

      <WeatherLayer />
    </MapContainer>
  );
}