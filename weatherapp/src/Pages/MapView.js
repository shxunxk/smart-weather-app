import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
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

/* ---------------- WEATHER DETAILS ---------------- */
function WeatherDetails({ weatherData }) {
  const [selectedDate, setSelectedDate] = useState(
    weatherData?.daily?.time?.[0] || ""
  );

  if (!weatherData?.current_weather) return null;

  const cw = weatherData.current_weather;
  const units = weatherData.current_weather_units || {};

  const handleChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <>
      <br /><b>Current Weather:</b><br/>
      Time: {cw.time}<br/>
      Temp: {cw.temperature}{units.temperature} - Max: {weatherData?.daily?.temperature_2m_max?.[0]} {units.temperature} Min: {weatherData?.daily?.temperature_2m_min?.[0]} {units.temperature}<br/>
      Wind: {cw.windspeed} {units.windspeed} from {cw.winddirection} {units.winddirection}<br/>
      
      {weatherData.daily && (
        <>
          <br/>
          <b>Predicted Temperatures</b>
          <br />
          <select value={selectedDate} onChange={handleChange}>
            {weatherData?.daily?.time?.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <br/>

          <b>Hourly Weather details for {selectedDate}</b>
          <br/>
          
          {weatherData?.hourly?.time?.map((item, idx) => {
            if (item.split('T')[0] !== selectedDate) return null;

            const hour = item.split('T')[1];
            const weatherCode = weatherData?.hourly?.weathercode?.[idx];
            const hourNum = Number(hour.split(":")[0]);
            const day = hourNum >= 6 && hourNum <= 17 ? 1 : 0;

            return (
              <div key={item}>
                <b>Hour: {hour}</b> | Weather: {getWeatherType(weatherCode)}{getEmoji(getWeatherType(weatherCode), day)}
              </div>
            );
          })}
          <br />
        </>
      )}
    </>
  );
}

/* ---------------- MAP CONTROLLER ---------------- */
function MapController({
  userLocation,
  setSearchMarker,
  triggerFetch,
  setMapInstance,
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map]);

  useEffect(() => {
    if (userLocation?.lat) {
      map.setView([userLocation.lat, userLocation.lon], 11);
    }
  }, [userLocation]);

  useEffect(() => {
    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;
      const weather = await getWeather(lat, lng);

      setSearchMarker({
        name: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
        lat,
        lon: lng,
        weather,
        type: getWeatherType(weather?.current_weather?.weathercode),
      });

      map.setView([lat, lng], 12);
      triggerFetch();
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
  triggerFetch,
}) {
  const map = useMap();

  const [places, setPlaces] = useState([]);
  const [userWeatherData, setUserWeatherData] = useState(null);

  const debounceRef = useRef(null);
  const ignoreMoveRef = useRef(false); // ✅ NEW

  const fetchPlaces = async () => {
    const bounds = map.getBounds();
    const data = await getPlaces(bounds);

    const limited = data.slice(0, 40);

    const enriched = await Promise.all(
      limited.map(async (p) => {
        const weather = await getWeather(p.lat, p.lon);

        return {
          lat: p.lat,
          lon: p.lon,
          name: p.tags["name:en"] || p.tags.name || "Unknown",
          weather,
          type: getWeatherType(
            weather?.current_weather?.weathercode
          ),
        };
      })
    );

    setPlaces(enriched);
  };

  const debouncedFetch = () => {
    if (ignoreMoveRef.current) return; // ✅ NEW

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (map.getZoom() < 10) return;

      console.log("🔥 Fetching places...");
      fetchPlaces();
    }, 3000);
  };

  useEffect(() => {
    if (triggerFetch) {
      triggerFetch.current = debouncedFetch;
    }
  }, [debouncedFetch]);

  useEffect(() => {
    const handler = () => {
      if (ignoreMoveRef.current) return; // ✅ NEW
      debouncedFetch();
    };

    map.on("moveend", handler);
    map.on("zoomend", handler);

    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
      clearTimeout(debounceRef.current);
    };
  }, [map]);

  useLocationTracker(async (location) => {
    setUserLocation(location);

    const weather = await getWeather(location.lat, location.lon);
    setUserWeatherData(weather);

    debouncedFetch();
  });

  const popupHandlers = {
    add: () => {
      ignoreMoveRef.current = true;
    },
    remove: () => {
      setTimeout(() => {
        ignoreMoveRef.current = false;
      }, 300);
    },
  };

  return (
    <>
      {searchMarker?.weather && (
        <Marker position={[searchMarker.lat, searchMarker.lon]} icon={createIcon("📍")}>
          <Popup className="custom-popup" autoPan={false} eventHandlers={popupHandlers}>
            <b>{searchMarker.name}</b><br />
            {searchMarker.type} {getEmoji(searchMarker.type)}
            <WeatherDetails weatherData={searchMarker.weather} />
          </Popup>
        </Marker>
      )}

      {userLocation && userWeatherData && (
        <Marker position={[userLocation.lat, userLocation.lon]}
        icon={L.divIcon({
          html: `<div style="width:48px;height:48px;border-radius:50%;background:rgba(0,191,255,0.2);border:2px solid #00bfff;display:flex;align-items:center;justify-content:center;font-size:24px;">${getEmoji(getWeatherType(userWeatherData.current_weather?.weathercode))}</div>`,
          className: "",
          iconSize: [48, 48],
        })}>
          <Popup className="custom-popup" autoPan={false} eventHandlers={popupHandlers}>
            <b>Your Location</b><br />
            {getWeatherType(userWeatherData.current_weather.weathercode)}
            <WeatherDetails weatherData={userWeatherData} />
          </Popup>
        </Marker>
      )}

      {places.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lon]} icon={createIcon(getEmoji(p.type))}>
          <Popup className="custom-popup" autoPan={false} eventHandlers={popupHandlers}>
            <b>{p.name}</b><br />
            {p.type}
            <WeatherDetails weatherData={p.weather} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

/* ---------------- MAIN ---------------- */
export default function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const triggerFetch = useRef(null);

  return (
    <>
      <SearchBar
        onSelect={async (loc) => {
          if (!loc?.lat) return;

          const weather = await getWeather(loc.lat, loc.lon);

          setSearchMarker({
            name: loc.name || "Searched Location",
            lat: loc.lat,
            lon: loc.lon,
            weather,
            type: getWeatherType(
              weather?.current_weather?.weathercode
            ),
          });

          mapInstance?.setView([loc.lat, loc.lon], 13);
          triggerFetch.current?.();
        }}
      />

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO' />

        <MapController
          userLocation={userLocation}
          setSearchMarker={setSearchMarker}
          triggerFetch={() => triggerFetch.current?.()}
          setMapInstance={setMapInstance}
        />

        <WeatherLayer
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          searchMarker={searchMarker}
          triggerFetch={triggerFetch}
        />
      </MapContainer>
    </>
  );
}