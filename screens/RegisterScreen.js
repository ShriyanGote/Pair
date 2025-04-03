// screens/LoginScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';


const RegisterScreen = ({ navigation, route }) => {
  const [profileType, setProfileType] = useState('uno');

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
    if (route.params?.profileType) {
      setProfileType(route.params.profileType); // upadated
    }
  }, [navigation, route.params?.profileType]);



  const handleGoogleLogin = async () => {
    try {
      const url = `${API_BASE_URL}/auth/google/login?profile_type=${profileType}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open login URL');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Failed to open Google login');
    }
  };

  const handleGoHome = async () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
  };





  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register with Google</Text>

      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('EmailLogin')}>
        <Text style={styles.link}>Verify Email Instead</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoHome}>
        <Text style={styles.link}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#DB4437', // Google Red
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
  },
});
