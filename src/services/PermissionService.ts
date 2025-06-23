// src/services/PermissionService.ts
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export interface PermissionResult {
  granted: boolean;
  shouldShowRationale?: boolean;
  canRequestAgain?: boolean;
}

class PermissionService {
  
  // Get Android API level
  private getAndroidVersion(): number {
    return Platform.Version as number;
  }

  // Check if we can request permissions (not permanently denied)
  private async canRequestPermission(permission: string): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    
    try {
      const result = await PermissionsAndroid.check(permission);
      if (result) return true;
      
      // Check if we should show rationale (permission was denied but not permanently)
      const shouldShow = await PermissionsAndroid.shouldShowRequestPermissionRationale(permission);
      return shouldShow;
    } catch (error) {
      console.log('Error checking permission:', error);
      return false;
    }
  }

  // Get required permissions based on Android version
  private getRequiredPermissions(): string[] {
    if (Platform.OS !== 'android') return [];
    
    const androidVersion = this.getAndroidVersion();
    console.log('Android API Level:', androidVersion);

    let permissions: string[] = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ];

    // Add storage permissions based on Android version
    if (androidVersion >= 33) {
      // Android 13+ (API 33+) - Use new media permissions
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else if (androidVersion >= 29) {
      // Android 10-12 (API 29-32) - Use READ_EXTERNAL_STORAGE only
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    } else {
      // Android 9 and below (API 28-) - Use both read and write
      permissions.push(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
    }

    console.log('Required permissions for API', androidVersion, ':', permissions);
    return permissions;
  }

  // Check if all required permissions are granted
  async checkPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const requiredPermissions = this.getRequiredPermissions();
      const results = await Promise.all(
        requiredPermissions.map(permission => PermissionsAndroid.check(permission))
      );

      const allGranted = results.every(result => result === true);
      
      console.log('Permission check results:', requiredPermissions.map((perm, index) => ({
        permission: perm,
        granted: results[index]
      })));

      return { granted: allGranted };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { granted: false };
    }
  }

  // Request all required permissions
  async requestPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const requiredPermissions = this.getRequiredPermissions();
      
      // Check if we can request permissions (not permanently denied)
      const canRequestResults = await Promise.all(
        requiredPermissions.map(async (permission) => {
          const isGranted = await PermissionsAndroid.check(permission);
          if (isGranted) return true;
          
          const canRequest = await this.canRequestPermission(permission);
          return canRequest;
        })
      );

      const canRequestAll = canRequestResults.every(result => result === true);
      
      if (!canRequestAll) {
        console.log('Some permissions are permanently denied');
        return { 
          granted: false, 
          canRequestAgain: false 
        };
      }

      console.log('Requesting permissions:', requiredPermissions);
      
      const grants = await PermissionsAndroid.requestMultiple(requiredPermissions);
      
      console.log('Permission request results:', grants);

      // Check results
      const grantedPermissions = requiredPermissions.filter(
        permission => grants[permission] === PermissionsAndroid.RESULTS.GRANTED
      );

      const deniedPermissions = requiredPermissions.filter(
        permission => grants[permission] === PermissionsAndroid.RESULTS.DENIED
      );

      const neverAskAgainPermissions = requiredPermissions.filter(
        permission => grants[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      );

      console.log('Granted:', grantedPermissions);
      console.log('Denied:', deniedPermissions);
      console.log('Never ask again:', neverAskAgainPermissions);

      const allGranted = grantedPermissions.length === requiredPermissions.length;
      const hasNeverAskAgain = neverAskAgainPermissions.length > 0;

      return {
        granted: allGranted,
        canRequestAgain: !hasNeverAskAgain,
        shouldShowRationale: deniedPermissions.length > 0 && !hasNeverAskAgain
      };

    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { granted: false };
    }
  }

  // Handle permission result and show appropriate alerts
  async handlePermissionResult(result: PermissionResult, onSuccess: () => void): Promise<void> {
    if (result.granted) {
      onSuccess();
      return;
    }

    if (result.canRequestAgain === false) {
      // Permissions are permanently denied, guide user to settings
      Alert.alert(
        'Permissions Required',
        'Camera and storage permissions are required for this feature. Please enable them in your device settings.\n\nGo to: Settings > Apps > Your App Name > Permissions',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => this.openAppSettings() 
          }
        ]
      );
    } else if (result.shouldShowRationale) {
      // Show rationale and try again
      Alert.alert(
        'Permissions Needed',
        'This app needs camera and storage permissions to take and select photos for your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permissions', 
            onPress: async () => {
              const newResult = await this.requestPermissions();
              this.handlePermissionResult(newResult, onSuccess);
            }
          }
        ]
      );
    } else {
      // Generic permission denied
      Alert.alert(
        'Permissions Denied',
        'Camera and storage permissions are required for this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Try Again', 
            onPress: async () => {
              const newResult = await this.requestPermissions();
              this.handlePermissionResult(newResult, onSuccess);
            }
          }
        ]
      );
    }
  }

  // Open app settings
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert('Error', 'Unable to open settings. Please go to Settings > Apps > Your App > Permissions manually.');
    }
  }

  // Request camera permission specifically
  async requestCameraPermission(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const isGranted = await PermissionsAndroid.check(permission);
      
      if (isGranted) {
        return { granted: true };
      }

      const result = await PermissionsAndroid.request(permission);
      
      return {
        granted: result === PermissionsAndroid.RESULTS.GRANTED,
        canRequestAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { granted: false };
    }
  }

  // Request storage permission specifically
  async requestStoragePermission(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const androidVersion = this.getAndroidVersion();
      let permission: string;

      if (androidVersion >= 33) {
        permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
      } else {
        permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      }

      const isGranted = await PermissionsAndroid.check(permission);
      
      if (isGranted) {
        return { granted: true };
      }

      const result = await PermissionsAndroid.request(permission);
      
      return {
        granted: result === PermissionsAndroid.RESULTS.GRANTED,
        canRequestAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      };
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return { granted: false };
    }
  }
}

export const permissionService = new PermissionService();
export default permissionService;