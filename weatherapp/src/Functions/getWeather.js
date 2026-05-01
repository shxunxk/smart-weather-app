const getWeather = async (lat, lon, days) => {

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata&forecast_days=7`
    );
  
    const data = await res.json();
    
    console.log(data)
    return data;
  };

  export default getWeather;