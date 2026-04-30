const getPlaces = async (bounds) => {

    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();
  
    const query = `
      [out:json];
  
      (
        node["place"](
          ${south},
          ${west},
          ${north},
          ${east}
        );
      );
  
      out body;
    `;
  
    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query,
      }
    );
  
    const data = await res.json();
  
    return data.elements || [];
  };
  
  export default getPlaces;