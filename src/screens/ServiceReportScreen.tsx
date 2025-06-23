// src/screens/ServiceReportScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ServiceReportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ServiceReport'>;

interface Props {
  navigation: ServiceReportScreenNavigationProp;
}

interface PartsItem {
  id: string;
  partsRequired: string;
  brandName: string;
  modelName: string;
  partNumber: string;
  quantity: string;
}

interface ServiceDetails {
  brand?: string;
  noOfLoopsZone?: string;
  type?: string;
  fireHoseReel?: string;
  fireExtinguisher?: string;
  firePump?: string;
  others?: string;
}

interface ServiceReportData {
  // Header Information
  serviceReportNo: string;
  serviceReportDate: string;
  nextPPMDate: string;
  
  // Job Details
  jobNo: string;
  jobDate: string;
  lpoNo: string;
  jobType: string;
  otherJobType: string;
  customer: string;
  siteName: string;
  siteNo: string;
  location: string;
  dcdNo: string;
  callReceivedTime: string;
  timeIn: string;
  timeOut: string;
  totalTime: string;
  
  // Engineers
  selectedEngineers: string[];
  
  // Service Details
  serviceType: string;
  serviceDetails: ServiceDetails;
  observation: string;
  
  // Parts
  partsItems: PartsItem[];
  
  // Additional sections
  faultIdentification: string;
  recommendation: string;
  customerComments: string;
  
  // Signatures
  technicianName: string;
  technicianDate: string;
  customerName: string;
  customerDate: string;
}

const ServiceReportScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<ServiceReportData>({
    serviceReportNo: '',
    serviceReportDate: new Date().toLocaleDateString('en-GB'),
    nextPPMDate: '',
    jobNo: '',
    jobDate: '',
    lpoNo: '',
    jobType: '',
    otherJobType: '',
    customer: '',
    siteName: '',
    siteNo: '',
    location: '',
    dcdNo: '',
    callReceivedTime: '',
    timeIn: '',
    timeOut: '',
    totalTime: '',
    selectedEngineers: [],
    serviceType: '',
    serviceDetails: {},
    observation: '',
    partsItems: [],
    faultIdentification: '',
    recommendation: '',
    customerComments: '',
    technicianName: '',
    technicianDate: '',
    customerName: '',
    customerDate: '',
  });

  const [showDatePicker, setShowDatePicker] = useState<{show: boolean, field: string}>({show: false, field: ''});
  const [showTimePicker, setShowTimePicker] = useState<{show: boolean, field: string}>({show: false, field: ''});
  const [showDateTimePicker, setShowDateTimePicker] = useState<{show: boolean, field: string}>({show: false, field: ''});
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [tempSelectedEngineers, setTempSelectedEngineers] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  
  // Current parts form data
  const [currentParts, setCurrentParts] = useState({
    partsRequired: '',
    brandName: '',
    modelName: '',
    partNumber: '',
    quantity: '',
  });

  const engineers = [
    'Ali Hassan',
    'Tom Jone',
    'Ahmed Ali',
    'John Smith',
    'Mohammed Ahmed',
    'David Wilson',
    'Omar Hassan',
    'Michael Brown'
  ];

  const jobTypes = [
    'Site Survey',
    'PPM',
    'Fitt-Out',
    'Rectification',
    'Call-Out',
    'Others'
  ];

  const customers = [
    'Emirates NBD',
    'Dubai Municipality',
    'ADNOC',
    'Dubai Airports',
    'Emaar Properties',
    'Nakheel',
    'DEWA',
    'Dubai Health Authority',
    'Dubai Police',
    'RTA Dubai'
  ];

  const locations = [
    'Dubai Marina',
    'Downtown Dubai',
    'Business Bay',
    'Jumeirah',
    'Deira',
    'Bur Dubai',
    'Al Barsha',
    'Dubai Investment Park',
    'International City',
    'Dubai Silicon Oasis',
    'Sharjah',
    'Ajman',
    'Abu Dhabi',
    'Al Ain',
    'Fujairah'
  ];

  const serviceTypes = [
    'Fire Alarm',
    'Emergency Lighting',
    'Fire Fighting',
    'ELV System',
    'HVAC System'
  ];

  // Calculate total time when time in/out changes
  useEffect(() => {
    if (formData.timeIn && formData.timeOut) {
      try {
        // Parse datetime strings (format: "DD/MM/YYYY HH:MM")
        const parseDateTime = (dateTimeStr: string) => {
          const [datePart, timePart] = dateTimeStr.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hours, minutes] = timePart.split(':');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
        };
        
        const timeInDate = parseDateTime(formData.timeIn);
        const timeOutDate = parseDateTime(formData.timeOut);
        
        if (timeOutDate > timeInDate) {
          const diffMs = timeOutDate.getTime() - timeInDate.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          const totalTime = `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}`;
          updateFormData('totalTime', totalTime);
        } else {
          updateFormData('totalTime', '');
        }
      } catch (error) {
        console.log('Error calculating time difference:', error);
        updateFormData('totalTime', '');
      }
    } else {
      updateFormData('totalTime', '');
    }
  }, [formData.timeIn, formData.timeOut]);

  // Auto-fill customer name in signature when customer is selected
  useEffect(() => {
    if (formData.customer) {
      updateFormData('customerName', formData.customer);
    }
  }, [formData.customer]);

  const updateFormData = (field: keyof ServiceReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateServiceDetails = (field: keyof ServiceDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceDetails: { ...prev.serviceDetails, [field]: value }
    }));
  };

  const handleDateSelect = (field: string) => {
    // Set current date or existing field value as selected date
    const currentValue = formData[field as keyof ServiceReportData] as string;
    if (currentValue) {
      const [day, month, year] = currentValue.split('/');
      setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
      setCalendarMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
    } else {
      setSelectedDate(new Date());
      setCalendarMonth(new Date());
    }
    setShowDatePicker({show: true, field});
  };

  const confirmDateSelection = () => {
    const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
    updateFormData(showDatePicker.field as keyof ServiceReportData, formattedDate);
    setShowDatePicker({show: false, field: ''});
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDays}>
          {dayNames.map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    );
  };

  const handleTimeSelect = (field: string) => {
    setShowTimePicker({show: true, field});
  };

  const handleDateTimeSelect = (field: string) => {
    // Set current datetime or existing field value as selected datetime
    const currentValue = formData[field as keyof ServiceReportData] as string;
    if (currentValue && currentValue.includes(' ')) {
      const [datePart, timePart] = currentValue.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes] = timePart.split(':');
      setSelectedDateTime(new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)));
      setCalendarMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
    } else {
      setSelectedDateTime(new Date());
      setCalendarMonth(new Date());
    }
    setShowDateTimePicker({show: true, field});
  };

  const confirmDateTimeSelection = () => {
    const formattedDateTime = `${selectedDateTime.getDate().toString().padStart(2, '0')}/${(selectedDateTime.getMonth() + 1).toString().padStart(2, '0')}/${selectedDateTime.getFullYear()} ${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`;
    updateFormData(showDateTimePicker.field as keyof ServiceReportData, formattedDateTime);
    setShowDateTimePicker({show: false, field: ''});
  };

  const updateDateTime = (type: 'date' | 'hour' | 'minute', value: number) => {
    const newDateTime = new Date(selectedDateTime);
    
    if (type === 'date') {
      newDateTime.setDate(value);
    } else if (type === 'hour') {
      newDateTime.setHours(value);
    } else if (type === 'minute') {
      newDateTime.setMinutes(value);
    }
    
    setSelectedDateTime(newDateTime);
  };

  const renderDateTimeCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const isSelected = selectedDateTime.getDate() === day && 
                        selectedDateTime.getMonth() === calendarMonth.getMonth() && 
                        selectedDateTime.getFullYear() === calendarMonth.getFullYear();
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay
          ]}
          onPress={() => updateDateTime('date', day)}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.dateTimeContainer}>
        {/* Calendar */}
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </Text>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDays}>
            {dayNames.map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {days}
          </View>
        </View>
        
        {/* Time Picker */}
        <View style={styles.timePicker}>
          <Text style={styles.timePickerTitle}>Select Time</Text>
          
          <View style={styles.timePickerRow}>
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerLabel}>Hour</Text>
              <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                {Array.from({length: 24}, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.timeOption,
                      selectedDateTime.getHours() === i && styles.selectedTimeOption
                    ]}
                    onPress={() => updateDateTime('hour', i)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedDateTime.getHours() === i && styles.selectedTimeOptionText
                    ]}>
                      {i.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerLabel}>Minute</Text>
              <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                {Array.from({length: 60}, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.timeOption,
                      selectedDateTime.getMinutes() === i && styles.selectedTimeOption
                    ]}
                    onPress={() => updateDateTime('minute', i)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedDateTime.getMinutes() === i && styles.selectedTimeOptionText
                    ]}>
                      {i.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleEngineerSelection = (engineer: string) => {
    setTempSelectedEngineers(prev => {
      if (prev.includes(engineer)) {
        return prev.filter(e => e !== engineer);
      } else {
        return [...prev, engineer];
      }
    });
  };

  const applyEngineerSelection = () => {
    updateFormData('selectedEngineers', tempSelectedEngineers);
    setShowEngineerModal(false);
  };

  const addPartsItem = () => {
    if (!currentParts.partsRequired.trim()) {
      Alert.alert('Validation', 'Parts Required field is mandatory');
      return;
    }

    const newItem: PartsItem = {
      id: Date.now().toString(),
      ...currentParts
    };

    setFormData(prev => ({
      ...prev,
      partsItems: [...prev.partsItems, newItem]
    }));

    // Clear current parts form
    setCurrentParts({
      partsRequired: '',
      brandName: '',
      modelName: '',
      partNumber: '',
      quantity: '',
    });
  };

  const deletePartsItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      partsItems: prev.partsItems.filter(item => item.id !== id)
    }));
  };

  const renderServiceDetailsFields = () => {
    switch (formData.serviceType) {
      case 'Fire Alarm':
        return (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.brand || ''}
                onChangeText={(text) => updateServiceDetails('brand', text)}
                placeholder="Enter brand"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>No. of Loops/Zone</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.noOfLoopsZone || ''}
                onChangeText={(text) => updateServiceDetails('noOfLoopsZone', text)}
                placeholder="Enter number of loops/zone"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Others</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.others || ''}
                onChangeText={(text) => updateServiceDetails('others', text)}
                placeholder="Enter other details"
              />
            </View>
          </>
        );

      case 'Emergency Lighting':
        return (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.brand || ''}
                onChangeText={(text) => updateServiceDetails('brand', text)}
                placeholder="Enter brand"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Type</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.type || ''}
                onChangeText={(text) => updateServiceDetails('type', text)}
                placeholder="Enter type"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Others</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.others || ''}
                onChangeText={(text) => updateServiceDetails('others', text)}
                placeholder="Enter other details"
              />
            </View>
          </>
        );

      case 'Fire Fighting':
        return (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand (Fire Hose Reel)</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.fireHoseReel || ''}
                onChangeText={(text) => updateServiceDetails('fireHoseReel', text)}
                placeholder="Enter fire hose reel brand"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand (Fire Extinguisher)</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.fireExtinguisher || ''}
                onChangeText={(text) => updateServiceDetails('fireExtinguisher', text)}
                placeholder="Enter fire extinguisher brand"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand (Fire Pump)</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.firePump || ''}
                onChangeText={(text) => updateServiceDetails('firePump', text)}
                placeholder="Enter fire pump brand"
              />
            </View>
          </>
        );

      case 'ELV System':
      case 'HVAC System':
        return (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.brand || ''}
                onChangeText={(text) => updateServiceDetails('brand', text)}
                placeholder="Enter brand"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Type</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.type || ''}
                onChangeText={(text) => updateServiceDetails('type', text)}
                placeholder="Enter type"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Others</Text>
              <TextInput
                style={styles.input}
                value={formData.serviceDetails.others || ''}
                onChangeText={(text) => updateServiceDetails('others', text)}
                placeholder="Enter other details"
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.serviceReportNo || !formData.customer || !formData.siteName) {
      Alert.alert('Validation Error', 'Please fill in required fields: Service Report No, Customer, and Site Name');
      return;
    }

    Alert.alert(
      'Save Service Report',
      'Service report saved successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Form',
      'Are you sure you want to clear all data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setFormData({
              serviceReportNo: '',
              serviceReportDate: new Date().toLocaleDateString('en-GB'),
              nextPPMDate: '',
              jobNo: '',
              jobDate: '',
              lpoNo: '',
              jobType: '',
              otherJobType: '',
              customer: '',
              siteName: '',
              siteNo: '',
              location: '',
              dcdNo: '',
              callReceivedTime: '',
              timeIn: '',
              timeOut: '',
              totalTime: '',
              selectedEngineers: [],
              serviceType: '',
              serviceDetails: {},
              observation: '',
              partsItems: [],
              faultIdentification: '',
              recommendation: '',
              customerComments: '',
              technicianName: '',
              technicianDate: '',
              customerName: '',
              customerDate: '',
            });
            setCurrentParts({
              partsRequired: '',
              brandName: '',
              modelName: '',
              partNumber: '',
              quantity: '',
            });
          }
        }
      ]
    );
  };

  const PickerField = ({ label, value, options, onValueChange }: {
    label: string;
    value: string;
    options: string[];
    onValueChange: (value: string) => void;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.pickerButton}
        onPress={() => {
          Alert.alert(
            `Select ${label}`,
            '',
            [
              ...options.map(option => ({
                text: option,
                onPress: () => onValueChange(option)
              })),
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }}
      >
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || `Select ${label}`}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const DateField = ({ label, value, onPress }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={onPress}>
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || 'Select Date'}
        </Text>
        <Text style={styles.dropdownIcon}>📅</Text>
      </TouchableOpacity>
    </View>
  );

  const DateTimeField = ({ label, value, onPress }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={onPress}>
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || 'Select Date & Time'}
        </Text>
        <Text style={styles.dropdownIcon}>📅🕐</Text>
      </TouchableOpacity>
    </View>
  );

  const TimeField = ({ label, value, onPress }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={onPress}>
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || 'Select Time'}
        </Text>
        <Text style={styles.dropdownIcon}>🕐</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1DA1C4" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SERVICE REPORT</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Information */}
        <View style={styles.section}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Service Report No *</Text>
            <TextInput
              style={styles.input}
              value={formData.serviceReportNo}
              onChangeText={(text) => updateFormData('serviceReportNo', text)}
              placeholder="Enter service report number"
            />
          </View>

          <DateField
            label="Service Report Date"
            value={formData.serviceReportDate}
            onPress={() => handleDateSelect('serviceReportDate')}
          />

          <DateField
            label="Next PPM Date"
            value={formData.nextPPMDate}
            onPress={() => handleDateSelect('nextPPMDate')}
          />
        </View>

        {/* Job Card Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Card Detail(s)</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Job No</Text>
            <TextInput
              style={styles.input}
              value={formData.jobNo}
              onChangeText={(text) => updateFormData('jobNo', text)}
              placeholder="Enter job number"
            />
          </View>

          <DateField
            label="Job Date"
            value={formData.jobDate}
            onPress={() => handleDateSelect('jobDate')}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>LPO No</Text>
            <TextInput
              style={styles.input}
              value={formData.lpoNo}
              onChangeText={(text) => updateFormData('lpoNo', text)}
              placeholder="Enter LPO number"
            />
          </View>

          <PickerField
            label="Job Type"
            value={formData.jobType}
            options={jobTypes}
            onValueChange={(value) => updateFormData('jobType', value)}
          />

          {formData.jobType === 'Others' && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Others Job Type</Text>
              <TextInput
                style={styles.input}
                value={formData.otherJobType}
                onChangeText={(text) => updateFormData('otherJobType', text)}
                placeholder="Specify other job type"
              />
            </View>
          )}

          <PickerField
            label="Customer *"
            value={formData.customer}
            options={customers}
            onValueChange={(value) => updateFormData('customer', value)}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Site Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.siteName}
              onChangeText={(text) => updateFormData('siteName', text)}
              placeholder="Enter site name"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Site No.</Text>
            <TextInput
              style={styles.input}
              value={formData.siteNo}
              onChangeText={(text) => updateFormData('siteNo', text)}
              placeholder="Enter site number"
            />
          </View>

          <PickerField
            label="Location"
            value={formData.location}
            options={locations}
            onValueChange={(value) => updateFormData('location', value)}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>24 x 7 DCD No.</Text>
            <TextInput
              style={styles.input}
              value={formData.dcdNo}
              onChangeText={(text) => updateFormData('dcdNo', text)}
              placeholder="Enter DCD number"
            />
          </View>
        </View>

        {/* Time Details */}
        <View style={styles.section}>
          <TimeField
            label="Call Received Time"
            value={formData.callReceivedTime}
            onPress={() => handleTimeSelect('callReceivedTime')}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <DateTimeField
                label="Time In"
                value={formData.timeIn}
                onPress={() => handleDateTimeSelect('timeIn')}
              />
            </View>
            <View style={styles.timeField}>
              <DateTimeField
                label="Time Out"
                value={formData.timeOut}
                onPress={() => handleDateTimeSelect('timeOut')}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Total Time</Text>
            <View style={styles.totalTimeContainer}>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.totalTime}
                editable={false}
                placeholder="Auto-calculated"
              />
              {formData.totalTime && (
                <Text style={styles.totalTimeUnit}>hours</Text>
              )}
            </View>
          </View>
        </View>

        {/* Engineers */}
        <View style={styles.section}>
          <View style={styles.engineerHeader}>
            <Text style={styles.sectionTitle}>Engineers / Technicians Detail(s)</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                setTempSelectedEngineers([...formData.selectedEngineers]);
                setShowEngineerModal(true);
              }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {formData.selectedEngineers.map((engineer, index) => (
            <View key={index} style={styles.engineerItem}>
              <Text style={styles.engineerText}>{index + 1}. {engineer}</Text>
            </View>
          ))}
          
          {formData.selectedEngineers.length === 0 && (
            <Text style={styles.placeholderText}>No engineers selected</Text>
          )}
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Detail(s)</Text>
          
          <PickerField
            label="Type"
            value={formData.serviceType}
            options={serviceTypes}
            onValueChange={(value) => {
              updateFormData('serviceType', value);
              updateFormData('serviceDetails', {}); // Reset service details when type changes
            }}
          />

          {renderServiceDetailsFields()}
        </View>

        {/* Observation */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Observation</Text>
          <TextInput
            style={styles.textArea}
            value={formData.observation}
            onChangeText={(text) => updateFormData('observation', text)}
            placeholder="Enter observation details..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Fault Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fault Identification, Faulty Item and Rectification Detail(s)</Text>
          <TextInput
            style={styles.textArea}
            value={formData.faultIdentification}
            onChangeText={(text) => updateFormData('faultIdentification', text)}
            placeholder="Enter fault identification and rectification details..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Parts Required Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parts Required</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Parts Required</Text>
            <TextInput
              style={styles.input}
              value={currentParts.partsRequired}
              onChangeText={(text) => setCurrentParts(prev => ({...prev, partsRequired: text}))}
              placeholder="Enter parts required"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Brand Name</Text>
            <TextInput
              style={styles.input}
              value={currentParts.brandName}
              onChangeText={(text) => setCurrentParts(prev => ({...prev, brandName: text}))}
              placeholder="Enter brand name"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Model Name</Text>
            <TextInput
              style={styles.input}
              value={currentParts.modelName}
              onChangeText={(text) => setCurrentParts(prev => ({...prev, modelName: text}))}
              placeholder="Enter model name"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Part Number</Text>
            <TextInput
              style={styles.input}
              value={currentParts.partNumber}
              onChangeText={(text) => setCurrentParts(prev => ({...prev, partNumber: text}))}
              placeholder="Enter part number"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={currentParts.quantity}
              onChangeText={(text) => setCurrentParts(prev => ({...prev, quantity: text}))}
              placeholder="Enter quantity"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.addPartsButton} onPress={addPartsItem}>
            <Text style={styles.addPartsButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Parts List */}
        {formData.partsItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Added Parts</Text>
            {formData.partsItems.map((item, index) => (
              <View key={item.id} style={styles.partsItem}>
                <View style={styles.partsHeader}>
                  <Text style={styles.partsSlNo}>Sl. No. {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePartsItem(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>DEL</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.partsDetail}>Parts Required: {item.partsRequired}</Text>
                <Text style={styles.partsDetail}>Brand Name: {item.brandName}</Text>
                <Text style={styles.partsDetail}>Model Name: {item.modelName}</Text>
                <Text style={styles.partsDetail}>Part Number: {item.partNumber}</Text>
                <Text style={styles.partsDetail}>Quantity: {item.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Recommendation</Text>
          <TextInput
            style={styles.textArea}
            value={formData.recommendation}
            onChangeText={(text) => updateFormData('recommendation', text)}
            placeholder="Enter recommendations..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Customer Comments */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Customer Comments</Text>
          <TextInput
            style={styles.textArea}
            value={formData.customerComments}
            onChangeText={(text) => updateFormData('customerComments', text)}
            placeholder="Enter customer comments..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For Prime Technologies LLC</Text>
          
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.technicianName}
              onChangeText={(text) => updateFormData('technicianName', text)}
              placeholder="Enter technician name"
            />
          </View>

          <DateField
            label="Date"
            value={formData.technicianDate}
            onPress={() => handleDateSelect('technicianDate')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For Customer</Text>
          
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.customerName}
              editable={false}
              placeholder="Auto-filled from customer selection"
            />
          </View>

          <DateField
            label="Date"
            value={formData.customerDate}
            onPress={() => handleDateSelect('customerDate')}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Engineer Selection Modal */}
      <Modal
        visible={showEngineerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEngineerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Engineers / Technicians</Text>
              <TouchableOpacity onPress={() => setShowEngineerModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={engineers}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.engineerOption,
                    tempSelectedEngineers.includes(item) && styles.engineerOptionSelected
                  ]}
                  onPress={() => handleEngineerSelection(item)}
                >
                  <Text style={[
                    styles.engineerOptionText,
                    tempSelectedEngineers.includes(item) && styles.engineerOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                  {tempSelectedEngineers.includes(item) && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEngineerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalApplyButton}
                onPress={applyEngineerSelection}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal with Calendar */}
      {showDatePicker.show && (
        <Modal
          visible={showDatePicker.show}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker({show: false, field: ''})}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModal}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker({show: false, field: ''})}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {renderCalendar()}
              
              <View style={styles.selectedDateDisplay}>
                <Text style={styles.selectedDateText}>
                  Selected: {selectedDate.toLocaleDateString('en-GB')}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowDatePicker({show: false, field: ''})}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalApplyButton}
                  onPress={confirmDateSelection}
                >
                  <Text style={styles.modalApplyText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Time Picker Modal for Time In/Out */}
      {showDateTimePicker.show && (
        <Modal
          visible={showDateTimePicker.show}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDateTimePicker({show: false, field: ''})}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateTimeModal}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.modalTitle}>Select Date & Time</Text>
                <TouchableOpacity onPress={() => setShowDateTimePicker({show: false, field: ''})}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {renderDateTimeCalendar()}
              
              <View style={styles.selectedDateTimeDisplay}>
                <Text style={styles.selectedDateText}>
                  Selected: {selectedDateTime.toLocaleDateString('en-GB')} {selectedDateTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false})}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowDateTimePicker({show: false, field: ''})}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalApplyButton}
                  onPress={confirmDateTimeSelection}
                >
                  <Text style={styles.modalApplyText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal (for Call Received Time) */}
      {showTimePicker.show && (
        <Modal
          visible={showTimePicker.show}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTimePicker({show: false, field: ''})}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="HH:MM"
                value={formData[showTimePicker.field as keyof ServiceReportData] as string}
                onChangeText={(text) => updateFormData(showTimePicker.field as keyof ServiceReportData, text)}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowTimePicker({show: false, field: ''})}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalApplyButton}
                  onPress={() => setShowTimePicker({show: false, field: ''})}
                >
                  <Text style={styles.modalApplyText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1DA1C4',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1DA1C4',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeField: {
    flex: 0.48,
  },
  engineerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#1DA1C4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  engineerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  engineerText: {
    fontSize: 14,
    color: '#333',
  },
  addPartsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addPartsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  partsItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1DA1C4',
  },
  partsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  partsSlNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1DA1C4',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  partsDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  signatureContainer: {
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  signatureLine: {
    height: 60,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#999',
    padding: 5,
  },
  engineerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  engineerOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  engineerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  engineerOptionTextSelected: {
    color: '#1DA1C4',
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    color: '#1DA1C4',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: '#1DA1C4',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '95%',
    maxWidth: 400,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 15,
  },
  calendar: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1DA1C4',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    width: 40,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#1DA1C4',
  },
  todayDay: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1DA1C4',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#1DA1C4',
    fontWeight: '600',
  },
  selectedDateDisplay: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dateTimeModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '95%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  timePicker: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timePickerColumn: {
    flex: 1,
    marginHorizontal: 10,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  timeScrollView: {
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedTimeOption: {
    backgroundColor: '#1DA1C4',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedDateTimeDisplay: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalTimeUnit: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  dateInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
  },
});

export default ServiceReportScreen;