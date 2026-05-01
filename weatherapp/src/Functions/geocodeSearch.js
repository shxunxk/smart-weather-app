const geocodeSearch = async (query, userLoc) => {

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}`,
    {
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  const data = await res.json();

  const withDistance = data.map((p) => {

    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);

    const d = Math.sqrt(
      Math.pow(lat - userLoc.lat, 2) +
      Math.pow(lon - userLoc.lon, 2)
    );

    return {
      ...p,
      distance: d,
    };
  });

  return withDistance.sort((a, b) => a.distance - b.distance);
};

export default geocodeSearch;