import { useState, useEffect, useCallback } from 'react';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

const STORAGE_KEY = 'chabadsync_location';

export function useLocation() {
  const [state, setState] = useState<LocationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { latitude, longitude } = JSON.parse(saved);
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          return { latitude, longitude, error: null, loading: false };
        }
      } catch (e) {
        console.error("Failed to parse saved location", e);
      }
    }
    return {
      latitude: null,
      longitude: null,
      error: null,
      loading: true,
    };
  });

  const updateLocation = useCallback(() => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation is not supported", loading: false }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ latitude, longitude }));
      setState({
        latitude,
        longitude,
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState(s => ({ ...s, error: error.message, loading: false }));
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }, []);

  useEffect(() => {
    // Only auto-request if we don't have a saved location
    if (state.latitude === null && state.loading) {
      updateLocation();
    }
  }, [state.latitude, state.loading, updateLocation]);

  return { ...state, updateLocation };
}
