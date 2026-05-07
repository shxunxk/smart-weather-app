import toast from "react-hot-toast";

const getPlaces = async (bounds) => {
  toast.loading("Fetching places", {
    duration: 5000,
  })

  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();
  
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

  let data = []

  try{
    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query,
      }
    );

    data = await res.json();

    if(!res.ok){
      throw new Error(`HTTP Error: ${res.status}`);
    }
  }catch(err){
    toast.error("Overpass API temporarily down", {
      duration: 5000,
    })
  }

  if (!data?.elements) return [];

  const priority = {
    suburb: 5, borough: 4, quarter: 3, town: 3, village: 3, city: 1,
  };

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

  const result = [];

  for (const [, list] of gridMap.entries()) {

    list.sort((a, b) => a.score - b.score);

    // take few from each region
    result.push(...list.slice(0, 3));
  }

  const limitedPlaces = result.slice(0, 25);

  toast.success("Found places", {
    duration: 5000,
  })

  return limitedPlaces;
};

export default getPlaces;