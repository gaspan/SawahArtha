/**
 * Smart weather alert rules — pure functions, no native deps.
 * Input: CurrentWeather + ForecastDay dari weatherService.
 * Output: daftar rekomendasi tani berbahasa Indonesia.
 */
import type { CurrentWeather, ForecastDay } from '../services/weatherService';

export type AlertPriority = 'low' | 'medium' | 'high';
export type WeatherAlertType =
  | 'rain_now'
  | 'rain_soon'
  | 'wind'
  | 'clear_window'
  | 'heat'
  | 'fungal_risk';

export interface SmartWeatherAlert {
  type: WeatherAlertType;
  title: string;
  message: string;
  priority: AlertPriority;
}

const WIND_THRESHOLD_MS = 8; // ~29 km/h, semprot tidak efektif di atas ini
const HEAT_THRESHOLD_C = 35;
const RAIN_SOON_PROB = 70;
const RAIN_SOON_MM = 5;

function isRainText(desc: string): boolean {
  const d = desc.toLowerCase();
  return d.includes('hujan') || d.includes('rain') || d.includes('thunderstorm') || d.includes('drizzle');
}

export function evaluateWeatherAlerts(
  current: CurrentWeather,
  forecast: ForecastDay[]
): SmartWeatherAlert[] {
  const alerts: SmartWeatherAlert[] = [];
  const upcoming = forecast.slice(0, 3);

  // 1. Hujan saat ini — tunda semprot, momen bagus untuk pupuk
  if ((current.rain_1h ?? 0) > 0 || isRainText(current.description)) {
    alerts.push({
      type: 'rain_now',
      title: '🌧️ Hujan saat ini',
      message:
        'Tunda penyemprotan pestisida (tercuci air hujan). Momen bagus untuk pemupukan — tanah lembap membantu penyerapan.',
      priority: 'medium',
    });
  }

  // 2. Hujan diprediksi besok / lusa — peringatan sebelum semprot
  const rainSoon = forecast
    .slice(0, 2)
    .find((d) => d.rain_probability >= RAIN_SOON_PROB || d.rain_mm >= RAIN_SOON_MM);
  if (rainSoon) {
    alerts.push({
      type: 'rain_soon',
      title: '⚠️ Hujan diprediksi',
      message: `Peluang hujan ${rainSoon.rain_probability}% (${rainSoon.rain_mm} mm) pada ${rainSoon.date}. Tunda penyemprotan dan amankan gabah yang dijemur.`,
      priority: rainSoon.rain_probability >= 85 ? 'high' : 'medium',
    });
  }

  // 3. Angin kencang — pestisida terbawa angin
  if (current.wind_speed >= WIND_THRESHOLD_MS) {
    alerts.push({
      type: 'wind',
      title: '💨 Angin kencang',
      message: `Kecepatan angin ${Math.round(current.wind_speed)} m/s. Hindari penyemprotan — pestisida terbawa ke petak lain.`,
      priority: 'high',
    });
  }

  // 4. Jendela cerah 3 hari — waktu optimal panen / semprot
  if (
    upcoming.length === 3 &&
    upcoming.every((d) => d.rain_probability < 30 && d.clouds < 50)
  ) {
    alerts.push({
      type: 'clear_window',
      title: '☀️ Cuaca cerah 3 hari',
      message:
        'Waktu optimal untuk panen, penjemuran gabah, atau penyemprotan terjadwal.',
      priority: 'low',
    });
  }

  // 5. Panas ekstrem — stres tanaman, jaga irigasi
  const maxTemp = Math.max(current.temp, ...upcoming.map((d) => d.temp_max));
  if (maxTemp >= HEAT_THRESHOLD_C) {
    alerts.push({
      type: 'heat',
      title: '🌡️ Panas ekstrem',
      message: `Suhu mencapai ${Math.round(maxTemp)}°C. Pastikan irigasi cukup dan pantau tanaman layu siang hari.`,
      priority: 'medium',
    });
  }

  // 6. Risiko jamur — lembap + hangat berkepanjangan
  if (
    current.humidity >= 85 &&
    current.temp >= 25 &&
    current.temp <= 30 &&
    upcoming.some((d) => d.humidity >= 85)
  ) {
    alerts.push({
      type: 'fungal_risk',
      title: '🍄 Waspada jamur',
      message:
        'Kelembapan tinggi berlanjut. Periksa gejala blast/hawar daun, terutama fase generatif.',
      priority: 'low',
    });
  }

  return alerts;
}
