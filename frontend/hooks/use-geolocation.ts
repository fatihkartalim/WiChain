"use client";

import { useCallback, useState } from "react";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

type GeolocationState = {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    isLoading: false,
    error: null
  });

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ coordinates: null, isLoading: false, error: "Browser location is not available." });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          isLoading: false,
          error: null
        });
      },
      (error) => {
        setState({
          coordinates: null,
          isLoading: false,
          error: error.message || "Location permission was not granted."
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({ coordinates: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation
  };
}
