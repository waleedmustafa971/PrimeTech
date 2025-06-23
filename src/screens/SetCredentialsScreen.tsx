// src/screens/SetCredentialsScreen.tsx
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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { registrationService } from '../services/registrationService';
import { RootStackParamList } from '../navigation/AppNavigator';

type SetCredentialsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SetCredentials'>;
type SetCredentialsScreenRouteProp = RouteProp<RootStackParamList, 'SetCredentials'>;

interface Props {
  navigation: SetCredentialsScreenNavigationProp;
  route: SetCredentialsScreenRouteProp;
}

const SetCredentialsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationData, registrationNo } = route.params;
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Please enter a username');
      return false;
    }

    if (formData.username.length < 4) {
      Alert.alert('Validation Error', 'Username must be at least 4 characters long');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Validation Error', 'Please enter a password');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSetCredentials = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('=== SETTING CREDENTIALS ===');
      console.log('Registration No:', registrationNo);
      console.log('Username:', formData.username);
      console.log('Password length:', formData.password.length);

      const response = await registrationService.registrationComplete({
        registrationNo: registrationNo,
        username: formData.username,
        password: formData.password,
        registrationData: registrationData,
      });

      console.log('Set credentials response:', response);

      if (response && response.messageCode === '0') {
        Alert.alert(
          'Registration Complete!',
          `Your account has been created successfully!\n\nYour login credentials:\nUsername: ${formData.username}\nStaff ID: ${registrationData.staffID}\n\nYou can now sign in with either your username or Staff ID.`,
          [
            {
              text: 'Go to Login',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else if (response && response.messageCode === 'ENDPOINT_NOT_FOUND') {
        Alert.alert(
          'Registration Process Complete',
          `Your registration has been verified successfully!\n\nHowever, the credential setting service is not available. Please try logging in with your Staff ID: ${registrationData.staffID}\n\nIf that doesn't work, contact your administrator to activate your account.`,
          [
            {
              text: 'Try Login with Staff ID',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else {
        const errorMessage = response.messageText || response.messageDesc || 'Failed to set credentials. Please try again.';
        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error) {
      console.error('Set credentials error:', error);
      Alert.alert('Error', 'Failed to set credentials. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Login Credentials</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Info */}
        <View style={styles.successSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Registration Verified!</Text>
          <Text style={styles.successSubtitle}>
            Now set your username and password to complete your account setup
          </Text>
          <Text style={styles.registrationInfo}>
            Registration No: {registrationNo}
          </Text>
        </View>

        {/* User Info Display */}
        <View style={styles.userInfoSection}>
          <Text style={styles.sectionTitle}>Your Registration Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{registrationData.userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Staff ID:</Text>
            <Text style={styles.infoValue}>{registrationData.staffID}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{registrationData.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{registrationData.mobileNo}</Text>
          </View>
        </View>

        {/* Credentials Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Set Login Credentials</Text>
          
          {/* Username Input */}
          <Text style={styles.inputLabel}>Username <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a username (min. 4 characters)"
              placeholderTextColor="#999"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min. 6 characters)"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.iconText}>{showPassword ? '🔓' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <Text style={styles.inputLabel}>Confirm Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.iconText}>{showConfirmPassword ? '🔓' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Complete Registration Button */}
          <TouchableOpacity 
            style={[styles.completeButton, loading && styles.completeButtonDisabled]}
            onPress={handleSetCredentials}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.completeButtonText}>Complete Registration</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              💡 You can login with either your username or Staff ID after completing registration.
            </Text>
          </View>
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
    alignItems: 'center',
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
  successSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    fontSize: 35,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  registrationInfo: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  userInfoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    width: 75,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 22,
    marginBottom: 18,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  iconText: {
    fontSize: 15,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
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
  infoSection: {
    marginTop: 18,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default SetCredentialsScreen;