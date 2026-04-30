const getWeather = async (lat, lon) => {

    console.log(lat, lon)
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
  
    const data = await res.json();
  
    console.log("WEATHER DATA:", data);
  
    return data;
  };

  export default getWeather;