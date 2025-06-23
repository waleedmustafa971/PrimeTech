// src/screens/OTPVerificationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { registrationService } from '../services/registrationService';
import { RootStackParamList } from '../navigation/AppNavigator';

type OTPVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationData, requestNo } = route.params;
  
  // State management
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  
  // Refs for input focus management
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('=== OTP VERIFICATION SCREEN ===');
    console.log('Registration Data:', registrationData);
    console.log('Request No:', requestNo);
  }, []);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Utility functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // API handlers
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    console.log('=== OTP VERIFICATION ATTEMPT ===');
    console.log('Entered OTP:', otpString);
    console.log('OTP Length:', otpString.length);
    console.log('Request No:', requestNo);
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    // Additional validation - check if OTP contains only numbers
    if (!/^\d{6}$/.test(otpString)) {
      Alert.alert('Invalid OTP', 'OTP should contain only numbers');
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...registrationData,
        otp: otpString,
        requestNo: requestNo,
      };

      console.log('Submitting OTP verification with data:', {
        ...submitData,
        photo: submitData.photo ? 'Photo included' : 'No photo'
      });

      const response = await registrationService.registrationSubmit(submitData);
      
      console.log('OTP verification response:', response);

      if (response && response.messageCode === '0') {
        // Extract registration number from response
        const registrationNo = response.messageDesc?.match(/REG\d+/)?.[0] || 'REG2025000000087';
        
        Alert.alert(
          'OTP Verified Successfully!',
          'Your email and mobile number have been verified. Now set your login credentials to complete registration.',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.navigate('SetCredentials', {
                  registrationData: registrationData,
                  registrationNo: registrationNo,
                });
              }
            }
          ]
        );
      } else {
        const errorMessage = response.messageText || 'Invalid OTP. Please try again.';
        console.log('OTP verification failed:', errorMessage);
        Alert.alert('Verification Failed', errorMessage);
        
        // Clear OTP on failure
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    console.log('=== RESENDING OTP ===');
    setLoading(true);
    
    try {
      const response = await registrationService.registrationRequest(registrationData);
      
      console.log('Resend OTP response:', response);
      
      if (response && response.messageCode === '0') {
        Alert.alert('OTP Resent', 'A new OTP has been sent to your mobile number and email.');
        setTimer(120);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear current OTP
        inputRefs.current[0]?.focus(); // Focus first input
      } else {
        Alert.alert('Resend Failed', response.messageText || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>
          
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to
          </Text>
          
          <View style={styles.contactSection}>
            <Text style={styles.contactInfo}>
              📱 {registrationData.mobileNo}
            </Text>
            <Text style={styles.contactInfo}>
              ✉️ {registrationData.email}
            </Text>
          </View>
          
          {/* Debug info - remove this in production */}
          <Text style={styles.debugText}>
            Request No: {requestNo}
          </Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>Enter 6-Digit Code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                editable={!loading}
              />
            ))}
          </View>
          
          {/* Debug current OTP - remove this in production */}
          <Text style={styles.debugText}>
            Current OTP: {otp.join('')}
          </Text>
        </View>

        {/* Timer and Resend Section */}
        <View style={styles.timerSection}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend code in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendText}>
                Didn't receive the code? Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Having trouble? Make sure you entered the correct mobile number and email address during registration.
          </Text>
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#1DA1C4',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  
  // Information Section
  infoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  contactSection: {
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  
  // Debug styles - remove in production
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // OTP Section
  otpSection: {
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 15,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  otpInputFilled: {
    borderColor: '#1DA1C4',
    backgroundColor: '#f0f8ff',
  },
  
  // Timer Section
  timerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  resendText: {
    fontSize: 14,
    color: '#1DA1C4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // Button Section
  buttonSection: {
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: '#1DA1C4',
    borderRadius: 25,
    paddingVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  arrowIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Help Section
  helpSection: {
    paddingHorizontal: 10,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default OTPVerificationScreen;