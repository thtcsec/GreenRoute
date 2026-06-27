import { NextResponse } from 'next/server';
import { WeatherData } from '@/types';

// Cache route trong 5 phút (Next.js ISR)
export const revalidate = 300;

// Tọa độ trung tâm Thủ Đức (gần Đại học Quốc gia)
const THU_DUC_LAT = 10.877;
const THU_DUC_LON = 106.802;

// ─── Open-Meteo Forecast API (miễn phí, không cần key) ─────────────────────
// Docs: https://open-meteo.com/en/docs
const OPEN_METEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${THU_DUC_LAT}&longitude=${THU_DUC_LON}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,apparent_temperature,wind_speed_10m&hourly=precipitation_probability&timezone=Asia%2FBangkok&forecast_days=1`;

export async function GET() {
  try {
    const res = await fetch(OPEN_METEO_URL, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.warn('Open-Meteo API Error, using fallback data');
      return NextResponse.json(getMockWeatherData());
    }

    const data = await res.json();
    const current = data.current;

    if (!current) {
      return NextResponse.json(getMockWeatherData());
    }

    const temperature = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const rainVolume = (current.rain || 0) + (current.showers || 0);
    const precipitation = current.precipitation || 0;
    const weatherCode = current.weather_code || 0;

    // Map WMO weather code → mô tả tiếng Việt & icon
    const { description, icon } = mapWeatherCode(weatherCode);

    // Ước lượng UV Index từ weather code + nhiệt độ (Open-Meteo current không trả UV)
    const isDay = new Date().getHours() >= 6 && new Date().getHours() <= 18;
    let uvIndex = 0;
    if (isDay) {
      if (weatherCode <= 1) uvIndex = feelsLike > 38 ? 11 : feelsLike > 33 ? 9 : 6;
      else if (weatherCode <= 3) uvIndex = 4;
      else uvIndex = 2; // Mây hoặc mưa
    }

    // Xác định mức cảnh báo
    let alertLevel: WeatherData['alertLevel'] = 'low';
    if (feelsLike >= 40 || uvIndex >= 11 || precipitation > 50) {
      alertLevel = 'extreme';
    } else if (feelsLike >= 35 || uvIndex >= 8 || precipitation > 20) {
      alertLevel = 'high';
    } else if (feelsLike >= 30 || rainVolume > 5) {
      alertLevel = 'moderate';
    }

    // Lấy precipitation_probability giờ hiện tại
    let precipProbability = 0;
    if (data.hourly?.precipitation_probability) {
      const currentHour = new Date().getHours();
      precipProbability = data.hourly.precipitation_probability[currentHour] || 0;
    }

    const weatherData: WeatherData = {
      temperature,
      feelsLike,
      humidity,
      uvIndex,
      weatherCondition: description,
      rainVolume: +precipitation.toFixed(1),
      windSpeed: +(windSpeed / 3.6).toFixed(1), // km/h → m/s
      icon,
      alertLevel,
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Weather API fetch error:', error);
    return NextResponse.json(getMockWeatherData());
  }
}

// ─── WMO Weather Code Mapping ───────────────────────────────────────────────
// https://open-meteo.com/en/docs#weathervariables
function mapWeatherCode(code: number): { description: string; icon: string } {
  const map: Record<number, { description: string; icon: string }> = {
    0: { description: 'Trời quang', icon: 'https://openweathermap.org/img/wn/01d@2x.png' },
    1: { description: 'Chủ yếu quang', icon: 'https://openweathermap.org/img/wn/01d@2x.png' },
    2: { description: 'Có mây rải rác', icon: 'https://openweathermap.org/img/wn/02d@2x.png' },
    3: { description: 'Nhiều mây', icon: 'https://openweathermap.org/img/wn/04d@2x.png' },
    45: { description: 'Sương mù', icon: 'https://openweathermap.org/img/wn/50d@2x.png' },
    48: { description: 'Sương mù đóng băng', icon: 'https://openweathermap.org/img/wn/50d@2x.png' },
    51: { description: 'Mưa phùn nhẹ', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    53: { description: 'Mưa phùn vừa', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    55: { description: 'Mưa phùn dày', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    61: { description: 'Mưa nhẹ', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
    63: { description: 'Mưa vừa', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
    65: { description: 'Mưa lớn', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
    80: { description: 'Mưa rào nhẹ', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    81: { description: 'Mưa rào vừa', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    82: { description: 'Mưa rào lớn', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
    95: { description: 'Giông bão', icon: 'https://openweathermap.org/img/wn/11d@2x.png' },
    96: { description: 'Giông bão kèm mưa đá nhẹ', icon: 'https://openweathermap.org/img/wn/11d@2x.png' },
    99: { description: 'Giông bão kèm mưa đá lớn', icon: 'https://openweathermap.org/img/wn/11d@2x.png' },
  };

  return map[code] || { description: 'Không xác định', icon: 'https://openweathermap.org/img/wn/01d@2x.png' };
}

// ─── Fallback Mock Data (thời tiết khắc nghiệt để demo cảnh báo) ───────────
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
    alertLevel: 'extreme',
  };
}
