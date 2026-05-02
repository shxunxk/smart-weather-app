const getEmoji = (type, day = 0) => {

  // safeguard: ensure string
  if (typeof type !== "string") return "🤦‍♀️";

  const t = type.trim().toLowerCase();

  switch (t) {

    case "clear sky":
      return day ? "☀️" : "🌕";

    case "slightly cloudy":
    case "partly cloudy":
    case "cloudy":
      return day ? "⛅" : "☁️";

    case "foggy":
      return "🌫️";

    case "drizzle":
      return "☂️";

    case "rain":
      return "☔";

    case "snow":
      return "❄️";

    case "rain showers":
      return "🌧️";

    case "thunderstorm":
      return "⛈️";

    default:
      return "🤦‍♀️";
  }
};

export default getEmoji;