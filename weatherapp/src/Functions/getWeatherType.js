const getWeatherType = (code) => {

    if (code === 0) return "Clear Sky";
  
    if (code <= 3) return "Slightly Cloudy";
  
    if (code >= 45 && code <= 48)
      return "Foggy";
  
    if (code >= 51 && code <= 55)
      return "Drizzle";
  
    if (code >= 95)
      return "Stormy";
  
    return "Not Available";
  };

  export default getWeatherType;