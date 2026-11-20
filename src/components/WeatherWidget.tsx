import { useState } from 'react';
import { Cloud, CloudSun, Droplet, Loader2, MapPin, Sun, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy';
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    weather_code?: number;
  };
}

function mapWeatherCondition(code: number, precipitation: number): WeatherData['condition'] {
  if (precipitation > 0.1 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
  if (code === 0) return 'sunny';
  if ([1, 2].includes(code)) return 'partly-cloudy';
  return 'cloudy';
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location access is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 });
  });
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = async () => {
    setError('');
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const params = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
        wind_speed_unit: 'kmh',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!response.ok) throw new Error('The weather service could not return a forecast. Try again later.');
      const result = await response.json() as OpenMeteoResponse;
      const current = result.current;
      if (!current || current.temperature_2m === undefined || current.weather_code === undefined) {
        throw new Error('The weather service returned incomplete data. Try again later.');
      }
      setWeather({
        temperature: Math.round(current.temperature_2m),
        condition: mapWeatherCondition(current.weather_code, current.precipitation ?? 0),
        humidity: Math.round(current.relative_humidity_2m ?? 0),
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        precipitation: Math.max(0, current.precipitation ?? 0),
      });
    } catch (caught) {
      const isGeolocationError = typeof caught === 'object' && caught !== null && 'code' in caught;
      const message = isGeolocationError
        ? Number((caught as GeolocationPositionError).code) === 1 ? 'Location permission was denied. Allow it in your browser to load a forecast.' : 'Your location could not be determined. Try again outdoors or check browser settings.'
        : caught instanceof Error ? caught.message : 'Weather data could not be loaded.';
      setWeather(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const conditionLabel = weather?.condition === 'partly-cloudy' ? 'Partly cloudy' : weather?.condition ? weather.condition[0].toUpperCase() + weather.condition.slice(1) : '';
  const WeatherIcon = weather?.condition === 'sunny' ? Sun : weather?.condition === 'cloudy' ? Cloud : weather?.condition === 'rainy' ? Droplet : weather ? CloudSun : Thermometer;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><CloudSun className="h-5 w-5 text-sky-600" />Local weather</CardTitle>
        <CardDescription>Uses your location only after you choose to share it. Forecast provided by Open-Meteo.</CardDescription>
      </CardHeader>
      <CardContent>
        {!weather ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            {error && <p className="max-w-md text-sm text-muted-foreground" role="alert">{error}</p>}
            <Button variant="outline" onClick={loadWeather} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              {loading ? 'Loading forecast…' : error ? 'Try again' : 'Use my location'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><WeatherIcon className="h-10 w-10 text-sky-600" /><div><p className="text-3xl font-semibold">{weather.temperature}°C</p><p className="text-sm text-muted-foreground">{conditionLabel} near your location</p></div></div>
              <Button variant="ghost" size="sm" onClick={loadWeather} disabled={loading} aria-label="Refresh weather forecast">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}</Button>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
              <div><Droplet className="mx-auto mb-1 h-4 w-4 text-sky-500" /><span className="block text-xs text-muted-foreground">Humidity</span><span className="text-sm font-medium">{weather.humidity}%</span></div>
              <div><Wind className="mx-auto mb-1 h-4 w-4 text-blue-500" /><span className="block text-xs text-muted-foreground">Wind</span><span className="text-sm font-medium">{weather.windSpeed} km/h</span></div>
              <div><Cloud className="mx-auto mb-1 h-4 w-4 text-indigo-500" /><span className="block text-xs text-muted-foreground">Precipitation</span><span className="text-sm font-medium">{weather.precipitation.toFixed(1)} mm</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
