const getEmoji = (type, day=0) => {

    switch (type) {
  
      case "Clear Sky":
        if(day){
            return "☀️";
        } else{
            return "🌕"
        }
  
      case "Slightly Cloudy":
        if(day){
            return "⛅";
        } else{
            return "🌕"
        }
  
      case "Foggy":
        return "🌫️";
  
      case "Drizzle":
        return "☂️";

      case "Snow":
        return "❄️";

      case "Rain":
        return "☔";

      case "Rain Showers":
        return "🌧️";

      case "Thunder Storm":
        return "⛈️"
  
      default:
        return "🤦‍♀️";
    }
  };

export default getEmoji