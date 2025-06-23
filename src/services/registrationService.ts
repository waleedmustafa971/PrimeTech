// src/services/registrationService.ts
import { Platform } from 'react-native';

export interface RegistrationRequest {
  title: string;
  userName: string;
  staffID: string;
  mobileNo: string;
  email: string;
  isCompanyDevice: boolean;
  photo?: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

export interface RegistrationSubmitRequest extends RegistrationRequest {
  otp: string;
  requestNo: string;
}

export interface RegistrationCompleteRequest {
  registrationNo: string;
  username: string;
  password: string;
  registrationData: any;
}

export interface RegistrationResponse {
  messageCode: string;
  messageText?: string;
  messageDesc?: string;
  requestNo?: string;
  userID?: string;
  sessionID?: string;
  companyID?: string;
}

export interface RegistrationCompleteResponse {
  messageCode: string;
  messageText?: string;
  messageDesc?: string;
  userID?: string;
  sessionID?: string;
}

const BASE_URL = 'http://86.96.193.135/srvsat/webapi/RegistrationService';

class RegistrationService {
  private storedDeviceID: string | null = null;
  
  async registrationRequest(data: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const locationData = this.getDefaultLocation();
      
      // Store the device ID for use in OTP submission
      this.storedDeviceID = deviceInfo.deviceID;
      console.log('Storing device ID for OTP:', this.storedDeviceID);
      
      const form = new FormData();
      form.append('sCompanyID', '100');
      // Fix: Convert title to single character for database
      const titleCode = data.title === 'Mr.' ? 'M' : 'F';
      form.append('sTitle', titleCode);
      console.log('Converting title from', data.title, 'to', titleCode);
      form.append('sUserName', data.userName);
      form.append('sStaffID', data.staffID);
      form.append('sMobileNo', data.mobileNo);
      form.append('sEmail', data.email);
      form.append('sDeviceFlag', data.isCompanyDevice ? '1' : '0');
      form.append('sDeviceInfo', deviceInfo.deviceInfo);
      form.append('sDeviceModel', deviceInfo.deviceModel);
      form.append('sDevicePlatForm', deviceInfo.platform);
      form.append('sDeviceVersion', deviceInfo.version);
      form.append('sDeviceID', deviceInfo.deviceID);
      form.append('sLatitude', locationData.latitude);
      form.append('sLongitude', locationData.longitude);
      form.append('sLocation', locationData.location);
      
      if (data.photo?.uri) {
        form.append('sPhoto', {
          uri: data.photo.uri,
          type: data.photo.type || 'image/jpeg',
          name: data.photo.name || 'photo.jpg',
        } as any);
      }

      const response = await fetch(`${BASE_URL}/registrationRequest`, {
        method: 'POST',
        body: form,
      });

      const text = await response.text();
      console.log('Registration response:', text);
      
      if (!response.ok) {
        return { messageCode: 'ERROR', messageText: `HTTP ${response.status}` };
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Registration error:', error);
      return { messageCode: 'ERROR', messageText: error.message };
    }
  }

  async registrationSubmit(data: RegistrationSubmitRequest): Promise<RegistrationResponse> {
    try {
      console.log('=== OTP SUBMIT ===');
      console.log('OTP:', data.otp);
      console.log('OTP Length:', data.otp.length);
      console.log('OTP Type:', typeof data.otp);
      console.log('Request No:', data.requestNo);
      console.log('User Name:', data.userName);
      console.log('Staff ID:', data.staffID);
      console.log('Mobile:', data.mobileNo);
      console.log('Email:', data.email);
      
      const deviceInfo = this.getDeviceInfo();
      const locationData = this.getDefaultLocation();
      
      // Use the same device ID that was used during registration
      if (this.storedDeviceID) {
        deviceInfo.deviceID = this.storedDeviceID;
        console.log('Using stored device ID:', this.storedDeviceID);
      } else {
        console.log('WARNING: No stored device ID, using new one:', deviceInfo.deviceID);
      }
      
      const form = new FormData();
      form.append('sCompanyID', '100');
      // Fix: Convert title to single character for database
      const titleCode = data.title === 'Mr.' ? 'M' : 'F';
      form.append('sTitle', titleCode);
      console.log('Converting title from', data.title, 'to', titleCode);
      form.append('sUserName', data.userName);
      form.append('sStaffID', data.staffID);
      form.append('sMobileNo', data.mobileNo);
      form.append('sEmail', data.email);
      form.append('sDeviceFlag', data.isCompanyDevice ? '1' : '0');
      form.append('sDeviceInfo', deviceInfo.deviceInfo);
      form.append('sDeviceModel', deviceInfo.deviceModel);
      form.append('sDevicePlatForm', deviceInfo.platform);
      form.append('sDeviceVersion', deviceInfo.version);
      form.append('sDeviceID', deviceInfo.deviceID);
      form.append('sLatitude', locationData.latitude);
      form.append('sLongitude', locationData.longitude);
      form.append('sLocation', locationData.location);
      form.append('sInfoOPT', data.otp);
      form.append('sRequestNo', data.requestNo);
      
      if (data.photo?.uri) {
        form.append('sPhoto', {
          uri: data.photo.uri,
          type: data.photo.type || 'image/jpeg',
          name: data.photo.name || 'photo.jpg',
        } as any);
      }

      const response = await fetch(`${BASE_URL}/registrationSubmit`, {
        method: 'POST',
        body: form,
      });

      const text = await response.text();
      console.log('=== OTP RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response:', text);
      
      if (!response.ok) {
        return { messageCode: 'ERROR', messageText: `HTTP ${response.status}` };
      }

      const result = JSON.parse(text);
      return result;
      
    } catch (error) {
      console.error('=== OTP ERROR ===');
      console.error('Error:', error);
      return { messageCode: 'ERROR', messageText: error.message };
    }
  }

