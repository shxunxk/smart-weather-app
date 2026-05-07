import { useState } from "react";
import MapView from "./Pages/MapView";
import SearchBar from "./Pages/searchBar";

function App() {
  const [selected, setSelected] = useState({
    lat: null,
    lon: null,
    name: null,
  });

  return (
    <div style={{ position: "relative" }}>
      {/* MAP */}
      <MapView
        selected={selected}
      />

      {/* SEARCH BAR TOP LEFT */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
        }}
      >
        <SearchBar
          userLoc={selected}
          onSelect={(place) => { setSelected(place)}}
        />
      </div>
    </div>
  );
}

export default App;