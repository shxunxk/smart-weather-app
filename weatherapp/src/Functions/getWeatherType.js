const getWeatherType = (code) => {

  if (code === null || code === undefined) return "Not Available";
  
  if (code === 0) return "Clear Sky";

  if (code >= 1 && code <= 3) return "Slightly Cloudy";

  if (code >= 45 && code <= 48) return "Foggy";

  if (code >= 51 && code <= 55) return "Drizzle";

  if (code >= 61 && code <= 67) return "Rain";

  if (code >= 71 && code <= 77) return "Snow";

  if (code >= 80 && code <= 82) return "Rain Showers";

  if (code >= 95 && code <= 99) return "Thunderstorm";

  return "Not Available";
};

export default getWeatherType;