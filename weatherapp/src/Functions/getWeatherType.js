const getWeatherType = (code) => {

    if (code === 0) return "sun";
  
    if (code <= 3) return "cloud";
  
    if (code >= 45 && code <= 67)
      return "rain";
  
    if (code >= 71 && code <= 77)
      return "snow";
  
    if (code >= 95)
      return "storm";
  
    return "cloud";
  };

  export default getWeatherType;