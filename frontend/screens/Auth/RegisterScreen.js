// RegisterScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const RegisterScreen = ({ navigation, route }) => {
  const [allFields, setAllFields] = useState(null);

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
    if (route.params?.allFields) {
      // Store it in local state
      setAllFields(route.params.allFields);
    }
  }, [navigation, route.params?.allFields]);

  const handleGoogleLogin = async () => {
    console.log('Google login pressed');
    try {
      // If we have an object with the user’s entire data
      // e.g. { profileType, ethnicity, gender, interests, ... }
      // We pass that as a JSON string in profile_data
      let profileData = { profile_type: 'uno' }; // fallback

      if (allFields) {
        // e.g. allFields = {
        //   profileType: 'uno',
        //   ethnicity: 'asian',
        //   gender: 'female',
        //   interests: [...],
        //   pastActivities: [...],
        //   personality: 'Introverted',
        //   socialMediaUse: 5,
        //   occupation: 'Engineer',
        // }
        // We'll rename keys for the back-end if needed.
        profileData = {
          profile_type: allFields.profileType,
          ethnicity: allFields.ethnicity,
          gender: allFields.gender,
          interests: allFields.interests, // array is fine
          past_activities: allFields.pastActivities, // note the snake_case if your callback expects that
          personality: allFields.personality,
          social_media_use: allFields.socialMediaUse,
          occupation: allFields.occupation,
        };
      }

      // Encode as JSON
      const jsonStr = JSON.stringify(profileData);
      const encoded = encodeURIComponent(jsonStr);

      const url = `${API_BASE_URL}/auth/google/login?profile_data=${encoded}`;
      console.log('Opening URL:', url);

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

  useEffect(() => {
    // For debugging: listen to any deep link events
    const handleDeepLink = (event) => {
      console.log('Deep link event:', event.url);
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

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