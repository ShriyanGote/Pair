// RegisterScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const RegisterScreen = ({ navigation, route }) => {
  const [allFields, setAllFields] = useState(null);

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
    if (route.params?.allFields) {
      setAllFields(route.params.allFields);
    }
  }, [navigation, route.params?.allFields]);

  const handleGoogleLogin = async () => {
    if (!allFields) {
      Alert.alert('Error', 'No registration data found');
      return;
    }

    // build the exact same shape your FastAPI expects:
    const profileData = {
      profile_type: allFields.profile_type,               // snake_case!
      ethnicity:     allFields.ethnicity,
      gender:        allFields.gender,
      interests:     allFields.interests,
      past_activities: allFields.past_activities,
      personality:   allFields.personality,
      social_media_use: allFields.social_media_use,
      occupation:      allFields.occupation,
      bio:             allFields.bio,        // if you added bio
      location:        allFields.location,   // from duo/group step
      looking_for:     allFields.looking_for // from duo/group step
    };

    try {
      const jsonStr = JSON.stringify(profileData);
      const encoded = encodeURIComponent(jsonStr);
      const url = `${API_BASE_URL}/auth/google/login?profile_data=${encoded}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Cannot open login URL');
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to open Google login');
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home', params: { registered: true } }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register with Google</Text>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
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
    backgroundColor: '#DB4437',
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