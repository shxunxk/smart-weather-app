import { useEffect, useState } from "react";
import geocodeSearch from "../Functions/geocodeSearch";

function SearchBar({ userLoc, onSelect }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log(userLoc)

  useEffect(() => {
    if (query.length < 3) {
      setPlaces([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await geocodeSearch(query, userLoc);
        setPlaces(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [query, userLoc]);

  return (
    <div
      style={{
        width: "300px",
        background: "#111",
        borderRadius: "8px",
        color: "white",
      }}
    >
      <input
        type="text"
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          border: "none",
          outline: "none",
          background: "#222",
          color: "white",
        }}
      />

      {loading && (
        <div style={{ padding: "10px", fontSize: "12px" }}>Loading...</div>
      )}

      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
        {places.map((place) => (
          <div
            key={place.place_id}
            onClick={() => {
              console.log("Selected:", place);
            
              onSelect({
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon),
                name: place.display_name,
              });
            }}
            style={{
              padding: "10px",
              cursor: "pointer",
              borderBottom: "1px solid #222",
            }}
          >
            {place.display_name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;