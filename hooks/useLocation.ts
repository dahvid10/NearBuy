
import { useState, useCallback, useEffect } from 'react';
import type { Coordinates } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | 'loading'>('loading');

  useEffect(() => {
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionState(status.state);
        status.onchange = () => {
          setPermissionState(status.state);
        };
      }).catch(() => {
        // This can happen in some environments or if the permission is not supported.
        setPermissionState('unsupported');
      });
    } else {
        setPermissionState('unsupported');
    }
  }, []);

  const getLocation = useCallback((): Promise<Coordinates | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser.';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setError(null);
          resolve(coords);
        },
        (err) => {
          let errorMsg = '';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Location access was denied. Please enable it in your browser settings to find local stores.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location information is unavailable.';
              break;
            case err.TIMEOUT:
              errorMsg = 'The request to get user location timed out.';
              break;
            default:
              errorMsg = 'An unknown error occurred while getting location.';
              break;
          }
          setError(errorMsg);
          reject(new Error(errorMsg));
        }
      );
    });
  }, []);

  return { location, error, getLocation, permissionState };
};