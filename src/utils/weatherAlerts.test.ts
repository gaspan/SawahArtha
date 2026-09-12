/**
 * Unit tests untuk smart weather alert rules + diary stage detection.
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWeatherAlerts } from './weatherAlerts';
import type { CurrentWeather, ForecastDay } from '../services/weatherService';
import { detectFarmingStage, computeDaysSincePlanting } from '../database/diaryService';

const baseCurrent: CurrentWeather = {
  temp: 30,
  feels_like: 32,
  temp_min: 26,
  temp_max: 32,
  humidity: 70,
  pressure: 1010,
  wind_speed: 3,
  clouds: 20,
  description: 'cerah',
  icon: '01d',
  sunrise: 0,
  sunset: 0,
};

const sunnyDay = (date: string): ForecastDay => ({
  date,
  temp_day: 30,
  temp_min: 25,
  temp_max: 32,
  humidity: 60,
  wind_speed: 3,
  clouds: 10,
  rain_probability: 5,
  rain_mm: 0,
  description: 'cerah',
  icon: '01d',
});

describe('evaluateWeatherAlerts', () => {
  it('memberi alert hujan saat ini ketika sedang hujan', () => {
    const res = evaluateWeatherAlerts(
      { ...baseCurrent, description: 'hujan ringan', rain_1h: 2 },
      [sunnyDay('2026-09-13'), sunnyDay('2026-09-14'), sunnyDay('2026-09-15')]
    );
    assert.ok(res.some((a) => a.type === 'rain_now'));
  });

  it('memberi alert rain_soon saat forecast besok hujan lebat', () => {
    const rainy: ForecastDay = {
      ...sunnyDay('2026-09-13'),
      rain_probability: 90,
      rain_mm: 12,
      description: 'hujan lebat',
    };
    const res = evaluateWeatherAlerts(baseCurrent, [rainy, sunnyDay('2026-09-14')]);
    const rain = res.find((a) => a.type === 'rain_soon');
    assert.ok(rain);
    assert.equal(rain?.priority, 'high');
  });

  it('memberi alert angin kencang di atas ambang', () => {
    const res = evaluateWeatherAlerts({ ...baseCurrent, wind_speed: 10 }, []);
    assert.ok(res.some((a) => a.type === 'wind' && a.priority === 'high'));
  });

  it('memberi alert jendela cerah saat 3 hari ke depan cerah', () => {
    const res = evaluateWeatherAlerts(baseCurrent, [
      sunnyDay('2026-09-13'),
      sunnyDay('2026-09-14'),
      sunnyDay('2026-09-15'),
    ]);
    assert.ok(res.some((a) => a.type === 'clear_window'));
  });

  it('tidak memberi clear_window saat ada hujan dalam 3 hari', () => {
    const res = evaluateWeatherAlerts(baseCurrent, [
      sunnyDay('2026-09-13'),
      { ...sunnyDay('2026-09-14'), rain_probability: 80, rain_mm: 8 },
      sunnyDay('2026-09-15'),
    ]);
    assert.ok(!res.some((a) => a.type === 'clear_window'));
  });

  it('memberi alert panas ekstrem saat suhu >= 35', () => {
    const res = evaluateWeatherAlerts({ ...baseCurrent, temp: 36, temp_max: 37 }, []);
    assert.ok(res.some((a) => a.type === 'heat'));
  });
});

describe('detectFarmingStage', () => {
  it('memetakan hari ke fase yang benar', () => {
    assert.equal(detectFarmingStage(3), 'planting');
    assert.equal(detectFarmingStage(15), 'vegetative');
    assert.equal(detectFarmingStage(45), 'generative');
    assert.equal(detectFarmingStage(75), 'ripening');
    assert.equal(detectFarmingStage(100), 'harvest');
  });

  it('null untuk input tidak valid', () => {
    assert.equal(detectFarmingStage(null), null);
    assert.equal(detectFarmingStage(undefined), null);
    assert.equal(detectFarmingStage(-1), null);
  });
});

describe('computeDaysSincePlanting', () => {
  it('menghitung selisih hari tanam-foto', () => {
    assert.equal(computeDaysSincePlanting('2026-09-12T10:00:00', '2026-09-01'), 11);
  });

  it('null untuk tanggal tidak valid', () => {
    assert.equal(computeDaysSincePlanting('invalid', '2026-09-01'), null);
  });
});
