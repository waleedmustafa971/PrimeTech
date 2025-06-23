// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ServiceReportScreen from '../screens/ServiceReportScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import SetCredentialsScreen from '../screens/SetCredentialsScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ServiceReport: undefined;
  Registration: undefined;
  OTPVerification: {
    registrationData: {
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
    };
    requestNo: string;
  };
  SetCredentials: {
    registrationData: {
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
    };
    registrationNo: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Registration" 
          component={RegistrationScreen}
        />
        <Stack.Screen 
          name="OTPVerification" 
          component={OTPVerificationScreen}
        />
        <Stack.Screen 
          name="SetCredentials" 
          component={SetCredentialsScreen}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="ServiceReport" 
          component={ServiceReportScreen}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}