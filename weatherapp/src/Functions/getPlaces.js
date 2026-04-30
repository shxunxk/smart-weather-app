const getPlaces = async (bounds) => {

  console.log("Entered places");

  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();

  // 🌍 Urban regions only
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

  const data =
    await response.json();

  // 🚀 Prioritize meaningful urban regions
  const sortedPlaces =
    data.elements.sort((a, b) => {

      const priority = {

        suburb: 5,
        borough: 4,
        quarter: 3,
        town: 3,
        village: 3,
        city: 1,
      };

      return (
        (priority[b.tags?.place] || 0) -
        (priority[a.tags?.place] || 0)
      );
    });

  // ✅ Limit results
  const limitedPlaces =
    sortedPlaces.slice(0, 100);

  console.log(
    "Filtered Places:",
    limitedPlaces
  );

  return limitedPlaces;
};

export default getPlaces;