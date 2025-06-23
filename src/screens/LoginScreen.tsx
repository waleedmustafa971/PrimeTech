// src/screens/LoginScreen.tsx
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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../services/apiService';
import { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both Staff ID/Email and Password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.login({
        userName: username.trim(),
        password: password.trim(),
      });

      console.log('Login response received:', response);

      if (response && response.messageCode === "0") {
        const successMessage = `Welcome ${response.userName || 'User'}!\nCompany: ${response.companyName || 'N/A'}\nDepartment: ${response.department || 'N/A'}`;
        Alert.alert('Login Successful', successMessage);
        navigation.replace('Dashboard');
      } else {
        // Handle different error types with appropriate messages
        let errorTitle = 'Login Failed';
        let errorMessage = 'Please try again.';

        switch (response.messageCode) {
          case 'EMPTY_RESPONSE':
            errorTitle = 'Server Issue';
            errorMessage = 'The server returned an empty response. This usually means:\n• Invalid username/password\n• Server is under maintenance\n• Network connectivity issue\n\nPlease check your credentials and try again.';
            break;
          case 'PARSE_ERROR':
            errorTitle = 'Server Error';
            errorMessage = 'The server response could not be processed. Please try again or contact support if the issue persists.';
            break;
          case 'NETWORK_ERROR':
            errorTitle = 'Connection Error';
            errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
            break;
          case 'HTTP_ERROR':
            errorTitle = 'Server Error';
            errorMessage = response.messageText || 'The server encountered an error. Please try again later.';
            break;
          default:
            errorMessage = response.messageText || response.messageDesc || 'Invalid credentials or server error.';
        }

        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* PrimeTech X Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.xLogo}>
              <View style={styles.xPart1} />
              <View style={styles.xPart2} />
              <View style={styles.xPart3} />
              <View style={styles.xPart4} />
            </View>
          </View>
          
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>PRIMETECH</Text>
          </View>
        </View>
      </View>

      {/* Login Form Section */}
      <View style={styles.formSection}>
        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>

          {/* Staff ID/Email Input */}
          <Text style={styles.inputLabel}>Staff ID or Email</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Staff ID or Email"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
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

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Bottom Safe Area Spacer */}
        <View style={styles.bottomSpacer} />
      </View>
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
    paddingTop: 50,
    paddingBottom: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoWrapper: {
    marginBottom: 12,
    alignItems: 'center',
  },
  xLogo: {
    width: 70,
    height: 70,
    position: 'relative',
  },
  xPart1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 12,
    backgroundColor: '#E91E63',
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  xPart2: {
    position: 'absolute',
    top: 12,
    right: 0,
    width: 30,
    height: 12,
    backgroundColor: '#3F51B5',
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  xPart3: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    width: 30,
    height: 12,
    backgroundColor: '#3F51B5',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 3,
  },
  xPart4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 12,
    backgroundColor: '#E91E63',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 3,
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
    letterSpacing: 1,
  },
  companySubtitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'white',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 4,
    letterSpacing: 1,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingTop: 30,
    justifyContent: 'center',
  },
  formContainer: {
    // Centered form content
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 35,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
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
  },
  iconText: {
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
  signInButton: {
    backgroundColor: '#1DA1C4',
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#1DA1C4',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 50,
  },
});

export default LoginScreen;