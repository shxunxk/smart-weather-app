import toast from "react-hot-toast";

const getWeather = async (lat, lon) => {

  let data = []
    try{
      const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata&forecast_days=14`
    );
    data = await res.json();

    if(!res.ok){
      throw new Error(`HTTP Error: ${res.status}`);
    }
  }catch(err){
      toast.error("Open Meteo API temporarily down", {
        duration: 5000,
      })
    }    
    return data;
  };

  export default getWeather;