import { useState, useEffect } from 'react';
import { getTimeOfDay, shouldAutoSleep } from '../services/timeService';
import { getWeather } from '../services/weatherService';
import { checkForEvent, getActiveEvent, endEvent } from '../services/weatherEventService';

export function useWeather(petState, setPetState) {
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  const [weather, setWeather] = useState(() => getWeather());
  const [activeWeatherEvent, setActiveWeatherEvent] = useState(() => getActiveEvent());

  // Update time of day every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update weather every 60s (checks if 2h passed internally)
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(getWeather());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for weather events every 30 minutes
  useEffect(() => {
    const event = checkForEvent(timeOfDay, weather);
    if (event) setActiveWeatherEvent(event);

    const interval = setInterval(() => {
      const evt = checkForEvent(timeOfDay, weather);
      if (evt) setActiveWeatherEvent(evt);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeOfDay, weather]);

  // Auto-sleep at night
  useEffect(() => {
    if (shouldAutoSleep() && petState.state !== 'sleeping') {
      setPetState((prev) => {
        if (prev.state !== 'sleeping') {
          return { ...prev, state: 'sleeping' };
        }
        return prev;
      });
    }
  }, [timeOfDay]);

  return {
    timeOfDay,
    weather,
    activeWeatherEvent,
    setActiveWeatherEvent,
  };
}
