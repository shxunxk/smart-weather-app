import { useEffect, useState } from "react";
import geocodeSearch from "./geocodeSearch";

function SearchBar({ userLoc }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // debounce search
  useEffect(() => {
    // don't search for very small inputs
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
    }, 1000);

    // cleanup old timer
    return () => clearTimeout(timeout);

  }, [query, userLoc]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search location..."
        value={query}
        onChange={handleChange}
      />

      {loading && <p>Loading...</p>}

      {places.map((place) => (
        <div key={place.place_id}>
          {place.display_name}
        </div>
      ))}
    </div>
  );
}

export default SearchBar;