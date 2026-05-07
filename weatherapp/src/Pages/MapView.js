import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import toast, { Toaster } from "react-hot-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import getPlaces from "../Functions/getPlaces";
import getWeather from "../Functions/getWeather";
import getWeatherType from "../Functions/getWeatherType";
import getEmoji from "../Functions/getEmoji";
import useLocationTracker from "../Functions/useLocationTracker";
// import SearchBar from "../Functions/searchBar";

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
      Time: {cw.time.split("T")[1]}<br/>
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
  setSelectedLocation,   // ✅ ADDED
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map]);

  useEffect(() => {
    if (userLocation?.lat) {
      map.flyTo([userLocation.lat, userLocation.lon], 11);
    }
  }, [userLocation]);

  useEffect(() => {
    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;
      const weather = await getWeather(lat, lng);

      const location = {
        name: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
        lat,
        lon: lng,
        weather,
        type: getWeatherType(weather?.current_weather?.weathercode),
      };

      setSearchMarker(location);

      // 🔥 NEW: unified map state
      setSelectedLocation(location);

      map.flyTo([lat, lng], 12);
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
  const ignoreMoveRef = useRef(false);

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
          type: getWeatherType(weather?.current_weather?.weathercode),
        };
      })
    );

    setPlaces(enriched);
  };

  const debouncedFetch = () => {
    if (ignoreMoveRef.current) return;

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (map.getZoom() < 10) return;

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
      if (ignoreMoveRef.current) return;
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
        <Marker
          position={[searchMarker.lat, searchMarker.lon]}
          icon={createIcon("📍")}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {searchMarker.name}
          </Tooltip>

          <Popup className="custom-popup" autoPan={false} eventHandlers={popupHandlers}>
            <b>{searchMarker.name}</b><br />
            {searchMarker.type} {getEmoji(searchMarker.type)}
            <WeatherDetails weatherData={searchMarker.weather} />
          </Popup>
        </Marker>
      )}

      {userLocation && userWeatherData && (
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={L.divIcon({
            html: `<div style="width:48px;height:48px;border-radius:50%;background:rgba(0,191,255,0.2);border:2px solid #00bfff;display:flex;align-items:center;justify-content:center;font-size:24px;">${getEmoji(getWeatherType(userWeatherData.current_weather?.weathercode))}</div>`,
            className: "",
            iconSize: [48, 48],
          })}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            You are here
          </Tooltip>

          <Popup className="custom-popup" autoPan={false} eventHandlers={popupHandlers}>
            <b>Your Location</b><br />
            {getWeatherType(userWeatherData.current_weather.weathercode)}
            <WeatherDetails weatherData={userWeatherData} />
          </Popup>
        </Marker>
      )}

      {places.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lon]}
          icon={createIcon(getEmoji(p.type))}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {p.name}
          </Tooltip>

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
export default function MapView({
  selected
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const triggerFetch = useRef(null);

  useEffect(() => {
    const loadSelectedLocation = async () => {
      if (selected?.lat && selected?.lon) {
        const weather = await getWeather(selected.lat, selected.lon);
  
        const locationData = {
          ...selected,
          weather,
          type: getWeatherType(
            weather?.current_weather?.weathercode
          ),
        };
  
        setSearchMarker(locationData);
        setSelectedLocation(locationData);
      }
    };
  
    loadSelectedLocation();
  }, [selected]);

  console.log(searchMarker, selectedLocation)

  useEffect(() => {
    if (!selectedLocation || !mapInstance) return;

    mapInstance.flyTo(
      [selectedLocation.lat, selectedLocation.lon],
      13
    );
  }, [selectedLocation, mapInstance]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <MapContainer
        center={[0,0]}
        zoom={5}
        zoomControl={false}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <MapController
          userLocation={userLocation}
          setSearchMarker={setSearchMarker}
          triggerFetch={() => triggerFetch.current?.()}
          setMapInstance={setMapInstance}
          setSelectedLocation={setSelectedLocation} // ✅ ADDED
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