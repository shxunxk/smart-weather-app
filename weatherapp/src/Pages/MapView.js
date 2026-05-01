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

/* ---------------- WEATHER DETAILS COMPONENT ---------------- */
function WeatherDetails({ weatherData }) {
    // Hooks must be called unconditionally before any early returns
    const [selectedDate, setSelectedDate] = useState(weatherData?.daily?.time?.[0] || "");
  
    if (!weatherData?.current_weather) return null;
  
    const cw = weatherData.current_weather;
    const units = weatherData.current_weather_units || {};
  
    const handleChange = (e) => {
      setSelectedDate(e.target.value);
    };
  
    return (
      <>
        <b>Current Weather:</b><br/>
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
              // Check if the item matches the selected date
              if (item.split('T')[0] !== selectedDate) return null;
  
              const hour = item.split('T')[1];
              const weatherCode = weatherData?.hourly?.weathercode?.[idx];
              const precipitation = weatherData?.hourly?.precipitation?.[idx];
  
              return (
                <div key={item}>
                  <b>Hour: {hour}</b> | Weather: {getEmoji(getWeatherType(weatherCode))} | Precipitation: {precipitation} {units.precipitation}
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
  searchMarker,
  setSearchMarker,
  setClickedWeather,
  setMapInstance,
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map]);

  /* CENTER ON USER */
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lon) {
      map.setView([userLocation.lat, userLocation.lon], 11);
    }
  }, [userLocation]);

  /* CLICK ON MAP - Store full weather */
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;
      const fullWeather = await getWeather(lat, lng);  // Full data

      setSearchMarker({
        name: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
        lat,
        lon: lng,
        weather: fullWeather,  // Store full object
        type: getWeatherType(fullWeather?.current_weather?.weathercode),
      });

      setClickedWeather(fullWeather);
      map.setView([lat, lng], 12);
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [map, setSearchMarker, setClickedWeather]);

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
    const [userWeatherData, setUserWeatherData] = useState(null);  // Full data
  
    const timeoutRef = useRef(null);
  
    useLocationTracker(async (location) => {
      setUserLocation(location);
      const fullWeather = await getWeather(location.lat, location.lon);
      setUserWeatherData(fullWeather);  // Store full data
    });
  
    useEffect(() => {
      const load = async () => {
        const bounds = map.getBounds();
        const data = await getPlaces(bounds);
  
        const enriched = await Promise.all(
          data.map(async (p) => {
            const fullWeather = await getWeather(p.lat, p.lon);
            return {
              lat: p.lat,
              lon: p.lon,
              name: p.tags['name:en'] || p.tags['name'],
              weather: fullWeather,  // Store full data
              type: getWeatherType(fullWeather?.current_weather?.weathercode),
            };
          })
        );
  
        setPlaces(enriched);
      };
  
      const handleMove = () => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(load, 1500);
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
        {searchMarker?.weather && (
          <Marker
            position={[searchMarker.lat, searchMarker.lon]}
            icon={createIcon("📍")}
          >
            <Popup>
              <div>
                <b>Place: {searchMarker.name}</b>
                <br />
                <b>{searchMarker.type}</b>
                <br/>
                <WeatherDetails weatherData={searchMarker.weather} />
              </div>
            </Popup>
          </Marker>
        )}
  
        {/* USER LOCATION */}
        {userLocation && userWeatherData && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={L.divIcon({
              html: `
                <div style="
                  width: 48px; height: 48px; border-radius: 50%;
                  background: rgba(0,191,255,0.2); border: 2px solid #00bfff;
                  display:flex; align-items:center; justify-content:center;
                  font-size:24px; box-shadow: 0 0 20px #00bfff;
                ">
                  ${getEmoji(userWeatherData.weathercode || userWeatherData.current_weather?.weathercode)}
                </div>
              `,
              className: "",
              iconSize: [48, 48],
            })}
          >
            <Popup>
              <div>
                <strong>Your Location</strong>
                <br />
                <b>{getWeatherType(userWeatherData.current_weather?.weathercode)}</b>
                <br/>
                <WeatherDetails weatherData={userWeatherData} />
              </div>
            </Popup>
          </Marker>
        )}
  
        {/* PLACES */}
        {places.map((p, i) => p.weather && (
          <Marker
            key={i}
            position={[p.lat, p.lon]}
            icon={createIcon(getEmoji(p.weather.weathercode || p.weather.current_weather?.weathercode))}
          >
            <Popup>
              <div>
                <b>{p.name}</b>
                <br />
                <b>{p.type}</b>
                <br/>
                <WeatherDetails weatherData={p.weather} />
              </div>
            </Popup>
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
  const [mapInstance, setMapInstance] = useState(null);

  return (
    <>
      <SearchBar
        onSelect={async (loc) => {
          if (!loc?.lat || !loc?.lon) return;
          const fullWeather = await getWeather(loc.lat, loc.lon);

          setSearchMarker({
            name: loc.name || "Searched Location",
            lat: loc.lat,
            lon: loc.lon,
            weather: fullWeather,
            type: getWeatherType(fullWeather?.current_weather?.weathercode),
          });

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
          setMapInstance={setMapInstance}
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