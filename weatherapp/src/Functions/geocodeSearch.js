import toast from "react-hot-toast";

const geocodeSearch = async (query, userLoc) => {

  let data = [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
    );

    data = await res.json();

    if(!res.ok){
      throw new Error(`HTTP Error: ${res.status}`);
    }

  } catch (err) {
    toast.error("Nominatim API temporarily down", {
      duration: 5000,
    });
    return [];
  }

  if (!userLoc) {
    return data;
  }

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