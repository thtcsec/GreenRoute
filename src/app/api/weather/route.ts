import { NextResponse } from 'next/server';
import { WeatherData } from '@/types';

// Cache route trong 5 phút để tiết kiệm API calls (Next.js App Router feature)
export const revalidate = 300;

// Tọa độ trung tâm Thủ Đức (gần Đại học Quốc gia)
const THU_DUC_LAT = 10.8700;
const THU_DUC_LON = 106.8030;

export async function GET() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  // Nếu không có API Key, trả về dữ liệu mẫu (fallback)
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return NextResponse.json(getMockWeatherData());
  }

  try {
    // Chúng ta gọi One Call API 3.0 nếu có để lấy đủ data, 
    // hoặc gọi Current Weather API 2.5
    // Ở đây demo sử dụng 2.5 /weather (để dễ có API key) + fallback UV index
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${THU_DUC_LAT}&lon=${THU_DUC_LON}&appid=${apiKey}&units=metric&lang=vi`,
      { next: { revalidate: 300 } }
    );

    if (!weatherRes.ok) {
      console.warn('OpenWeatherMap API Error, using fallback data');
      return NextResponse.json(getMockWeatherData());
    }

    const data = await weatherRes.json();

    const temperature = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const weatherCondition = data.weather[0]?.description || 'Trời quang';
    const icon = data.weather[0]?.icon || '01d';
    const rainVolume = data.rain ? data.rain['1h'] : 0;

    // API 2.5 /weather không có UV index, ta có thể mock UV hoặc giả định theo giờ/nắng
    const isDay = icon.includes('d');
    const uvIndex = isDay ? (feelsLike > 35 ? 10 : 7) : 0; // Giả lập UV dựa vào cảm giác nóng ban ngày

    // Xác định mức độ cảnh báo (alertLevel)
    let alertLevel: WeatherData['alertLevel'] = 'low';
    if (feelsLike >= 40 || uvIndex >= 11) {
      alertLevel = 'extreme';
    } else if (feelsLike >= 35 || uvIndex >= 8) {
      alertLevel = 'high';
    } else if (feelsLike >= 30 || rainVolume > 10) {
      alertLevel = 'moderate';
    }

    const weatherData: WeatherData = {
      temperature,
      feelsLike,
      humidity,
      uvIndex,
      weatherCondition: weatherCondition.charAt(0).toUpperCase() + weatherCondition.slice(1),
      rainVolume,
      windSpeed,
      icon: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      alertLevel
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Weather API fetch error:', error);
    return NextResponse.json(getMockWeatherData());
  }
}

// Hàm cung cấp dữ liệu giả lập (thời tiết khắc nghiệt để demo cảnh báo)
function getMockWeatherData(): WeatherData {
  return {
    temperature: 36,
    feelsLike: 41,
    humidity: 55,
    uvIndex: 10,
    weatherCondition: 'Nắng gắt',
    rainVolume: 0,
    windSpeed: 2.5,
    icon: 'https://openweathermap.org/img/wn/01d@2x.png',
    alertLevel: 'extreme'
  };
}
