/**
 * AgriSense Pro v17.1.0 Data Models
 * Defines the initial state structures for sensors, actuators, and weather.
 * Strictly hardware-synchronized (Zero Mock Data).
 */

export const INITIAL_SENSOR_DATA = {
  soil: { 
    moisture: null, 
    ph: null, 
    temp: null, 
    npk: { n: null, p: null, k: null }, 
    healthIndex: null,
    oledActive: null
  },
  weather: { 
    temp: null, 
    humidity: null, 
    isRaining: false, 
    lightIntensity: null, 
    rainLevel: null 
  },
  vision: {
    active: false, 
    type: '---', 
    level: 'Normal', 
    zone: '---', 
    ip: null,
    timestamp: null
  }
};

export const INITIAL_API_WEATHER = {
  temp: null, 
  feelsLike: null,
  humidity: null, 
  pressure: null, 
  windSpeed: null, 
  clouds: null,
  uv: null,
  aqi: '---',
  sunrise: null, 
  sunset: null, 
  condition: '---', 
  city: '---',
  lastUpdate: '---'
};

export const INITIAL_SYSTEM_HEALTH = { 
  soil: null, 
  weather: null, 
  vision: null
};
