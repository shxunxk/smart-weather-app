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

// 🌦️ Weather code → weather type
const getWeatherType = (code) => {

  if (code === 0) return "sun";

  if (code <= 3) return "cloud";

  if (code >= 45 && code <= 67)
    return "rain";

  if (code >= 71 && code <= 77)
    return "snow";

  if (code >= 95)
    return "storm";

  return "cloud";
};

// 🌈 Weather emoji
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

// 🎯 Custom weather icon
const createIcon = (emoji) =>
  L.divIcon({
    html: `
      <div style="
        font-size: 28px;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
      ">
        ${emoji}
      </div>
    `,
    className: "",
    iconSize: [30, 30],
  });

// 🌍 Calculate visible map width in KM
const getMapWidthKm = (bounds) => {

  const west = bounds.getWest();
  const east = bounds.getEast();

  const centerLat =
    bounds.getCenter().lat;

  const kmPerDegree = 111;

  return (
    Math.abs(east - west) *
    kmPerDegree *
    Math.cos(
      (centerLat * Math.PI) / 180
    )
  );
};

// 🌦️ Weather Layer
function WeatherLayer() {

  const map = useMap();

  const [places, setPlaces] =
    useState([]);

  // ✅ Last valid zoom
  const lastValidZoom =
    useRef(map.getZoom());

  useEffect(() => {

    // 🚫 Prevent zoom below 10km
    const enforceMinWidth = () => {

      const bounds =
        map.getBounds();

      const widthKm =
        getMapWidthKm(bounds);

      console.log(
        "Current Width:",
        widthKm
      );

      // ✅ Valid zoom
      if (widthKm >= 10) {

        lastValidZoom.current =
          map.getZoom();

      } else {

        // 🚫 Restore previous zoom
        map.setZoom(
          lastValidZoom.current
        );
      }
    };

    // 🌦️ Fetch weather
    const fetchWeather =
      async () => {

      const bounds =
        map.getBounds();

      const widthKm =
        getMapWidthKm(bounds);

      console.log(
        "Visible Width:",
        widthKm
      );

      // 🚫 STOP all API calls above 30km
      if (widthKm > 30) {

        console.log(
          "Too zoomed out — skipping weather fetch"
        );

        setPlaces([]);

        return;
      }

      try {

        // 🌍 Get visible real places
        const visiblePlaces =
          await getPlaces(bounds);

        // ⚡ Limit requests
        const limitedPlaces =
          visiblePlaces.slice(0, 15);

        // 🌦️ Fetch weather
        const results =
          await Promise.all(

            limitedPlaces.map(
              async (p) => {

                try {

                  const weather =
                    await getWeather(
                      p.lat,
                      p.lon
                    );

                  const code =
                    weather
                    ?.current_weather
                    ?.weathercode;

                  return {
                    lat: p.lat,
                    lon: p.lon,
                    name:
                      p.tags?.name ||
                      "Unknown",
                    type:
                      getWeatherType(
                        code
                      ),
                  };

                } catch (err) {

                  console.log(
                    "Weather Error:",
                    err
                  );

                  return null;
                }
              }
            )
          );

        setPlaces(
          results.filter(Boolean)
        );

      } catch (err) {

        console.log(
          "Place API Error:",
          err
        );
      }
    };

    // Initial fetch
    fetchWeather();

    // Events
    map.on(
      "moveend",
      fetchWeather
    );

    map.on(
      "zoomend",
      enforceMinWidth
    );

    // Cleanup
    return () => {

      map.off(
        "moveend",
        fetchWeather
      );

      map.off(
        "zoomend",
        enforceMinWidth
      );
    };

  }, [map]);

  return (
    <>
      {places.map((p, i) => (

        <Marker
          key={i}
          position={[
            p.lat,
            p.lon,
          ]}
          icon={createIcon(
            getEmoji(p.type)
          )}
        >

          <Popup>

            <strong>
              {p.name}
            </strong>

            <br />

            Weather:
            {" "}
            {p.type}

          </Popup>

        </Marker>
      ))}
    </>
  );
}

// 🌍 Main Map
export default function MapView() {

  return (

    <MapContainer
      center={[
        12.9716,
        77.5946,
      ]}
      zoom={11}
      style={{
        height: "100vh",
        width: "100%",
      }}
    >

      {/* 🌙 Dark map */}
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors & Stadia Maps'
        detectRetina={true}
        maxZoom={20}
        tileSize={512}
        zoomOffset={-1}
        />

      <WeatherLayer />

    </MapContainer>
  );
}