/**
 * Weather Service - OpenWeatherMap Integration
 * Provides current weather, forecast, and caching
 */
import axios from 'axios';
import { type SQLiteDatabase } from 'expo-sqlite';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface CurrentWeather {
  temp: number; // Celsius
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number; // percentage
  pressure: number; // hPa
  wind_speed: number; // m/s
  clouds: number; // percentage
  rain_1h?: number; // mm
  rain_probability?: number; // percentage
  description: string;
  icon: string;
  sunrise: number; // unix timestamp
  sunset: number; // unix timestamp
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD
  temp_day: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  clouds: number;
  rain_probability: number;
  rain_mm: number;
  description: string;
  icon: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
}

interface CachedWeather {
  weather_data: string;
  forecast_data: string;
  fetched_at: string;
  expires_at: string;
}

function mapWmoToWeather(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Cerah', icon: '01d' };
  if (code === 1) return { description: 'Sebagian cerah', icon: '02d' };
  if (code === 2) return { description: 'Cerah berawan', icon: '02d' };
  if (code === 3) return { description: 'Berawan', icon: '03d' };
  if (code === 45 || code === 48) return { description: 'Berkabut', icon: '50d' };
  if (code >= 51 && code <= 55) return { description: 'Gerimis', icon: '09d' };
  if (code >= 61 && code <= 65) return { description: 'Hujan', icon: '10d' };
  if (code >= 80 && code <= 82) return { description: 'Hujan lebat', icon: '09d' };
  if (code >= 95) return { description: 'Hujan badai petir', icon: '11d' };
  return { description: 'Berawan', icon: '03d' };
}

async function fetchFromOpenMeteo(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude,
      longitude,
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'auto',
    },
    timeout: 8000,
  });

  const { current: cur, daily } = response.data;
  const curMeta = mapWmoToWeather(cur.weather_code ?? 0);

  const current: CurrentWeather = {
    temp: cur.temperature_2m ?? 28,
    feels_like: cur.apparent_temperature ?? cur.temperature_2m ?? 28,
    temp_min: daily.temperature_2m_min?.[0] ?? cur.temperature_2m ?? 24,
    temp_max: daily.temperature_2m_max?.[0] ?? cur.temperature_2m ?? 32,
    humidity: cur.relative_humidity_2m ?? 75,
    pressure: 1012,
    wind_speed: Math.round(((cur.wind_speed_10m ?? 8) / 3.6) * 10) / 10,
    clouds: cur.weather_code > 1 ? 75 : 20,
    rain_1h: cur.rain ?? cur.precipitation ?? 0,
    rain_probability: daily.precipitation_probability_max?.[0] ?? 0,
    description: curMeta.description,
    icon: curMeta.icon,
    sunrise: Math.floor(Date.now() / 1000) - 21600,
    sunset: Math.floor(Date.now() / 1000) + 21600,
  };

  const dates = (daily.time as string[]) || [];
  const forecast: ForecastDay[] = dates.slice(1, 8).map((date, idx) => {
    const i = idx + 1;
    const wCode = daily.weather_code?.[i] ?? 0;
    const meta = mapWmoToWeather(wCode);
    const minT = daily.temperature_2m_min?.[i] ?? 23;
    const maxT = daily.temperature_2m_max?.[i] ?? 31;
    const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
    const rainMm = daily.precipitation_sum?.[i] ?? 0;

    return {
      date,
      temp_day: Math.round(((minT + maxT) / 2) * 10) / 10,
      temp_min: minT,
      temp_max: maxT,
      humidity: current.humidity,
      wind_speed: Math.round(((daily.wind_speed_10m_max?.[i] ?? 10) / 3.6) * 10) / 10,
      clouds: wCode > 1 ? 70 : 25,
      rain_probability: rainProb,
      rain_mm: Math.round(rainMm * 10) / 10,
      description: meta.description,
      icon: meta.icon,
    };
  });

  return {
    current,
    forecast,
    location: {
      name: 'Area Sawah',
      country: 'Indonesia',
      lat: latitude,
      lon: longitude,
    },
  };
}

