const getPlaces = async (bounds) => {
  console.log("Fetching places")

  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();

  // 🌍 Fetch towns + villages + urban areas
  const query = `
    [out:json][timeout:25];

    (
      node["place"="suburb"](${south},${west},${north},${east}); 
      node["place"="borough"](${south},${west},${north},${east}); 
      node["place"="quarter"](${south},${west},${north},${east}); 
      node["place"="town"](${south},${west},${north},${east}); 
      node["place"="city"](${south},${west},${north},${east}); 
      node["place"="village"](${south},${west},${north},${east});
    );

    out body;
  `;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      body: query,
    }
  );

  const data = await response.json();

  // 🧠 Safety check
  if (!data?.elements) return [];

  // 📏 priority scoring (importance)
  const priority = {
    suburb: 5, borough: 4, quarter: 3, town: 3, village: 3, city: 1,
  };

  // 📦 grid bucket (spatial partitioning)
  const getBucket = (lat, lon, gridSize = 3) => {
    const latStep = (north - south) / gridSize;
    const lonStep = (east - west) / gridSize;

    const latIndex = Math.min(
      gridSize - 1,
      Math.floor((lat - south) / latStep)
    );

    const lonIndex = Math.min(
      gridSize - 1,
      Math.floor((lon - west) / lonStep)
    );

    return `${latIndex}-${lonIndex}`;
  };

  // 🧩 group by spatial bucket
  const gridMap = new Map();

  for (const p of data.elements) {

    if (!p.lat || !p.lon) continue;

    const bucket = getBucket(p.lat, p.lon, 3);

    const score = priority[p.tags?.place] || 10;

    if (!gridMap.has(bucket)) {
      gridMap.set(bucket, []);
    }

    gridMap.get(bucket).push({
      ...p,
      score,
    });
  }

  // 🎯 pick balanced results
  const result = [];

  for (const [, list] of gridMap.entries()) {

    list.sort((a, b) => a.score - b.score);

    // take few from each region
    result.push(...list.slice(0, 6));
  }

  // 🔥 final cap
  const limitedPlaces = result.slice(0, 100);

  console.log("Found", limitedPlaces)

  return limitedPlaces;
};

export default getPlaces;