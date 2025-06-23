// src/services/locationService.ts
import { Platform, PermissionsAndroid, Alert } from 'react-native';

interface LocationCoords {
  latitude: string;
  longitude: string;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

class LocationService {
  private currentLocation: LocationCoords | null = null;

  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'PrimeTech needs access to your location for tracking and attendance.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    const hasPermission = await this.requestLocationPermission();
    
    if (!hasPermission) {
      console.log('Location permission denied, using default Dubai location');
      this.currentLocation = {
        latitude: '25.2048',
        longitude: '55.2708',
        address: 'Dubai, UAE (Default)',
      };
      return this.currentLocation;
    }

    return new Promise((resolve) => {
      // Using React Native's built-in geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          
          console.log('Real GPS location obtained:', coords);
          this.currentLocation = coords;
          
          // Try to get address from coordinates
          this.getAddressFromCoords(coords.latitude, coords.longitude)
            .then(address => {
              if (this.currentLocation) {
                this.currentLocation.address = address;
              }
            });
          
          resolve(coords);
        },
        (error) => {
          console.warn('GPS location error:', error);
          console.log('Using default Dubai location due to GPS error');
          
          this.currentLocation = {
            latitude: '25.2048',
            longitude: '55.2708',
            address: 'Dubai, UAE (GPS Failed)',
          };
          
          resolve(this.currentLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  private async getAddressFromCoords(lat: string, lng: string): Promise<string> {
    try {
      // Using OpenStreetMap's Nominatim service for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      return `${lat}, ${lng}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${lat}, ${lng}`;
    }
  }

  getLastKnownLocation(): LocationCoords | null {
    return this.currentLocation;
  }

  // Format location for display
  formatLocationForDisplay(): string {
    if (!this.currentLocation) {
      return 'Location not available';
    }
    
    const { latitude, longitude, address } = this.currentLocation;
    return address || `${latitude}, ${longitude}`;
  }

  // Get location data formatted for API
  getLocationForAPI(): { latitude: string; longitude: string; location: string } {
    if (!this.currentLocation) {
      return {
        latitude: '25.2048',
        longitude: '55.2708',
        location: 'Dubai, UAE (Default)'
      };
    }

    return {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      location: this.currentLocation.address || `${this.currentLocation.latitude}, ${this.currentLocation.longitude}`
    };
  }
}

export const locationService = new LocationService();
export type { LocationCoords };