// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { apiService } from '../services/apiService';
import { PermissionsAndroid, Platform } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface NotificationData {
  messageTitle: string;
  messageDetails: string;
  messageDate: string;
  referenceNo: string;
  isRead: boolean;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [sessionInfo, setSessionInfo] = useState({
    userName: '',
    companyName: '',
    department: '',
    designation: '',
    employeeCode: '',
    emailAddress: '',
    mobileNo: '',
    staffID: '',
    userID: '',
    companyID: '',
    sessionID: '',
    todayCheckIn: '',
    timeDuration: '',
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    staffID: '',
    mobile: '',
    email: '',
    password: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState({
    todayCheckIn: '',
    workingHours: '',
    status: 'Not Checked In'
  });

  const [sessionDuration, setSessionDuration] = useState('00:00:00');

  useEffect(() => {
    loadSessionInfo();
    loadUserPhoto();
    loadNotifications();
    loadAttendanceData();
    
    // Update session duration every second
    const interval = setInterval(() => {
      const info = formatCheckInTime(attendanceData.todayCheckIn || sessionInfo.todayCheckIn);
      setSessionDuration(info.duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [attendanceData.todayCheckIn, sessionInfo.todayCheckIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadSessionInfo(),
      loadUserPhoto(),
      loadNotifications(),
      loadAttendanceData()
    ]);
    setRefreshing(false);
  };

  const loadSessionInfo = async () => {
    try {
      const loginData = apiService.getLoginData();
      
      if (loginData && loginData.userInfo) {
        const userInfo = loginData.userInfo;
        setSessionInfo({
          userName: userInfo.userName || 'Unknown',
          companyName: 'Prime Technologies', // Updated company name
          department: userInfo.department || 'Unknown',
          designation: userInfo.designation || 'Unknown',
          employeeCode: userInfo.employeeCode || 'Unknown',
          emailAddress: userInfo.emailAddress || 'Unknown',
          mobileNo: userInfo.mobileNo || 'Unknown',
          staffID: userInfo.staffID || 'Unknown',
          userID: userInfo.userID || 'Unknown',
          companyID: userInfo.companyID || '100',
          sessionID: userInfo.sessionID || '',
          todayCheckIn: userInfo.todayCheckIn || '',
          timeDuration: userInfo.timeDuration || '',
        });

        setProfileData({
          name: userInfo.userName || '',
          staffID: userInfo.userID || '',
          mobile: userInfo.mobileNo || '',
          email: userInfo.emailAddress || '',
          password: '',
        });
      }
    } catch (error) {
      console.error('Error loading session info:', error);
    }
  };

  const loadUserPhoto = async () => {
    try {
      const session = apiService.getSessionInfo();
      
      if (session.userID && session.sessionID && session.companyID) {
        const photoUrl = `http://86.96.193.135/srvsat/webapi/SignInService/userImage?sUserID=${session.userID}&sSessionID=${session.sessionID}&sCompanyID=${session.companyID}`;
        setProfilePhoto(photoUrl);
      }
    } catch (error) {
      console.log('Could not load user photo:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const session = apiService.getSessionInfo();
      
      if (!session.userID || !session.sessionID || !session.companyID) {
        return;
      }

      const formData = new FormData();
      formData.append('sUserID', session.userID);
      formData.append('sSessionID', session.sessionID);
      formData.append('sCompanyID', session.companyID);
      formData.append('sEmployeeCode', sessionInfo.employeeCode);

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/ViewNotificationService/pushNotificationData',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const notificationList = await response.json();
        if (Array.isArray(notificationList)) {
          setNotifications(notificationList);
          const unreadCount = notificationList.filter(n => !n.isRead).length;
          setUnreadNotificationCount(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const session = apiService.getSessionInfo();
      
      if (!session.userID || !session.sessionID || !session.companyID) {
        return;
      }

      const formData = new FormData();
      formData.append('sUserID', session.userID);
      formData.append('sSessionID', session.sessionID);
      formData.append('sCompanyID', session.companyID);
      formData.append('sEmployeeCode', sessionInfo.employeeCode);

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/SignInService/attendanceTime',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.messageCode === '0') {
          setAttendanceData({
            todayCheckIn: result.todayCheckIn || '',
            workingHours: result.workingHours || '',
            status: result.attendanceStatus || 'Not Checked In'
          });
        }
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const formatCheckInTime = (checkInString: string) => {
    if (!checkInString) {
      // If no check-in data, try to get login time from session
      const loginData = apiService.getLoginData();
      if (loginData && loginData.loginTime) {
        checkInString = loginData.loginTime;
      } else {
        return { time: '--:--', period: '', date: 'Not logged in', duration: '--' };
      }
    }
    
    try {
      let loginTime;
      
      // Handle different date formats
      if (checkInString.includes('/')) {
        // Format: "19/06/2025 4:57 AM"
        const [datePart, timePart, period] = checkInString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        
        loginTime = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          period === 'PM' && parseInt(hours) !== 12 ? parseInt(hours) + 12 : 
          period === 'AM' && parseInt(hours) === 12 ? 0 : parseInt(hours), 
          parseInt(minutes)
        );
      } else {
        // Try to parse as standard date
        loginTime = new Date(checkInString);
      }
      
      const now = new Date();
      const diffMs = now.getTime() - loginTime.getTime();
      
      // Calculate session duration
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      // Format login time for display
      const displayHours = loginTime.getHours();
      const displayMinutes = loginTime.getMinutes();
      const period = displayHours >= 12 ? 'PM' : 'AM';
      const formatHours = displayHours > 12 ? displayHours - 12 : displayHours === 0 ? 12 : displayHours;
      
      return {
        time: `${formatHours}:${displayMinutes.toString().padStart(2, '0')}`,
        period: period,
        date: loginTime.toLocaleDateString('en-GB'),
        duration: `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`
      };
    } catch (error) {
      console.error('Error parsing login time:', error);
      return { time: '--:--', period: '', date: 'Invalid date', duration: '--' };
    }
  };

  const checkInInfo = formatCheckInTime(attendanceData.todayCheckIn || sessionInfo.todayCheckIn);

  const handleProfilePhotoPress = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        let permission;
        
        if (androidVersion >= 33) {
          permission = 'android.permission.READ_MEDIA_IMAGES';
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }
        
        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: 'Gallery Permission',
            message: 'This app needs access to your photos to select images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const openCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      launchCamera(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
        },
        handleImageResponse
      );
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
        return;
      }

      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
        },
        handleImageResponse
      );
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      const imageUri = asset.uri;
      
      if (imageUri) {
        setProfilePhoto(imageUri);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.name.trim() || !profileData.mobile.trim() || !profileData.email.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const session = apiService.getSessionInfo();
      const locationData = apiService.getLoginLocationData();

      const formData = new FormData();
      formData.append('sUserID', session.userID || '');
      formData.append('sSessionID', session.sessionID || '');
      formData.append('sCompanyID', session.companyID || '');
      formData.append('sEmployeeCode', sessionInfo.employeeCode || '');
      formData.append('sPassword', profileData.password || '');
      formData.append('sMobileNo', profileData.mobile || '');
      formData.append('sEmail', profileData.email || '');
      formData.append('sDeviceID', locationData?.deviceID || '');

      if (profilePhoto && profilePhoto.startsWith('file://')) {
        formData.append('sPhoto', {
          uri: profilePhoto,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/SignInService/profileUpdate',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      const result = JSON.parse(responseText);

      if (result.messageCode === '0') {
        Alert.alert('Success', 'Profile updated successfully!');
        setShowProfileModal(false);
        await loadSessionInfo();
        await loadUserPhoto();
      } else {
        Alert.alert('Error', result.messageDesc || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await apiService.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const openUpdateProfile = () => {
    setShowProfileModal(true);
  };

  const handleServiceReportPress = () => {
    navigation.navigate('ServiceReport');
  };

  const handleAttendancePress = () => {
    const attendanceDetails = `Attendance Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Check-in Time: ${checkInInfo.time} ${checkInInfo.period}
📆 Date: ${checkInInfo.date}
⏱️ Duration: ${checkInInfo.duration}
📊 Status: ${attendanceData.status}
🕐 Working Hours: ${attendanceData.workingHours || 'N/A'}

👤 Employee: ${sessionInfo.userName}
🆔 Employee Code: ${sessionInfo.employeeCode}
🏢 Department: ${sessionInfo.department}`;

    Alert.alert('Attendance Details', attendanceDetails, [{ text: 'Close' }]);
  };

  const handleRefreshPress = async () => {
    setRefreshing(true);
    Alert.alert('Refreshing...', 'Updating all data from server');
    
    try {
      await Promise.all([
        loadSessionInfo(),
        loadUserPhoto(),
        loadNotifications(),
        loadAttendanceData()
      ]);
      
      Alert.alert('Success', 'All data refreshed successfully!');
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh some data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnquiryPress = () => {
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const dateString = currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    Alert.alert(
      'Enquiry',
      `Current Time: ${timeString}\nDate: ${dateString}`,
      [{ text: 'OK' }]
    );
  };

  const handleLiveTracking = async () => {
    try {
      const session = apiService.getSessionInfo();
      const currentDate = new Date().toLocaleDateString('en-GB');
      
      const formData = new FormData();
      formData.append('sUserID', session.userID);
      formData.append('sSessionID', session.sessionID);
      formData.append('sCompanyID', session.companyID);
      formData.append('sProcessDate', currentDate);
      formData.append('sEmployeeCode', sessionInfo.employeeCode);

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/LiveTrackingService/liveTracking',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.messageCode === '0' && result.trackingList) {
          const trackingText = result.trackingList.map((track: any) => 
            `${track.timestamp}: ${track.location || 'Unknown location'}`
          ).join('\n');
          
          Alert.alert(
            `Live Tracking - ${currentDate}`,
            trackingText || 'No tracking data available'
          );
        } else {
          Alert.alert('Info', 'No tracking data available for today');
        }
      }
    } catch (error) {
      console.error('Live tracking error:', error);
      Alert.alert('Error', 'Failed to load tracking data');
    }
  };

  const handleTerritoryHistory = async () => {
    try {
      const session = apiService.getSessionInfo();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30); // Last 30 days
      
      const formData = new FormData();
      formData.append('sUserID', session.userID);
      formData.append('sSessionID', session.sessionID);
      formData.append('sCompanyID', session.companyID);
      formData.append('sFromDate', fromDate.toLocaleDateString('en-GB'));
      formData.append('sToDate', new Date().toLocaleDateString('en-GB'));
      formData.append('sEmployeeCode', sessionInfo.employeeCode);
      formData.append('sTerritory', '');

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/EnquiryTerritoryHistoryService/territoryHistory',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.messageCode === '0' && result.territoryList) {
          const territoryText = result.territoryList.map((territory: any) => 
            `${territory.visitDate}: ${territory.territory}`
          ).join('\n');
          
          Alert.alert(
            'Territory History (Last 30 days)',
            territoryText || 'No territory visits found'
          );
        } else {
          Alert.alert('Info', 'No territory history available');
        }
      }
    } catch (error) {
      console.error('Territory history error:', error);
      Alert.alert('Error', 'Failed to load territory history');
    }
  };

  const handleNotificationHistory = async () => {
    try {
      const session = apiService.getSessionInfo();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30); // Last 30 days
      
      const formData = new FormData();
      formData.append('sUserID', session.userID);
      formData.append('sSessionID', session.sessionID);
      formData.append('sCompanyID', session.companyID);
      formData.append('sFromDate', fromDate.toLocaleDateString('en-GB'));
      formData.append('sToDate', new Date().toLocaleDateString('en-GB'));
      formData.append('sEmployeeCode', sessionInfo.employeeCode);

      const response = await fetch(
        'http://86.96.193.135/srvsat/webapi/EnquiryNotificationService/pushNotificationEnquiry',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.messageCode === '0' && result.notificationList) {
          const notificationText = result.notificationList.map((notif: any) => 
            `${notif.messageDate}: ${notif.messageTitle}`
          ).join('\n\n');
          
          Alert.alert(
            'Notification History (Last 30 days)',
            notificationText || 'No notifications found'
          );
        } else {
          Alert.alert('Info', 'No notification history available');
        }
      }
    } catch (error) {
      console.error('Notification history error:', error);
      Alert.alert('Error', 'Failed to load notification history');
    }
  };

  const handleNotificationPress = () => {
    if (notifications.length > 0) {
      const notificationText = notifications.slice(0, 5).map((notif, index) => 
        `${index + 1}. ${notif.messageTitle}\n   ${notif.messageDate}`
      ).join('\n\n');
      
      Alert.alert(
        `Notifications (${unreadNotificationCount} unread)`,
        notificationText || 'No notifications'
      );
    } else {
      Alert.alert('Notifications', 'No notifications available');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleProfilePhotoPress}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.headerProfileImage} />
            ) : (
              <View style={styles.headerProfilePlaceholder}>
                <Text style={styles.headerProfileText}>👤</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{sessionInfo.userName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationIcon} onPress={handleNotificationPress}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* Virtual Card */}
        <View style={styles.virtualCard}>
          <View style={styles.cardContent}>
            <Text style={styles.cardRole}>{sessionInfo.designation}</Text>
            <Text style={styles.cardName}>{sessionInfo.userName}</Text>
            <Text style={styles.cardCode}>Code: {sessionInfo.staffID}</Text>
            <Text style={styles.cardCompany}>PRIME TECHNOLOGIES</Text>
          </View>
          
          <View style={styles.cardRight}>
            <TouchableOpacity style={styles.updateProfileButton} onPress={openUpdateProfile}>
              <Text style={styles.updateProfileIcon}>✏️</Text>
              <Text style={styles.updateProfileText}>Update Profile</Text>
            </TouchableOpacity>
            
            <Text style={styles.virtualCardLabel}>Virtual Card</Text>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeRow}>
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
              </View>
              <View style={styles.qrCodeRow}>
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
              </View>
              <View style={styles.qrCodeRow}>
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
              </View>
              <View style={styles.qrCodeRow}>
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
              </View>
              <View style={styles.qrCodeRow}>
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeWhite]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
                <View style={[styles.qrCodeDot, styles.qrCodeBlack]} />
              </View>
            </View>
          </View>
        </View>

        {/* Check In Status */}
        <View style={styles.checkInCard}>
          <View style={styles.checkInIcon}>
            <Text style={styles.checkIcon}>
              {checkInInfo.time !== '--:--' ? '✅' : '⏰'}
            </Text>
          </View>
          <View style={styles.checkInInfo}>
            <Text style={styles.checkInLabel}>
              {checkInInfo.time !== '--:--' ? 'Logged In at' : 'Not Logged In'}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={styles.checkInTime}>{checkInInfo.time}</Text>
              <Text style={styles.checkInPeriod}>{checkInInfo.period}</Text>
              <Text style={styles.checkInDate}>{checkInInfo.date}</Text>
            </View>
            <Text style={styles.duration}>Session Duration: {sessionDuration}</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#FFE6F2' }]}
            onPress={handleServiceReportPress}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Service Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#E6F9E6' }]}
            onPress={handleAttendancePress}
          >
            <Text style={styles.menuIcon}>🕐</Text>
            <Text style={styles.menuText}>Attendance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#FFF2E6' }]}
            onPress={handleNotificationPress}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notification</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.menuNotificationBadge}>
                <Text style={styles.menuNotificationBadgeText}>{unreadNotificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#E6F2FF' }]}
            onPress={handleEnquiryPress}
          >
            <Text style={styles.menuIcon}>🔍</Text>
            <Text style={styles.menuText}>Enquiry</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleAttendancePress}>
          <Text style={styles.navIcon}>🕐</Text>
          <Text style={styles.navText}>Attendance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleServiceReportPress}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Text style={styles.navIcon}>🚪</Text>
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Update Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Profile</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            
            <TouchableOpacity style={styles.photoSection} onPress={handleProfilePhotoPress}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.modalProfilePhoto} />
              ) : (
                <View style={styles.modalPhotoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.name}
                onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                placeholder="Enter your name"
                editable={!loading}
              />

              <Text style={styles.fieldLabel}>Staff ID</Text>
              <TextInput
                style={[styles.fieldInput, styles.disabledInput]}
                value={profileData.staffID}
                editable={false}
              />

              <Text style={styles.fieldLabel}>Mobile</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.mobile}
                onChangeText={(text) => setProfileData({ ...profileData, mobile: text })}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                editable={!loading}
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.email}
                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.fieldLabel}>New Password (Optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.password}
                onChangeText={(text) => setProfileData({ ...profileData, password: text })}
                placeholder="Enter new password"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Text style={styles.saveButtonText}>Save</Text>
                  <Text style={styles.saveIcon}>💾</Text>
                </View>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#1DA1C4',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  headerProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  headerProfilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerProfileText: {
    fontSize: 22,
    color: 'white',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  notificationIcon: {
    padding: 10,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 28,
    color: 'white',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  
  // Virtual Card
  virtualCard: {
    backgroundColor: '#C8E9F0',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
  },
  cardRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1DA1C4',
    marginBottom: 4,
  },
  cardCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardCompany: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
    lineHeight: 14,
    fontWeight: '500',
  },
  updateProfileButton: {
    backgroundColor: '#1DA1C4',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  updateProfileIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  updateProfileText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  virtualCardLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 6,
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  qrCodeDot: {
    width: 6,
    height: 6,
    marginRight: 1,
  },
  qrCodeBlack: {
    backgroundColor: '#000',
  },
  qrCodeWhite: {
    backgroundColor: '#fff',
  },
  
  // Check In Card
  checkInCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkInIcon: {
    marginRight: 12,
  },
  checkIcon: {
    fontSize: 20,
    color: '#4CAF50',
  },
  checkInInfo: {
    flex: 1,
  },
  checkInLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  checkInPeriod: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  checkInDate: {
    fontSize: 12,
    color: '#999',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  
  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
  },
  menuItem: {
    width: '48%',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  menuIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  menuNotificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuNotificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Bottom Section
  bottomSpacer: {
    height: 80,
  },
  
  // Bottom Navigation
  bottomNav: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    fontSize: 20,
    color: '#999',
    marginBottom: 5,
  },
  activeNavIcon: {
    color: '#1DA1C4',
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  activeNavText: {
    color: '#1DA1C4',
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  modalProfilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 40,
    color: '#ccc',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#1DA1C4',
    borderRadius: 25,
    paddingVertical: 15,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  saveIcon: {
    fontSize: 18,
  },
});

export default DashboardScreen;