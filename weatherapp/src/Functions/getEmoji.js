const getEmoji = (type) => {

    switch (type) {
  
      case "sun":
        return "☀️";
  
      case "cloud":
        return "☁️";
  
      case "rain":
        return "🌧️";
  
      case "storm":
        return "⛈️";
  
      default:
        return "🌤️";
    }
  };

export default getEmoji