async function fetchFromOpenWeatherMap(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const currentResponse = await axios.get(`${BASE_URL}/weather`, {
    params: {
      lat: latitude,
      lon: longitude,
      appid: API_KEY,
      units: 'metric',
      lang: 'id',
    },
    timeout: 8000,
  });

  const current: CurrentWeather = {
    temp: currentResponse.data.main.temp,
    feels_like: currentResponse.data.main.feels_like,
    temp_min: currentResponse.data.main.temp_min,
    temp_max: currentResponse.data.main.temp_max,
    humidity: currentResponse.data.main.humidity,
    pressure: currentResponse.data.main.pressure,
    wind_speed: currentResponse.data.wind.speed,
    clouds: currentResponse.data.clouds.all,
    rain_1h: currentResponse.data.rain?.['1h'],
    description: currentResponse.data.weather[0].description,
    icon: currentResponse.data.weather[0].icon,
    sunrise: currentResponse.data.sys.sunrise,
    sunset: currentResponse.data.sys.sunset,
  };

  const location = {
    name: currentResponse.data.name,
    country: currentResponse.data.sys.country,
    lat: latitude,
    lon: longitude,
  };

  const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      lat: latitude,
      lon: longitude,
      appid: API_KEY,
      units: 'metric',
      lang: 'id',
      cnt: 40,
    },
    timeout: 8000,
  });

  const dailyMap = new Map<string, any[]>();
  forecastResponse.data.list.forEach((item: any) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap.has(date)) dailyMap.set(date, []);
    dailyMap.get(date)!.push(item);
  });

  const forecast: ForecastDay[] = Array.from(dailyMap.entries())
    .slice(0, 7)
    .map(([date, items]) => {
      const temps = items.map((i: any) => i.main.temp);
      const rainItems = items.filter((i: any) => i.rain && i.rain['3h'] > 0);
      const totalRain = rainItems.reduce((sum: number, i: any) => sum + (i.rain?.['3h'] || 0), 0);

      return {
        date,
        temp_day: items[Math.floor(items.length / 2)].main.temp,
        temp_min: Math.min(...temps),
        temp_max: Math.max(...temps),
        humidity: Math.round(items.reduce((sum: number, i: any) => sum + i.main.humidity, 0) / items.length),
        wind_speed: Math.round(items.reduce((sum: number, i: any) => sum + i.wind.speed, 0) / items.length),
        clouds: Math.round(items.reduce((sum: number, i: any) => sum + i.clouds.all, 0) / items.length),
        rain_probability: Math.round((rainItems.length / items.length) * 100),
        rain_mm: Math.round(totalRain * 10) / 10,
        description: items[Math.floor(items.length / 2)].weather[0].description,
        icon: items[Math.floor(items.length / 2)].weather[0].icon,
      };
    });

  return { current, forecast, location };
}

/**
 * Get current weather and 7-day forecast
 */
export async function getWeather(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  // Check cache first
  const cached = await getCachedWeather(db, latitude, longitude);
  if (cached && !isExpired(cached.expires_at)) {
    return {
      current: JSON.parse(cached.weather_data),
      forecast: JSON.parse(cached.forecast_data),
      location: JSON.parse(cached.weather_data).location,
    };
  }

  let weatherData: WeatherData;

  // If OpenWeather API key is provided, try OpenWeatherMap first; otherwise use free Open-Meteo
  if (API_KEY) {
    try {
      weatherData = await fetchFromOpenWeatherMap(latitude, longitude);
    } catch (error) {
      console.warn('OpenWeatherMap error, falling back to Open-Meteo:', error);
      weatherData = await fetchFromOpenMeteo(latitude, longitude);
    }
  } else {
    weatherData = await fetchFromOpenMeteo(latitude, longitude);
  }

  // Cache the result
  await cacheWeather(db, latitude, longitude, weatherData.current, weatherData.forecast);
  return weatherData;
}

/**
 * Get cached weather data
 */
async function getCachedWeather(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number
): Promise<CachedWeather | null> {
  const cached = await db.getFirstAsync<CachedWeather>(
    `SELECT weather_data, forecast_data, fetched_at, expires_at 
     FROM weather_cache 
     WHERE ABS(latitude - ?) < 0.01 AND ABS(longitude - ?) < 0.01
     ORDER BY fetched_at DESC
     LIMIT 1`,
    [latitude, longitude]
  );

  return cached || null;
}

/**
 * Cache weather data
 */
async function cacheWeather(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
  current: CurrentWeather,
  forecast: ForecastDay[]
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();

  await db.runAsync(
    `INSERT INTO weather_cache (latitude, longitude, weather_data, forecast_data, fetched_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      latitude,
      longitude,
      JSON.stringify({ ...current, location: { lat: latitude, lon: longitude } }),
      JSON.stringify(forecast),
      now,
      expiresAt,
    ]
  );
}

/**
 * Check if cache is expired
 */
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Clear old cache entries (older than 24 hours)
 */
export async function clearOldWeatherCache(db: SQLiteDatabase): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync('DELETE FROM weather_cache WHERE fetched_at < ?', [cutoff]);
}

/**
 * Weather condition helpers for smart alerts
 */
export function isRainyCondition(weather: CurrentWeather | ForecastDay): boolean {
  return (
    weather.description.includes('hujan') ||
    weather.description.includes('rain') ||
    ('rain_probability' in weather && weather.rain_probability !== undefined && weather.rain_probability > 70)
  );
}

export function isWindyCondition(weather: CurrentWeather | ForecastDay): boolean {
  return weather.wind_speed > 20; // km/h (adjust threshold as needed)
}

export function isClearWeather(forecast: ForecastDay[]): boolean {
  // Check if next 3 days are clear (no rain, low clouds)
  return forecast.slice(0, 3).every(day => day.rain_probability < 30 && day.clouds < 50);
}

export function getWeatherEmoji(icon: string): string {
  const emojiMap: Record<string, string> = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain
    '10n': '🌧️',
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  };
  
  return emojiMap[icon] || '🌤️';
}
