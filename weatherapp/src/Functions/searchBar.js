import { useState } from "react";

const geocodeSearch = async (query) => {
  if (!query) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  );

  const data = await res.json();

  return data
    .filter((item) => item.lat && item.lon)
    .map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
};

export default function SearchBar({ onSelect }) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = async (e) => {
    const value = e.target.value;
    setText(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const results = await geocodeSearch(value);
    setSuggestions(results.slice(0, 5)); // top 5 closest/relevant
  };

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
      <input
        value={text}
        onChange={handleChange}
        placeholder="Search places..."
        style={{
          padding: "8px",
          width: "250px",
          borderRadius: "6px",
        }}
      />

      {/* suggestions */}
      <div
        style={{
          background: "white",
          color: "black",
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        {suggestions.map((s, i) => (
          <div
            key={i}
            onClick={() => {
              if (!s?.lat || !s?.lon) return;

              onSelect(s);
              setSuggestions([]);
              setText(s.name);
            }}
            style={{
              padding: "6px",
              cursor: "pointer",
              borderBottom: "1px solid #ddd",
            }}
          >
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}