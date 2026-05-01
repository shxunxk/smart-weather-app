import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import getPlaces from "../Functions/getPlaces";
import getWeather from "../Functions/getWeather";
import getWeatherType from "../Functions/getWeatherType";
import getEmoji from "../Functions/getEmoji";
import useLocationTracker from "../Functions/useLocationTracker";
import SearchBar from "../Functions/searchBar";

const createIcon = (emoji) =>
  L.divIcon({
    html: `<div style="font-size:28px">${emoji}</div>`,
    className: "",
  });

/* ---------------- MAP CONTROLLER ---------------- */
function MapController({
  userLocation,
  searchMarker,
  setSearchMarker,
  setClickedWeather,
  setMapInstance,   // 🔥 NEW
}) {
  const map = useMap();

  // store map reference once
  useEffect(() => {
    setMapInstance(map);
  }, [map]);

  /* CENTER ON USER */
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lon) {
      map.setView([userLocation.lat, userLocation.lon], 11);
    }
  }, [userLocation]);

  /* CLICK ON MAP */
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;

      const weather = await getWeather(lat, lng);
      const type = getWeatherType(
        weather?.current_weather?.weathercode
      );

      setSearchMarker({
        name: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
        lat,
        lon: lng,
        type,
      });

      setClickedWeather(type);
      map.setView([lat, lng], 12);
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [map]);

  return null;
}

/* ---------------- WEATHER LAYER ---------------- */
function WeatherLayer({
  userLocation,
  setUserLocation,
  searchMarker,
}) {
  const map = useMap();

  const [places, setPlaces] = useState([]);
  const [userWeather, setUserWeather] = useState(null);

  const timeoutRef = useRef(null);

  useLocationTracker(async (location) => {
    setUserLocation(location);

    const w = await getWeather(location.lat, location.lon);
    setUserWeather(getWeatherType(w?.current_weather?.weathercode));
  });

  useEffect(() => {
    const load = async () => {
      const bounds = map.getBounds();
      const data = await getPlaces(bounds);

      const enriched = await Promise.all(
        data.map(async (p) => {
          const w = await getWeather(p.lat, p.lon);

          return {
            lat: p.lat,
            lon: p.lon,
            name: p.tags?.name || "Unknown",
            type: getWeatherType(
              w?.current_weather?.weathercode
            ),
          };
        })
      );

      setPlaces(enriched);
    };

    const handleMove = () => {
      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        load();
      }, 1500);
    };

    load();
    map.on("move", handleMove);

    return () => {
      map.off("move", handleMove);
      clearTimeout(timeoutRef.current);
    };
  }, [map]);

  return (
    <>
      {/* SELECTED LOCATION */}
      {searchMarker?.lat && searchMarker?.lon && (
        <Marker
          position={[searchMarker.lat, searchMarker.lon]}
          icon={createIcon("📍")}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div>
              <b>{searchMarker.name}</b>
              <br />
              {searchMarker.type}
            </div>
          </Tooltip>
        </Marker>
      )}

      {/* USER */}
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
                box-shadow: 0 0 20px #00bfff;
              ">
                ${getEmoji(userWeather)}
              </div>
            `,
            className: "",
            iconSize: [48, 48],
          })}
        >
          <Tooltip>
            <strong>Your Location</strong>
            <br />
            Weather: {userWeather}
          </Tooltip>
        </Marker>
      )}

      {/* PLACES */}
      {places.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lon]}
          icon={createIcon(getEmoji(p.type))}
        >
          <Tooltip>
            <b>{p.name}</b>
            <br />
            {p.type}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

/* ---------------- MAIN MAP ---------------- */
export default function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [clickedWeather, setClickedWeather] = useState(null);

  const [mapInstance, setMapInstance] = useState(null); // 🔥 NEW

  return (
    <>
      {/* SEARCH BAR */}
      <SearchBar
        onSelect={async (loc) => {
          if (!loc?.lat || !loc?.lon) return;

          const weather = await getWeather(loc.lat, loc.lon);

          setSearchMarker({
            name: loc.name || "Searched Location",
            lat: loc.lat,
            lon: loc.lon,
            type: getWeatherType(
              weather?.current_weather?.weathercode
            ),
          });

          // 🔥 THIS IS THE IMPORTANT PART
          mapInstance?.setView([loc.lat, loc.lon], 13);
        }}
      />

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

        <MapController
          userLocation={userLocation}
          searchMarker={searchMarker}
          setSearchMarker={setSearchMarker}
          setClickedWeather={setClickedWeather}
          setMapInstance={setMapInstance}   // 🔥 NEW
        />

        <WeatherLayer
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          searchMarker={searchMarker}
        />
      </MapContainer>
    </>
  );
}