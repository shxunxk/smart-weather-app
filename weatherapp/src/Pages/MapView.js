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
import getYourLocation from "../Functions/getYourLocation";
import getEmoji from "../Functions/getEmoji";

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

function WeatherLayer() {

  const map = useMap();

  const [places, setPlaces] =
    useState([]);

  const [userLocation, setUserLocation] =
    useState(null);

  const [userWeather, setUserWeather] =
    useState(null);

  // 🧠 debounce timer
  const timeoutRef =
    useRef(null);

  useEffect(() => {

    // 📍 User location
    const fetchUserLocation =
      async () => {

      try {

        const location =
          await getYourLocation();

        setUserLocation(location);

        const weather =
          await getWeather(
            location.lat,
            location.lon
          );

        const code =
          weather?.current_weather
          ?.weathercode;

        setUserWeather(
          getWeatherType(code)
        );

        // 🎯 center on user
        map.setView(
          [
            location.lat,
            location.lon,
          ],
          11
        );

      } catch (err) {

        console.log(
          "Location Error:",
          err
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

      // ❌ No weather if too zoomed out
      if (widthKm > 75) {

        setPlaces([]);

        console.log(
          "Zoom in to view weather"
        );

        return;
      }

      try {

        const visiblePlaces =
          await getPlaces(bounds);

        // limit requests
        const limitedPlaces =
          visiblePlaces.slice(0, 100);

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

    // 🚀 Debounced trigger
    const triggerFetch =
      () => {

      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current =
        setTimeout(() => {

          fetchWeather();

        }, 500);
    };

    // Initial location
    fetchUserLocation();

    // Only ONE event
    map.on(
      "moveend",
      triggerFetch
    );

    // Cleanup
    return () => {

      clearTimeout(
        timeoutRef.current
      );

      map.off(
        "moveend",
        triggerFetch
      );
    };

  }, [map]);

  return (
    <>

      {/* 📍 USER MARKER */}
      {userLocation && (

        <Marker
          position={[
            userLocation.lat,
            userLocation.lon,
          ]}
          icon={L.divIcon({

            html: `
              <div style="
                width: 48px;
                height: 48px;

                border-radius: 50%;

                background:
                  rgba(0,191,255,0.2);

                border:
                  2px solid #00bfff;

                display:flex;
                align-items:center;
                justify-content:center;

                font-size:24px;

                box-shadow:
                  0 0 20px #00bfff,
                  0 0 40px rgba(0,191,255,0.5);
              ">
                ${getEmoji(userWeather)}
              </div>
            `,

            className: "",

            iconSize: [48, 48],
          })}
        >

          <Popup>

            <strong>
              Your Location
            </strong>

            <br />

            Weather:
            {" "}
            {userWeather}

          </Popup>

        </Marker>
      )}

      {/* 🌦️ WEATHER PLACES */}
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

            <div style={{
              fontSize: "16px",
              fontWeight: "600",
            }}>
              {p.name}
            </div>

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

export default function MapView() {

  return (

    <MapContainer
      center={[
        12.9716,
        77.5946,
      ]}
      zoom={11}

      zoomAnimation={false}

      style={{
        height: "100vh",
        width: "100%",
      }}
    >

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