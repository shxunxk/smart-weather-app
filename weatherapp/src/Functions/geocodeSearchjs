const geocodeSearch = async (query, userLoc) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );
  
    const data = await res.json();
  
    const withDistance = data.map((p) => {
      const d =
        Math.sqrt(
          Math.pow(p.lat - userLoc.lat, 2) +
          Math.pow(p.lon - userLoc.lon, 2)
        );
  
      return { ...p, distance: d };
    });
  
    return withDistance.sort((a, b) => a.distance - b.distance);
  };
  
  export default geocodeSearch;