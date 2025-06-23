// src/services/apiService.ts
import { Platform } from 'react-native';

export interface LoginRequest {
  userName: string;
  password: string;
  latitude?: string;
  longitude?: string;
  location?: string;
  deviceId?: string;
}

export interface ApiResponse {
  messageCode: string;
  messageText?: string;
  companyID?: string;
  companyName?: string;
  sessionID?: string;
  userID?: string;
  userName?: string;
  department?: string;
  designation?: string;
  emailAddress?: string;
  employeeCode?: string;
  mobileNo?: string;
  staffID?: string;
  timeDuration?: string;
  records?: any[];
}

export interface LoginData {
  userInfo: ApiResponse;
  locationData: {
    latitude: string;
    longitude: string;
    location: string;
    deviceID: string;
    timestamp: string;
  };
}

const BASE_URL = 'http://86.96.193.135/srvsat/webapi/SignInService';

class ApiService {
  private sessionID?: string;
  private companyID?: string;
  private userID?: string;
  private loginData?: LoginData;

  async login(credentials: LoginRequest): Promise<ApiResponse> {
    console.log('=== REAL API LOGIN REQUEST ===');
    
    // Use default Dubai location for now (we'll add real GPS later)
    const locationData = {
      latitude: '25.2048',
      longitude: '55.2708',
      location: 'Dubai, UAE'
    };
    const deviceID = this.generateDeviceId();
    
    console.log('Location data for API:', locationData);
    
    try {
      // Create FormData for multipart request
      const formData = new FormData();
      formData.append('sUserID', credentials.userName);
      formData.append('sPassword', credentials.password);
      formData.append('sLatitude', locationData.latitude);
      formData.append('sLongitude', locationData.longitude);
      formData.append('sLocation', locationData.location);
      formData.append('sDeviceID', deviceID);

      console.log('FormData being sent to API:');
      console.log('- sUserID:', credentials.userName);
      console.log('- sPassword:', '[HIDDEN]');
      console.log('- sLatitude:', locationData.latitude);
      console.log('- sLongitude:', locationData.longitude);
      console.log('- sLocation:', locationData.location);
      console.log('- sDeviceID:', deviceID);

      const response = await fetch(`${BASE_URL}/signInProcess`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      const responseText = await response.text();
      console.log('Raw Response:', responseText);

      if (!response.ok) {
        return {
          messageCode: 'ERROR',
          messageText: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Parse JSON response
      let result: ApiResponse;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed Response:', result);

        // Store session info and login data for future use
        if (result.sessionID) {
          this.sessionID = result.sessionID;
          this.companyID = result.companyID;
          this.userID = result.userID;
          
          // Store complete login data including location
          this.loginData = {
            userInfo: result,
            locationData: {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              location: locationData.location,
              deviceID: deviceID,
              timestamp: new Date().toISOString(),
            }
          };
          
          console.log('Complete login data stored:', this.loginData);
        }

        return result;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        return {
          messageCode: 'PARSE_ERROR',
          messageText: 'Invalid JSON response from server',
        };
      }

    } catch (error) {
      console.error('Network Error:', error);
      return {
        messageCode: 'NETWORK_ERROR',
        messageText: `Network error: ${error.message}`,
      };
    }
  }

  async signOut(): Promise<ApiResponse> {
    if (!this.sessionID || !this.companyID || !this.userID) {
      return {
        messageCode: 'ERROR',
        messageText: 'No active session to sign out from',
      };
    }

    try {
      console.log('=== SIGNING OUT ===');
      console.log('Session data:', {
        userID: this.userID,
        sessionID: this.sessionID,
        companyID: this.companyID
      });

      const formData = new FormData();
      formData.append('sUserID', this.userID);
      formData.append('sSessionID', this.sessionID);
      formData.append('sCompanyID', this.companyID);

      const response = await fetch(`${BASE_URL}/signOutProcess`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('Sign out response:', responseText);
      
      const result = JSON.parse(responseText);

      // Clear all stored data
      this.sessionID = undefined;
      this.companyID = undefined;
      this.userID = undefined;
      this.loginData = undefined;

      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        messageCode: 'ERROR',
        messageText: `Sign out failed: ${error.message}`,
      };
    }
  }

  private generateDeviceId(): string {
    const platform = Platform.OS;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${platform}_${timestamp}_${random}`;
  }

  // Getter methods for session info
  getSessionInfo() {
    return {
      sessionID: this.sessionID,
      companyID: this.companyID,
      userID: this.userID,
    };
  }

  // Get complete login data including location
  getLoginData(): LoginData | undefined {
    return this.loginData;
  }

  // Get location data that was sent during login
  getLoginLocationData() {
    return this.loginData?.locationData;
  }

  isLoggedIn(): boolean {
    return !!(this.sessionID && this.companyID && this.userID);
  }

  // Mock method for vehicles (to be replaced with real endpoint later)
  async getVehicles(): Promise<ApiResponse> {
    if (!this.isLoggedIn()) {
      return {
        messageCode: 'ERROR',
        messageText: 'Please login first',
      };
    }

    // TODO: Replace with real vehicles API endpoint when available
    console.log('=== MOCK VEHICLES DATA (Replace with real API) ===');
    return {
      messageCode: '0',
      messageText: 'Success',
      records: []
    };
  }
}

export const apiService = new ApiService();
export default apiService;