// src/screens/RegistrationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { registrationService } from '../services/registrationService';
import { permissionService } from '../services/PermissionService';
import { RootStackParamList } from '../navigation/AppNavigator';

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;

interface Props {
  navigation: RegistrationScreenNavigationProp;
}

const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: 'Mr.',
    userName: '',
    staffID: '',
    mobileNo: '',
    email: '',
    isCompanyDevice: false,
  });
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoSelection = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your profile photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
      ]
    );
  };

  const openCamera = async () => {
    console.log('Opening camera...');
    
    // Check permissions first
    const hasPermissions = await permissionService.checkPermissions();
    
    if (!hasPermissions.granted) {
      console.log('Requesting permissions...');
      const permissionResult = await permissionService.requestPermissions();
      
      await permissionService.handlePermissionResult(permissionResult, () => {
        launchCameraWithPermission();
      });
    } else {
      launchCameraWithPermission();
    }
  };

  const launchCameraWithPermission = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      console.log('Camera response:', response);

      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (response.errorCode) {
        console.log('Camera error code:', response.errorCode);
        if (response.errorCode === 'camera_unavailable') {
          Alert.alert('Camera Error', 'Camera is not available on this device');
        } else if (response.errorCode === 'permission') {
          Alert.alert('Permission Denied', 'Camera permission is required. Please enable it in Settings.');
        } else {
          Alert.alert('Camera Error', response.errorMessage || 'An error occurred');
        }
        return;
      }

      if (response.errorMessage) {
        console.log('Camera error:', response.errorMessage);
        Alert.alert('Camera Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfilePhoto({
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
        });
        Alert.alert('Photo Captured', 'Profile photo captured successfully!');
      }
    });
  };

  const openGallery = async () => {
    console.log('Opening gallery...');
    
    // Check permissions first
    const hasPermissions = await permissionService.checkPermissions();
    
    if (!hasPermissions.granted) {
      console.log('Requesting permissions...');
      const permissionResult = await permissionService.requestPermissions();
      
      await permissionService.handlePermissionResult(permissionResult, () => {
        launchGalleryWithPermission();
      });
    } else {
      launchGalleryWithPermission();
    }
  };

  const launchGalleryWithPermission = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('Gallery response:', response);

      if (response.didCancel) {
        console.log('User cancelled gallery');
        return;
      }

      if (response.errorCode) {
        console.log('Gallery error code:', response.errorCode);
        if (response.errorCode === 'permission') {
          Alert.alert('Permission Denied', 'Storage permission is required. Please enable it in Settings.');
        } else {
          Alert.alert('Gallery Error', response.errorMessage || 'An error occurred');
        }
        return;
      }

      if (response.errorMessage) {
        console.log('Gallery error:', response.errorMessage);
        Alert.alert('Gallery Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfilePhoto({
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `gallery_${Date.now()}.jpg`,
        });
        Alert.alert('Photo Selected', 'Profile photo selected successfully!');
      }
    });
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove the selected photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => setProfilePhoto(null) },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.userName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    if (!formData.staffID.trim()) {
      Alert.alert('Validation Error', 'Please enter your Staff ID');
      return false;
    }
    if (!formData.mobileNo.trim()) {
      Alert.alert('Validation Error', 'Please enter your mobile number');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegistration = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting registration with photo:', profilePhoto ? 'Yes' : 'No');
      
      const response = await registrationService.registrationRequest({
        ...formData,
        photo: profilePhoto,
      });
      
      console.log('Registration response:', response);

      if (response && response.messageCode === '0') {
        Alert.alert(
          'Registration Request Sent',
          'Please check your mobile/email for OTP verification code.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('OTPVerification', {
                  registrationData: { ...formData, photo: profilePhoto },
                  requestNo: response.requestNo || '',
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', response.messageText || 'Registration request failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Account</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoSelection}>
            {profilePhoto ? (
              <View style={styles.selectedPhotoContainer}>
                <Image source={{ uri: profilePhoto.uri }} style={styles.profileImage} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>Photo</Text>
                <Text style={styles.photoSubtext}>Tap to select</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {profilePhoto && (
            <Text style={styles.photoInfo}>
              Real photo selected: {profilePhoto.name}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Title</Text>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.titleOption}
              onPress={() => handleInputChange('title', 'Mr.')}
            >
              <View style={[
                styles.radioButton,
                formData.title === 'Mr.' && styles.radioButtonSelected
              ]} />
              <Text style={styles.titleText}>Mr.</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.titleOption}
              onPress={() => handleInputChange('title', 'Mrs.')}
            >
              <View style={[
                styles.radioButton,
                formData.title === 'Mrs.' && styles.radioButtonSelected
              ]} />
              <Text style={styles.titleText}>Mrs.</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Name <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={formData.userName}
              onChangeText={(value) => handleInputChange('userName', value)}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Staff ID <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🆔</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your staff ID"
              placeholderTextColor="#999"
              value={formData.staffID}
              onChangeText={(value) => handleInputChange('staffID', value)}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Mobile Number <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              placeholderTextColor="#999"
              value={formData.mobileNo}
              onChangeText={(value) => handleInputChange('mobileNo', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Email Address <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Is Company Device</Text>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                formData.isCompanyDevice && styles.toggleSwitchActive
              ]}
              onPress={() => handleInputChange('isCompanyDevice', !formData.isCompanyDevice)}
            >
              <View style={[
                styles.toggleThumb,
                formData.isCompanyDevice && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegistration}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.registerButtonText}>Register</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Safe Area Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1DA1C4',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  photoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 15,
    color: '#1DA1C4',
    fontWeight: '500',
  },
  photoSubtext: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  selectedPhotoContainer: {
    position: 'relative',
    width: 106,
    height: 106,
    borderRadius: 53,
  },
  profileImage: {
    width: 106,
    height: 106,
    borderRadius: 53,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  removePhotoText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  photoInfo: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: '#F44336',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 18,
  },
  titleOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1DA1C4',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#1DA1C4',
  },
  titleText: {
    fontSize: 15,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 22,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchActive: {
    backgroundColor: '#1DA1C4',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  registerButton: {
    backgroundColor: '#1DA1C4',
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowIcon: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: '#1DA1C4',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 50,
  },
});

export default RegistrationScreen;