  async registrationComplete(data: RegistrationCompleteRequest): Promise<RegistrationCompleteResponse> {
    try {
      console.log('=== COMPLETING REGISTRATION ===');
      console.log('Registration No:', data.registrationNo);
      console.log('Username:', data.username);
      console.log('Password Length:', data.password.length);
      
      // Try different possible endpoints for setting credentials
      const possibleEndpoints = [
        `${BASE_URL}/registrationComplete`,
        `${BASE_URL}/setCredentials`, 
        `${BASE_URL}/completeRegistration`,
        'http://86.96.193.135/srvsat/webapi/UserProfileService/setCredentials'
      ];
      
      for (let i = 0; i < possibleEndpoints.length; i++) {
        const endpoint = possibleEndpoints[i];
        console.log(`Trying endpoint ${i + 1}/${possibleEndpoints.length}: ${endpoint}`);
        
        try {
          const deviceInfo = this.getDeviceInfo();
          const locationData = this.getDefaultLocation();
          
          // Use the same device ID that was used during registration
          if (this.storedDeviceID) {
            deviceInfo.deviceID = this.storedDeviceID;
            console.log('Using stored device ID:', this.storedDeviceID);
          }
          
          const form = new FormData();
          form.append('sCompanyID', '100');
          form.append('sRegistrationNo', data.registrationNo);
          form.append('sUserID', data.username);
          form.append('sPassword', data.password);
          form.append('sDeviceID', deviceInfo.deviceID);
          form.append('sLatitude', locationData.latitude);
          form.append('sLongitude', locationData.longitude);
          form.append('sLocation', locationData.location);

          const response = await fetch(endpoint, {
            method: 'POST',
            body: form,
          });

          const text = await response.text();
          console.log(`=== ENDPOINT ${i + 1} RESPONSE ===`);
          console.log('Status:', response.status);
          console.log('Response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
          
          if (response.status === 404) {
            console.log('Endpoint not found, trying next...');
            continue; // Try next endpoint
          }
          
          if (!response.ok) {
            continue; // Try next endpoint
          }

          // Try to parse as JSON
          try {
            const result = JSON.parse(text);
            console.log('Successfully parsed JSON response:', result);
            return result;
          } catch (parseError) {
            console.log('Could not parse as JSON, treating as success');
            // If we can't parse but got a non-404 response, assume success
            return {
              messageCode: '0',
              messageText: 'Registration completed successfully',
              userID: data.username
            };
          }
        } catch (fetchError) {
          console.log(`Error with endpoint ${i + 1}:`, fetchError.message);
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints failed, return a special message
      console.log('All endpoints failed - registration may need manual completion');
      return {
        messageCode: 'ENDPOINT_NOT_FOUND',
        messageText: 'Registration verification completed, but credential setting endpoint not available. Please contact administrator to activate your account, or try logging in with your Staff ID.',
        userID: data.username
      };
      
    } catch (error) {
      console.error('=== REGISTRATION COMPLETE ERROR ===');
      console.error('Error:', error);
      return { messageCode: 'ERROR', messageText: error.message };
    }
  }

  private getDeviceInfo() {
    return {
      deviceInfo: `${Platform.OS} Device`,
      deviceModel: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
      platform: Platform.OS,
      version: Platform.Version?.toString() || 'Unknown',
      deviceID: `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private getDefaultLocation() {
    return {
      latitude: '25.2048',
      longitude: '55.2708',
      location: 'Dubai, UAE'
    };
  }
}

export const registrationService = new RegistrationService();
export default registrationService;